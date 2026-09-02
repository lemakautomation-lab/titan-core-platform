import crypto from "node:crypto";

import {
    beforeAll,
    describe,
    expect,
    it,
} from "vitest";

import { testPrisma } from "../helpers/prisma-test.client";

const ids = {
    tenantA: crypto.randomUUID(),
    tenantB: crypto.randomUUID(),
    athleteA: crypto.randomUUID(),
    athleteASecond: crypto.randomUUID(),
    athleteB: crypto.randomUUID(),
    sportA: crypto.randomUUID(),
    sportB: crypto.randomUUID(),
    metricA: crypto.randomUUID(),
    metricASecond: crypto.randomUUID(),
    metricB: crypto.randomUUID(),
};

function metricData(
    id: string,
    tenantId: string,
    athleteId: string,
    sportId: string,
) {
    return {
        id,
        tenantId,
        athleteId,
        sportId,
        name: `Metric ${id}`,
        slug: `metric-${id}`,
        description: null,
        unit: "score",
        dataType: "NUMBER",
        status: "ACTIVE" as const,
    };
}

function measurementData(
    id: string,
    tenantId: string,
    athleteId: string,
    metricId: string,
) {
    return {
        id,
        tenantId,
        athleteId,
        metricId,
        value: 10,
        recordedAt: new Date("2026-09-02T12:00:00.000Z"),
    };
}

async function expectDatabaseRejection(
    operation: () => Promise<unknown>,
) {
    try {
        await operation();
        throw new Error("Expected database integrity rejection.");
    } catch (error) {
        expect(error).toMatchObject({
            code: "P2003",
        });
    }
}

describe("Performance data composite database integrity", () => {
    beforeAll(async () => {
        await testPrisma.tenant.createMany({
            data: [
                {
                    id: ids.tenantA,
                    name: "R3 Tenant A",
                    slug: `r3-tenant-a-${ids.tenantA}`,
                },
                {
                    id: ids.tenantB,
                    name: "R3 Tenant B",
                    slug: `r3-tenant-b-${ids.tenantB}`,
                },
            ],
        });

        await testPrisma.athlete.createMany({
            data: [
                {
                    id: ids.athleteA,
                    tenantId: ids.tenantA,
                    firstName: "Athlete",
                    lastName: "A",
                    status: "ACTIVE",
                },
                {
                    id: ids.athleteASecond,
                    tenantId: ids.tenantA,
                    firstName: "Athlete",
                    lastName: "A2",
                    status: "ACTIVE",
                },
                {
                    id: ids.athleteB,
                    tenantId: ids.tenantB,
                    firstName: "Athlete",
                    lastName: "B",
                    status: "ACTIVE",
                },
            ],
        });

        await testPrisma.sport.createMany({
            data: [
                {
                    id: ids.sportA,
                    tenantId: ids.tenantA,
                    name: "R3 Sport A",
                    slug: `r3-sport-a-${ids.sportA}`,
                    status: "ACTIVE",
                },
                {
                    id: ids.sportB,
                    tenantId: ids.tenantB,
                    name: "R3 Sport B",
                    slug: `r3-sport-b-${ids.sportB}`,
                    status: "ACTIVE",
                },
            ],
        });

        await testPrisma.performanceMetric.createMany({
            data: [
                metricData(
                    ids.metricA,
                    ids.tenantA,
                    ids.athleteA,
                    ids.sportA,
                ),
                metricData(
                    ids.metricASecond,
                    ids.tenantA,
                    ids.athleteASecond,
                    ids.sportA,
                ),
                metricData(
                    ids.metricB,
                    ids.tenantB,
                    ids.athleteB,
                    ids.sportB,
                ),
            ],
        });
    });

    it("rejects a cross-tenant Metric to Athlete write without persistence", async () => {
        const id = crypto.randomUUID();

        await expectDatabaseRejection(() =>
            testPrisma.performanceMetric.create({
                data: metricData(
                    id,
                    ids.tenantA,
                    ids.athleteB,
                    ids.sportA,
                ),
            }),
        );

        expect(
            await testPrisma.performanceMetric.count({ where: { id } }),
        ).toBe(0);
    });

    it("rejects a cross-tenant Metric to Sport write without persistence", async () => {
        const id = crypto.randomUUID();

        await expectDatabaseRejection(() =>
            testPrisma.performanceMetric.create({
                data: metricData(
                    id,
                    ids.tenantA,
                    ids.athleteA,
                    ids.sportB,
                ),
            }),
        );

        expect(
            await testPrisma.performanceMetric.count({ where: { id } }),
        ).toBe(0);
    });

    it("rejects a cross-tenant Measurement to Athlete write without persistence", async () => {
        const id = crypto.randomUUID();

        await expectDatabaseRejection(() =>
            testPrisma.performanceMeasurement.create({
                data: measurementData(
                    id,
                    ids.tenantA,
                    ids.athleteB,
                    ids.metricA,
                ),
            }),
        );

        expect(
            await testPrisma.performanceMeasurement.count({ where: { id } }),
        ).toBe(0);
    });

    it("rejects a cross-tenant Measurement to Metric write without persistence", async () => {
        const id = crypto.randomUUID();

        await expectDatabaseRejection(() =>
            testPrisma.performanceMeasurement.create({
                data: measurementData(
                    id,
                    ids.tenantA,
                    ids.athleteA,
                    ids.metricB,
                ),
            }),
        );

        expect(
            await testPrisma.performanceMeasurement.count({ where: { id } }),
        ).toBe(0);
    });

    it("rejects a same-tenant Measurement whose Metric belongs to another Athlete", async () => {
        const id = crypto.randomUUID();

        await expectDatabaseRejection(() =>
            testPrisma.performanceMeasurement.create({
                data: measurementData(
                    id,
                    ids.tenantA,
                    ids.athleteA,
                    ids.metricASecond,
                ),
            }),
        );

        expect(
            await testPrisma.performanceMeasurement.count({ where: { id } }),
        ).toBe(0);
    });

    it("accepts a fully consistent Metric direct write", async () => {
        const id = crypto.randomUUID();

        const metric = await testPrisma.performanceMetric.create({
            data: metricData(
                id,
                ids.tenantA,
                ids.athleteA,
                ids.sportA,
            ),
        });

        expect(metric).toMatchObject({
            id,
            tenantId: ids.tenantA,
            athleteId: ids.athleteA,
            sportId: ids.sportA,
        });
    });

    it("accepts a fully consistent Measurement direct write", async () => {
        const id = crypto.randomUUID();

        const measurement =
            await testPrisma.performanceMeasurement.create({
                data: measurementData(
                    id,
                    ids.tenantA,
                    ids.athleteA,
                    ids.metricA,
                ),
            });

        expect(measurement).toMatchObject({
            id,
            tenantId: ids.tenantA,
            athleteId: ids.athleteA,
            metricId: ids.metricA,
        });
    });
});
