import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../../src/app";
import { rateLimitModule } from "../../../src/infrastructure/composition/rate-limit.module";
import { createTestUser } from "../../factories/user.factory";
import { testPrisma } from "../../helpers/prisma-test.client";

async function login(user: Awaited<ReturnType<typeof createTestUser>>) {
    const response = await request(app).post("/api/v1/auth/login").send({
        tenantId: user.tenant.id, email: user.user.email, password: user.password,
    });
    expect(response.status).toBe(200);
    return response.body.data.accessToken as string;
}

async function athlete(user: { id: string; tenantId: string }) {
    return testPrisma.athlete.create({
        data: { tenantId: user.tenantId, userId: user.id, firstName: "Insight", lastName: "Test", countryCode: "ZA", status: "ACTIVE" },
    });
}

async function metric(user: Awaited<ReturnType<typeof createTestUser>>, a: { id: string }) {
    return testPrisma.performanceMetric.create({
        data: { tenantId: user.tenant.id, athleteId: a.id, sportId: (await testPrisma.sport.create({ data: { tenantId: user.tenant.id, name: `Insight Sport ${a.id}`, slug: `insight-sport-${a.id}` } })).id, name: "Test Metric", slug: `test-${a.id}`, dataType: "NUMBER", status: "ACTIVE" },
    });
}

describe("Authenticated actionable insights", () => {
    beforeEach(async () => { await rateLimitModule.resetAuthRateLimiter(); });

    it("rejects unauthenticated requests", async () => {
        expect((await request(app).get("/api/v1/auth/me/actionable-insights")).status).toBe(401);
    });

    it("returns record-measurement insight", async () => {
        const user = await createTestUser();
        const a = await athlete(user.user);
        await metric(user, a);
        const token = await login(user);
        const response = await request(app).get("/api/v1/auth/me/actionable-insights").set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body.insights[0].type).toBe("RECORD_MEASUREMENT");
    });

    it("returns comparison insight after one measurement", async () => {
        const user = await createTestUser();
        const a = await athlete(user.user);
        const m = await metric(user, a);
        await testPrisma.performanceMeasurement.create({
            data: { tenantId: user.tenant.id, athleteId: a.id, metricId: m.id, value: 10, recordedAt: new Date(), sourceType: "DEVICE", sourceId: "insight-test", sourceObservationId: crypto.randomUUID() },
        });
        const token = await login(user);
        const response = await request(app).get("/api/v1/auth/me/actionable-insights").set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body.insights[0].type).toBe("ESTABLISH_COMPARISON");
    });

    it("returns review insight after two measurements", async () => {
        const user = await createTestUser();
        const a = await athlete(user.user);
        const m = await metric(user, a);
        await testPrisma.performanceMeasurement.createMany({
            data: [
                { tenantId: user.tenant.id, athleteId: a.id, metricId: m.id, value: 10, recordedAt: new Date("2026-09-15"), sourceType: "DEVICE", sourceId: "insight-test", sourceObservationId: crypto.randomUUID() },
                { tenantId: user.tenant.id, athleteId: a.id, metricId: m.id, value: 11, recordedAt: new Date("2026-09-16"), sourceType: "DEVICE", sourceId: "insight-test", sourceObservationId: crypto.randomUUID() },
            ],
        });
        const token = await login(user);
        const response = await request(app).get("/api/v1/auth/me/actionable-insights").set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body.insights[0].type).toBe("REVIEW_SIGNAL");
    });

    it("does not cross tenant boundaries", async () => {
        const userA = await createTestUser(); const userB = await createTestUser(); const aA = await athlete(userA.user); const aB = await athlete(userB.user);
        await metric(userB, aB);
        const tokenA = await login(userA);
        const response = await request(app).get("/api/v1/auth/me/actionable-insights").set("Authorization", `Bearer ${tokenA}`);
        expect(response.status).toBe(200);
        expect(response.body.insights).toEqual([]);
    });

    it("uses authenticated identity instead of client-supplied identity", async () => {
        const user = await createTestUser();
        const a = await athlete(user.user);
        await metric(user, a);
        const token = await login(user);
        const response = await request(app).get("/api/v1/auth/me/actionable-insights?tenantId=other&athleteId=other").set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body.insights).toHaveLength(1);
    });
});
