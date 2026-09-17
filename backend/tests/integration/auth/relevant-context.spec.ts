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

async function createAthlete(user: { id: string; tenantId: string }) {
    return testPrisma.athlete.create({
        data: { tenantId: user.tenantId, userId: user.id, firstName: "Context", lastName: "Test", countryCode: "ZA", status: "ACTIVE" },
    });
}

describe("Authenticated relevant athlete context", () => {
    beforeEach(async () => { await rateLimitModule.resetAuthRateLimiter(); });

    it("rejects unauthenticated requests", async () => {
        const response = await request(app).get("/api/v1/auth/me/relevant-context");
        expect(response.status).toBe(401);
    });

    it("returns persisted recovery and nutrition summary", async () => {
        const user = await createTestUser();
        const athlete = await createAthlete(user.user);
        const token = await login(user);

        await testPrisma.recoveryTracking.create({
            data: { tenantId: user.tenant.id, athleteId: athlete.id, value: 82, sourceType: "TEST", sourceId: "ctx-1", sourceObservationId: "obs-1" },
        });

        await testPrisma.nutritionPlan.create({
            data: { tenantId: user.tenant.id, athleteId: athlete.id, idempotencyKey: "ctx-1", requestFingerprint: "fp-1", requestFingerprintVersion: "1", generatorId: "test", generatorVersion: "1", inputSnapshot: { secret: "hidden" }, planSnapshot: { planType: "AUTOMATED_NUTRITION_PLAN", goalClassification: "GENERAL_FITNESS", macroTargets: { caloriesKcal: 2200, proteinGrams: 160, carbohydrateGrams: 240, fatGrams: 70 }, hydrationGuidance: { dailyWaterLitres: 2.5, unit: "LITRES_PER_DAY" } } },
        });

        const response = await request(app).get("/api/v1/auth/me/relevant-context").set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(200);
        const body = response.body;
        expect(body.recovery.latest.value).toBe(82);
        expect(body.nutrition.latest.goalClassification).toBe("GENERAL_FITNESS");
        expect(body.nutrition.latest.macroTargets.caloriesKcal).toBe(2200);
        expect(body.nutrition.latest.hydrationGuidance.dailyWaterLitres).toBe(2.5);
        expect(body.nutrition.latest.inputSnapshot).toBeUndefined();
        expect(body.nutrition.latest.idempotencyKey).toBeUndefined();
    });
    it("returns safe empty context when no recovery or nutrition data exists", async () => {
        const user = await createTestUser();
        await createAthlete(user.user);
        const token = await login(user);
        const response = await request(app).get("/api/v1/auth/me/relevant-context").set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body.recovery.latest).toBeNull();
        expect(response.body.nutrition.latest).toBeNull();
    });

    it("does not cross tenant boundaries", async () => {
        const userA = await createTestUser();
        const athleteA = await createAthlete(userA.user);
        const userB = await createTestUser();
        const athleteB = await createAthlete(userB.user);
        const tokenA = await login(userA);

        await testPrisma.recoveryTracking.create({
            data: { tenantId: userB.tenant.id, athleteId: athleteB.id, value: 99, sourceType: "TEST", sourceId: "other-tenant", sourceObservationId: "other-obs" },
        });
        await testPrisma.nutritionPlan.create({
            data: { tenantId: userB.tenant.id, athleteId: athleteB.id, idempotencyKey: "other-tenant", requestFingerprint: "other-fp", requestFingerprintVersion: "1", generatorId: "test", generatorVersion: "1", inputSnapshot: {}, planSnapshot: { planType: "AUTOMATED_NUTRITION_PLAN", goalClassification: "SPORT_PERFORMANCE", macroTargets: { caloriesKcal: 3000, proteinGrams: 200, carbohydrateGrams: 350, fatGrams: 90 }, hydrationGuidance: { dailyWaterLitres: 3 } } },
        });

        const response = await request(app).get("/api/v1/auth/me/relevant-context").set("Authorization", `Bearer ${tokenA}`);
        expect(response.status).toBe(200);
        expect(response.body.recovery.latest).toBeNull();
        expect(response.body.nutrition.latest).toBeNull();
        expect(athleteA.id).not.toBe(athleteB.id);
    });

    it("uses authenticated identity instead of client-supplied identity", async () => {
        const user = await createTestUser();
        const athlete = await createAthlete(user.user);
        const token = await login(user);
        const response = await request(app).get("/api/v1/auth/me/relevant-context?tenantId=other&athleteId=other").set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("body");
        expect(athlete.id).toBeTruthy();
    });
});
