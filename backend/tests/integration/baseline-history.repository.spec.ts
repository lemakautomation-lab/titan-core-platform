import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { DatabaseService } from "../../src/infrastructure/database/database.service";
import { PrismaPerformanceMeasurementRepository } from "../../src/infrastructure/repositories/performance-measurement/performance-measurement.repository";
import { testPrisma } from "../helpers/prisma-test.client";

describe("Mission 072.2 effective historical measurements", () => {
    it("selects a bounded, tenant-scoped, correction-aware snapshot", async () => {
        const tenantId = randomUUID();
        const otherTenantId = randomUUID();
        const athleteId = randomUUID();
        const otherAthleteId = randomUUID();
        const sportId = randomUUID();
        const metricId = randomUUID();
        const asOf = new Date("2026-09-28T12:00:00.000Z");
        await testPrisma.tenant.create({ data: {
            id: tenantId, name: "Baseline", slug: `baseline-${tenantId}`,
        } });
        await testPrisma.tenant.create({ data: {
            id: otherTenantId, name: "Other baseline", slug: `baseline-${otherTenantId}`,
        } });
        await testPrisma.athlete.create({ data: {
            id: athleteId, tenantId, firstName: "Baseline", lastName: "Athlete",
        } });
        await testPrisma.athlete.create({ data: {
            id: otherAthleteId, tenantId: otherTenantId, firstName: "Other", lastName: "Athlete",
        } });
        await testPrisma.sport.create({ data: {
            id: sportId, tenantId, name: "Baseline sport", slug: `baseline-${sportId}`,
        } });
        await testPrisma.performanceMetric.create({ data: {
            id: metricId, tenantId, athleteId, sportId,
            name: "Speed", slug: "speed", dataType: "DECIMAL",
        } });
        const original = await testPrisma.performanceMeasurement.create({ data: {
            tenantId, athleteId, metricId, value: 10,
            recordedAt: new Date("2026-09-26T12:00:00.000Z"),
            createdAt: new Date("2026-09-26T12:01:00.000Z"),
        } });
        const corrected = await testPrisma.performanceMeasurement.create({ data: {
            tenantId, athleteId, metricId, value: 11,
            recordedAt: new Date("2026-09-26T12:00:00.000Z"),
            createdAt: new Date("2026-09-27T12:00:00.000Z"),
            correctsMeasurementId: original.id,
        } });
        await testPrisma.performanceMeasurement.create({ data: {
            tenantId, athleteId, metricId, value: 99,
            recordedAt: new Date("2026-06-28T12:00:00.000Z"),
            createdAt: new Date("2026-06-28T12:01:00.000Z"),
        } });
        await testPrisma.performanceMeasurement.create({ data: {
            tenantId, athleteId, metricId, value: 88,
            recordedAt: new Date("2026-09-29T12:00:00.000Z"),
            createdAt: new Date("2026-09-28T11:00:00.000Z"),
        } });
        const repo = new PrismaPerformanceMeasurementRepository(new DatabaseService());
        const rows = await repo.listEffectiveHistoryForBaseline(
            tenantId, athleteId, metricId, asOf, 90,
        );
        expect(rows.map(row => row.id)).toEqual([corrected.id]);
        expect(await repo.listEffectiveHistoryForBaseline(
            otherTenantId, athleteId, metricId, asOf, 90,
        )).toEqual([]);
        expect(await repo.listEffectiveHistoryForBaseline(
            tenantId, otherAthleteId, metricId, asOf, 90,
        )).toEqual([]);
    });

    it("rejects invalid scope and date windows before querying", async () => {
        const repo = new PrismaPerformanceMeasurementRepository(new DatabaseService());
        await expect(repo.listEffectiveHistoryForBaseline(
            "", "athlete", "metric", new Date(), 90,
        )).rejects.toThrow();
        await expect(repo.listEffectiveHistoryForBaseline(
            "tenant", "athlete", "metric", new Date("invalid"), 90,
        )).rejects.toThrow();
        await expect(repo.listEffectiveHistoryForBaseline(
            "tenant", "athlete", "metric", new Date(), 0,
        )).rejects.toThrow();
    });
});
