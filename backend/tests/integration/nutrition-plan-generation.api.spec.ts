import crypto from "node:crypto";
import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../src/app";
import { createTestUser } from "../factories/user.factory";
import { testPrisma } from "../helpers/prisma-test.client";

const macroTargets = {
    caloriesKcal: 2400,
    proteinGrams: 180,
    carbohydrateGrams: 240,
    fatGrams: 80,
};

const hydrationGuidance = {
    dailyWaterLitres: 2.5,
};

async function login(
    user: Awaited<ReturnType<typeof createTestUser>>,
) {
    const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
            tenantId: user.tenant.id,
            email: user.user.email,
            password: user.password,
        });

    expect(response.status).toBe(200);

    return response.body.data.accessToken as string;
}

async function createActiveAthlete(tenantId: string) {
    return testPrisma.athlete.create({
        data: {
            tenantId,
            firstName: "Nutrition",
            lastName: crypto.randomUUID(),
            status: "ACTIVE",
        },
    });
}

function generation(
    token: string,
    key: string,
    payload: object,
) {
    return request(app)
        .post("/api/v1/nutrition-plans/generations")
        .set("Authorization", `Bearer ${token}`)
        .set("Idempotency-Key", key)
        .send(payload);
}

describe("Nutrition Plan generation API", () => {
    it("requires authentication before generation authorization", async () => {
        const response = await request(app)
            .post("/api/v1/nutrition-plans/generations")
            .set("Idempotency-Key", "r57-auth")
            .send({});

        expect(response.status).toBe(401);
    });

    it("requires the dedicated nutrition generation permission", async () => {
        const user = await createTestUser({
            permissions: ["nutrition-plans.create"],
        });
        const token = await login(user);

        const response = await generation(
            token,
            `r57-denied-${crypto.randomUUID()}`,
            {
                athleteId: crypto.randomUUID(),
                macroTargets,
                hydrationGuidance,
            },
        );

        expect(response.status).toBe(403);
    });

    it("generates and persists an automated nutrition plan for an active athlete", async () => {
        const user = await createTestUser({
            permissions: ["nutrition-plans.generate"],
        });
        const token = await login(user);
        const athlete = await createActiveAthlete(user.tenant.id);
        const key = `r57-create-${crypto.randomUUID()}`;

        const response = await generation(
            token,
            key,
            {
                athleteId: athlete.id,
                macroTargets,
                hydrationGuidance,
                goal: "GENERAL_FITNESS",
                dietaryPreferences: ["HIGH_PROTEIN"],
                dietaryRestrictions: ["PEANUTS"],
                notes: "Baseline automated nutrition context.",
            },
        );

        expect(response.status).toBe(201);
        expect(response.body.id).toEqual(expect.any(String));
        expect(response.body.tenantId).toBe(user.tenant.id);
        expect(response.body.athleteId).toBe(athlete.id);
        expect(response.body.idempotencyKey).toBe(key);
        expect(response.body.generatorId).toBe(
            "TITAN_DETERMINISTIC_NUTRITION",
        );
        expect(response.body.generatorVersion).toBe("1.0.0");
        expect(response.body.planSnapshot).toEqual({
            planType: "AUTOMATED_NUTRITION_PLAN",
            goalClassification: "GENERAL_FITNESS",
            macroTargets,
            hydrationGuidance: {
                dailyWaterLitres: 2.5,
                unit: "LITRES_PER_DAY",
            },
            guidance: expect.arrayContaining([
                "Automated nutrition plan generated from the supplied athlete context.",
            ]),
        });

        const persisted = await testPrisma.nutritionPlan.findUnique({
            where: {
                tenantId_idempotencyKey: {
                    tenantId: user.tenant.id,
                    idempotencyKey: key,
                },
            },
        });

        expect(persisted).not.toBeNull();
        expect(persisted?.athleteId).toBe(athlete.id);
        expect(persisted?.tenantId).toBe(user.tenant.id);
    });

    it("replays the same request without creating a second plan", async () => {
        const user = await createTestUser({
            permissions: ["nutrition-plans.generate"],
        });
        const token = await login(user);
        const athlete = await createActiveAthlete(user.tenant.id);
        const key = `r57-replay-${crypto.randomUUID()}`;
        const payload = {
            athleteId: athlete.id,
            macroTargets,
            hydrationGuidance,
            goal: "GENERAL_FITNESS",
            dietaryPreferences: ["HIGH_PROTEIN"],
        };

        const first = await generation(token, key, payload);
        const second = await generation(token, key, payload);

        expect(first.status).toBe(201);
        expect(second.status).toBe(200);
        expect(second.body.id).toBe(first.body.id);

        expect(
            await testPrisma.nutritionPlan.count({
                where: {
                    tenantId: user.tenant.id,
                    idempotencyKey: key,
                },
            }),
        ).toBe(1);
    });

    it("rejects reuse of an idempotency key for different input", async () => {
        const user = await createTestUser({
            permissions: ["nutrition-plans.generate"],
        });
        const token = await login(user);
        const athlete = await createActiveAthlete(user.tenant.id);
        const key = `r57-conflict-${crypto.randomUUID()}`;

        const first = await generation(token, key, {
            athleteId: athlete.id,
            macroTargets,
            hydrationGuidance,
            goal: "GENERAL_FITNESS",
        });

        const second = await generation(token, key, {
            athleteId: athlete.id,
            macroTargets,
            hydrationGuidance,
            goal: "SPORT_PERFORMANCE",
        });

        expect(first.status).toBe(201);
        expect(second.status).toBe(409);
        expect(second.body.error.code).toBe("IDEMPOTENCY_CONFLICT");
    });

    it("rejects client-supplied authority fields", async () => {
        const user = await createTestUser({
            permissions: ["nutrition-plans.generate"],
        });
        const token = await login(user);
        const athlete = await createActiveAthlete(user.tenant.id);

        const response = await generation(
            token,
            `r57-authority-${crypto.randomUUID()}`,
            {
                athleteId: athlete.id,
                macroTargets,
                hydrationGuidance,
                tenantId: crypto.randomUUID(),
                actorUserId: crypto.randomUUID(),
            },
        );

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects invalid macro targets at the API boundary", async () => {
        const user = await createTestUser({
            permissions: ["nutrition-plans.generate"],
        });
        const token = await login(user);
        const athlete = await createActiveAthlete(user.tenant.id);

        const response = await generation(
            token,
            `r57-invalid-macros-${crypto.randomUUID()}`,
            {
                athleteId: athlete.id,
                macroTargets: {
                    ...macroTargets,
                    proteinGrams: 0,
                },
            },
        );

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects invalid hydration guidance at the API boundary", async () => {
        const user = await createTestUser({
            permissions: ["nutrition-plans.generate"],
        });
        const token = await login(user);
        const athlete = await createActiveAthlete(user.tenant.id);

        const response = await generation(
            token,
            `r57-invalid-hydration-${crypto.randomUUID()}`,
            {
                athleteId: athlete.id,
                macroTargets,
                hydrationGuidance: {
                    dailyWaterLitres: 0,
                },
            },
        );

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });
    it("does not expose an inactive athlete through nutrition generation", async () => {
        const user = await createTestUser({
            permissions: ["nutrition-plans.generate"],
        });
        const token = await login(user);
        const athlete = await testPrisma.athlete.create({
            data: {
                tenantId: user.tenant.id,
                firstName: "Nutrition",
                lastName: crypto.randomUUID(),
                status: "INACTIVE",
            },
        });

        const response = await generation(
            token,
            `r57-inactive-${crypto.randomUUID()}`,
            {
                athleteId: athlete.id,
                macroTargets,
                hydrationGuidance,
            },
        );

        expect(response.status).toBe(404);
        expect(response.body.error.code).toBe(
            "GENERATION_INPUT_UNAVAILABLE",
        );

        expect(
            await testPrisma.nutritionPlan.count({
                where: {
                    tenantId: user.tenant.id,
                    athleteId: athlete.id,
                },
            }),
        ).toBe(0);
    });
});

