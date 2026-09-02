import crypto from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";

import { PerformanceMeasurement } from "../../src/domain/entities/performance-measurement/performance-measurement.entity";
import { DatabaseService } from "../../src/infrastructure/database/database.service";
import { PrismaPerformanceMeasurementRepository } from "../../src/infrastructure/repositories/performance-measurement/performance-measurement.repository";
import { testPrisma } from "../helpers/prisma-test.client";

const ids = {
    tenantA: crypto.randomUUID(), tenantB: crypto.randomUUID(),
    athleteA: crypto.randomUUID(), athleteA2: crypto.randomUUID(), athleteB: crypto.randomUUID(),
    sportA: crypto.randomUUID(), sportB: crypto.randomUUID(),
    metricA: crypto.randomUUID(), metricAOther: crypto.randomUUID(), metricA2: crypto.randomUUID(), metricB: crypto.randomUUID(),
};

const repository = new PrismaPerformanceMeasurementRepository(new DatabaseService());

function measurement(sourceObservationId: string, value = 10, correctsMeasurementId: string | null = null) {
    return PerformanceMeasurement.create(
        ids.tenantA, ids.athleteA, ids.metricA, value,
        new Date("2026-09-02T12:00:00.000Z"),
        "SYSTEM", "r4-test-source", sourceObservationId,
        correctsMeasurementId,
    );
}

function directData(overrides: Record<string, unknown> = {}) {
    return {
        id: crypto.randomUUID(), tenantId: ids.tenantA, athleteId: ids.athleteA,
        metricId: ids.metricA, value: 10,
        recordedAt: new Date("2026-09-02T12:00:00.000Z"),
        sourceType: "SYSTEM", sourceId: "r4-direct",
        sourceObservationId: crypto.randomUUID(),
        ...overrides,
    };
}

async function rejected(operation: () => Promise<unknown>) {
    try {
        await operation();
        throw new Error("Expected database rejection");
    } catch (error) {
        const databaseError = error as {
            code?: string;
            cause?: { originalCode?: string };
        };
        expect(
            databaseError.code?.startsWith("P") ||
            Boolean(databaseError.cause?.originalCode),
        ).toBe(true);
    }
}

describe("Performance observation identity and correction contract", () => {
    beforeAll(async () => {
        await testPrisma.tenant.createMany({ data: [
            { id: ids.tenantA, name: "R4 Tenant A", slug: `r4-a-${ids.tenantA}` },
            { id: ids.tenantB, name: "R4 Tenant B", slug: `r4-b-${ids.tenantB}` },
        ] });
        await testPrisma.athlete.createMany({ data: [
            { id: ids.athleteA, tenantId: ids.tenantA, firstName: "A", lastName: "One" },
            { id: ids.athleteA2, tenantId: ids.tenantA, firstName: "A", lastName: "Two" },
            { id: ids.athleteB, tenantId: ids.tenantB, firstName: "B", lastName: "One" },
        ] });
        await testPrisma.sport.createMany({ data: [
            { id: ids.sportA, tenantId: ids.tenantA, name: "R4 Sport A", slug: `r4-a-${ids.sportA}` },
            { id: ids.sportB, tenantId: ids.tenantB, name: "R4 Sport B", slug: `r4-b-${ids.sportB}` },
        ] });
        await testPrisma.performanceMetric.createMany({ data: [
            { id: ids.metricA, tenantId: ids.tenantA, athleteId: ids.athleteA, sportId: ids.sportA, name: "R4 Metric A", slug: "r4-metric-a", unit: "score", dataType: "NUMBER" },
            { id: ids.metricAOther, tenantId: ids.tenantA, athleteId: ids.athleteA, sportId: ids.sportA, name: "R4 Metric Other", slug: "r4-metric-other", unit: "score", dataType: "NUMBER" },
            { id: ids.metricA2, tenantId: ids.tenantA, athleteId: ids.athleteA2, sportId: ids.sportA, name: "R4 Metric A2", slug: "r4-metric-a2", unit: "score", dataType: "NUMBER" },
            { id: ids.metricB, tenantId: ids.tenantB, athleteId: ids.athleteB, sportId: ids.sportB, name: "R4 Metric B", slug: "r4-metric-b", unit: "score", dataType: "NUMBER" },
        ] });
    });

    it("resolves sequential and concurrent identical retries to one UUID", async () => {
        const source = crypto.randomUUID();
        const first = await repository.createIdempotently(measurement(source));
        const sequential = await repository.createIdempotently(measurement(source));
        const concurrentSource = crypto.randomUUID();
        const concurrent = await Promise.all(Array.from({ length: 8 }, () =>
            repository.createIdempotently(measurement(concurrentSource)),
        ));
        expect(first.kind).toBe("created");
        expect(sequential.kind).toBe("replayed");
        if (first.kind === "created" && sequential.kind === "replayed") {
            expect(sequential.measurement.id).toBe(first.measurement.id);
        }
        expect(new Set(concurrent.flatMap(result => "measurement" in result ? [result.measurement.id] : []))).toHaveLength(1);
        expect(await testPrisma.performanceMeasurement.count({ where: { tenantId: ids.tenantA, sourceId: "r4-test-source", sourceObservationId: concurrentSource } })).toBe(1);
    });

    it("arbitrates concurrent conflicting retries without changing the winner", async () => {
        const source = crypto.randomUUID();
        const outcomes = await Promise.all([
            repository.createIdempotently(measurement(source, 10)),
            repository.createIdempotently(measurement(source, 20)),
        ]);
        expect(outcomes.filter(result => result.kind === "created")).toHaveLength(1);
        expect(outcomes.filter(result => result.kind === "idempotency-conflict")).toHaveLength(1);
        expect(await testPrisma.performanceMeasurement.count({ where: { sourceObservationId: source } })).toBe(1);
    });

    it("creates a linear correction, prevents branching, and distinguishes raw from effective history", async () => {
        const original = await repository.createIdempotently(measurement(crypto.randomUUID(), 10));
        expect(original.kind).toBe("created");
        if (original.kind !== "created") throw new Error("Expected original creation");
        const corrections = await Promise.all([
            repository.createIdempotently(measurement(crypto.randomUUID(), 11, original.measurement.id)),
            repository.createIdempotently(measurement(crypto.randomUUID(), 12, original.measurement.id)),
        ]);
        expect(corrections.filter(result => result.kind === "created")).toHaveLength(1);
        expect(corrections.filter(result => result.kind === "correction-conflict")).toHaveLength(1);
        const raw = await repository.listRecentForMetric(ids.tenantA, ids.athleteA, ids.metricA, 100);
        const effective = await repository.listRecentEffectiveForMetric(ids.tenantA, ids.athleteA, ids.metricA, 100);
        const createdCorrection = corrections.find(result => result.kind === "created");
        expect(raw.some(row => row.id === original.measurement.id)).toBe(true);
        expect(effective.some(row => row.id === original.measurement.id)).toBe(false);
        expect(createdCorrection && "measurement" in createdCorrection && effective.some(row => row.id === createdCorrection.measurement.id)).toBe(true);
    });

    it("enforces source completeness and source uniqueness at the database boundary", async () => {
        await rejected(() => testPrisma.performanceMeasurement.create({ data: directData({ sourceId: null }) as never }));
        const identity = crypto.randomUUID();
        await testPrisma.performanceMeasurement.create({ data: directData({ sourceObservationId: identity }) as never });
        await rejected(() => testPrisma.performanceMeasurement.create({ data: directData({ sourceObservationId: identity }) as never }));
    });

    it("enforces correction tenant, Athlete, and Metric scope", async () => {
        const target = await testPrisma.performanceMeasurement.create({ data: directData() as never });
        await rejected(() => testPrisma.performanceMeasurement.create({ data: directData({ metricId: ids.metricAOther, correctsMeasurementId: target.id }) as never }));
        await rejected(() => testPrisma.performanceMeasurement.create({ data: directData({ athleteId: ids.athleteA2, metricId: ids.metricA2, correctsMeasurementId: target.id }) as never }));
        await rejected(() => testPrisma.performanceMeasurement.create({ data: directData({ tenantId: ids.tenantB, athleteId: ids.athleteB, metricId: ids.metricB, correctsMeasurementId: target.id }) as never }));
    });

    it("rejects direct self-correction", async () => {
        const id = crypto.randomUUID();
        await rejected(() => testPrisma.performanceMeasurement.create({ data: directData({ id, correctsMeasurementId: id }) as never }));
        expect(await testPrisma.performanceMeasurement.count({ where: { id } })).toBe(0);
    });
});
