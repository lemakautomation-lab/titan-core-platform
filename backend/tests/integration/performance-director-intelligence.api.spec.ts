import { randomUUID } from "node:crypto";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../src/app";
import { createTestUser } from "../factories/user.factory";
import { testPrisma } from "../helpers/prisma-test.client";
import { rateLimitModule } from "../../src/infrastructure/composition/rate-limit.module";

const endpoint = "/api/v1/performance-director/intelligence";
const permission = "performance-director.intelligence.read";

async function tokenFor(identity: Awaited<ReturnType<typeof createTestUser>>) {
    const response = await request(app).post("/api/v1/auth/login").send({
        tenantId: identity.tenant.id, email: identity.user.email,
        password: identity.password,
    });
    expect(response.status).toBe(200);
    return response.body.data.accessToken as string;
}

describe("Mission 069.2 department performance intelligence", () => {
    beforeEach(async () => { await rateLimitModule.resetAuthRateLimiter(); });

    it("requires authentication and its own permission", async () => {
        expect((await request(app).get(endpoint)).status).toBe(401);
        const director = await createTestUser({
            permissions: ["performance-director.command-centre.read"],
        });
        const token = await tokenFor(director);
        expect((await request(app).get(endpoint).set("Authorization", `Bearer ${token}`)).status).toBe(403);
    });

    it("rejects unbounded windows and missing department assignment", async () => {
        const director = await createTestUser({ permissions: [permission] });
        const token = await tokenFor(director);
        for (const days of ["0", "91", "30.0", "bad"]) {
            const response = await request(app).get(endpoint).query({ days })
                .set("Authorization", `Bearer ${token}`);
            expect(response.status).toBe(400);
        }
        const noDepartment = await request(app).get(endpoint)
            .set("Authorization", `Bearer ${token}`);
        expect(noDepartment.status).toBe(404);
        expect(noDepartment.body).toEqual({ error: "Department not found." });
    });

    it("aggregates only terminal observations for active athletes in the assigned department", async () => {
        const director = await createTestUser({ permissions: [permission] });
        const tenantId = director.tenant.id;
        const own = await testPrisma.organisation.create({ data: {
            tenantId, name: "Director Department", slug: `director-${randomUUID()}`,
        } });
        const other = await testPrisma.organisation.create({ data: {
            tenantId, name: "Other Department", slug: `other-${randomUUID()}`,
        } });
        await testPrisma.user.update({ where: { id: director.user.id }, data: {
            organisationId: own.id,
        } });
        const sport = await testPrisma.sport.create({ data: {
            tenantId, name: "Test sport", slug: `sport-${randomUUID()}`,
        } });
        const measuredAt = new Date(Date.now() - 24 * 60 * 60 * 1000);
        for (const [organisation, status] of [[own, "ACTIVE"], [other, "ACTIVE"], [own, "INACTIVE"]] as const) {
            const athlete = await testPrisma.athlete.create({ data: {
                tenantId, organisationId: organisation.id, status,
                firstName: "Scope", lastName: "Athlete",
            } });
            const metric = await testPrisma.performanceMetric.create({ data: {
                tenantId, athleteId: athlete.id, sportId: sport.id,
                name: "Observed metric", slug: `metric-${randomUUID()}`, dataType: "NUMBER",
            } });
            const original = await testPrisma.performanceMeasurement.create({ data: {
                tenantId, athleteId: athlete.id, metricId: metric.id,
                value: 10, recordedAt: measuredAt,
            } });
            if (organisation.id === own.id && status === "ACTIVE") {
                await testPrisma.performanceMeasurement.create({ data: {
                    tenantId, athleteId: athlete.id, metricId: metric.id,
                    value: 11, recordedAt: measuredAt,
                    correctsMeasurementId: original.id,
                } });
                await testPrisma.performanceMeasurement.create({ data: {
                    tenantId, athleteId: athlete.id, metricId: metric.id,
                    value: 8, recordedAt: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000),
                } });
            }
        }

        const token = await tokenFor(director);
        const response = await request(app).get(endpoint).query({ days: "7" })
            .set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            organisationId: own.id, days: 7, activeAthleteCount: 1,
            measuredAthleteCount: 1, effectiveMeasurementCount: 1,
            latestMeasurementAt: measuredAt.toISOString(),
        });
    });
});
