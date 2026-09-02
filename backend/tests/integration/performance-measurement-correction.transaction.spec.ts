import crypto from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";

import { PerformanceMeasurement } from "../../src/domain/entities/performance-measurement/performance-measurement.entity";
import { DatabaseService } from "../../src/infrastructure/database/database.service";
import { PrismaPerformanceMeasurementCorrectionTransaction } from "../../src/infrastructure/transactions/performance-measurement-correction.transaction";
import { testPrisma } from "../helpers/prisma-test.client";

const ids = { tenant: crypto.randomUUID(), athlete: crypto.randomUUID(), sport: crypto.randomUUID(), metric: crypto.randomUUID(), user: crypto.randomUUID() };
let originalId: string;
const correctionRecordedAt = new Date("2026-09-02T14:00:00.000Z");

describe("Performance measurement correction transaction", () => {
    beforeAll(async () => {
        await testPrisma.tenant.create({ data: { id: ids.tenant, name: "R5 Tx", slug: `r5-tx-${ids.tenant}` } });
        await testPrisma.user.create({ data: { id: ids.user, tenantId: ids.tenant, email: `${ids.user}@test.invalid`, passwordHash: "unused" } });
        await testPrisma.athlete.create({ data: { id: ids.athlete, tenantId: ids.tenant, firstName: "R5", lastName: "Tx" } });
        await testPrisma.sport.create({ data: { id: ids.sport, tenantId: ids.tenant, name: "R5 Tx", slug: `r5-tx-${ids.sport}` } });
        await testPrisma.performanceMetric.create({ data: { id: ids.metric, tenantId: ids.tenant, athleteId: ids.athlete, sportId: ids.sport, name: "R5 Tx", slug: "r5-tx", dataType: "DECIMAL" } });
        originalId = (await testPrisma.performanceMeasurement.create({ data: {
            tenantId: ids.tenant, athleteId: ids.athlete, metricId: ids.metric, value: 10,
            sourceType: "DEVICE", sourceId: "tx", sourceObservationId: crypto.randomUUID(),
        } })).id;
    });

    function correction(sourceObservationId: string, target = originalId) {
        return PerformanceMeasurement.create(ids.tenant, ids.athlete, ids.metric, 11, correctionRecordedAt, "USER", ids.user, sourceObservationId, target);
    }

    it("commits one correction and audit, but creates neither on replay or conflict", async () => {
        const transaction = new PrismaPerformanceMeasurementCorrectionTransaction(new DatabaseService());
        const source = crypto.randomUUID();
        const created = await transaction.execute({ measurement: correction(source), actorUserId: ids.user });
        expect(created.kind).toBe("created");
        if (created.kind !== "created") throw new Error("Expected correction creation");
        expect(await testPrisma.auditLog.count({ where: { resourceId: created.measurement.id } })).toBe(1);
        const replay = await transaction.execute({ measurement: correction(source), actorUserId: ids.user });
        expect(replay.kind).toBe("replayed");
        const conflict = await transaction.execute({ measurement: correction(crypto.randomUUID()), actorUserId: ids.user });
        expect(conflict.kind).toBe("correction-conflict");
        expect(await testPrisma.auditLog.count({ where: { resourceId: created.measurement.id } })).toBe(1);
    });

    it("rolls back a newly inserted correction when audit persistence fails", async () => {
        const original = await testPrisma.performanceMeasurement.create({ data: {
            tenantId: ids.tenant, athleteId: ids.athlete, metricId: ids.metric, value: 20,
            sourceType: "DEVICE", sourceId: "tx", sourceObservationId: crypto.randomUUID(),
        } });
        const source = crypto.randomUUID();
        const transaction = new PrismaPerformanceMeasurementCorrectionTransaction(new DatabaseService());
        await expect(transaction.execute({ measurement: correction(source, original.id), actorUserId: crypto.randomUUID() })).rejects.toThrow();
        expect(await testPrisma.performanceMeasurement.count({ where: { tenantId: ids.tenant, sourceObservationId: source } })).toBe(0);
    });
});
