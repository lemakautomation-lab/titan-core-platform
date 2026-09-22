import request from "supertest";
import {
    beforeEach,
    describe,
    expect,
    it,
} from "vitest";

import app from "../../src/app";
import { rateLimitModule } from "../../src/infrastructure/composition/rate-limit.module";
import { createTestUser } from "../factories/user.factory";
import { testPrisma } from "../helpers/prisma-test.client";

async function login(
    tenantId: string,
    email: string,
    password: string,
): Promise<string> {
    const response = await request(app)
        .post("/api/v1/auth/login")
        .send({ tenantId, email, password });

    expect(response.status).toBe(200);
    return response.body.data.accessToken;
}

async function createAthlete(tenantId: string) {
    return testPrisma.athlete.create({
        data: {
            tenantId,
            firstName: "Nutrition",
            lastName: "Athlete",
            countryCode: "ZA",
        },
    });
}

async function createRelationship(
    tenantId: string,
    athleteId: string,
    userId: string,
) {
    return testPrisma.athleteRelationship.create({
        data: {
            tenantId,
            athleteId,
            relatedEntityId: userId,
            relationshipType:
                "PERFORMANCE_PROFESSIONAL",
            status: "ACTIVE",
        },
    });
}

async function cleanupAthlete(
    athleteId: string,
): Promise<void> {
    await testPrisma.nutritionPlan.deleteMany({
        where: { athleteId },
    });

    await testPrisma.athleteRelationship.deleteMany({
        where: { athleteId },
    });

    await testPrisma.athlete.deleteMany({
        where: { id: athleteId },
    });
}

describe(
    "Mission 068.3 - Nutrition Professional workflow API",
    () => {
        beforeEach(async () => {
            await rateLimitModule.resetAuthRateLimiter();
        });

        it("requires authentication", async () => {
            const response = await request(app).get(
                "/api/v1/performance-professional/athletes/athlete-id/nutrition",
            );

            expect(response.status).toBe(401);
        });

        it("requires nutrition-plans.generate", async () => {
            const user = await createTestUser({
                permissions: [],
            });

            const token = await login(
                user.user.tenantId,
                user.user.email,
                user.password,
            );

            const response = await request(app)
                .get(
                    "/api/v1/performance-professional/athletes/athlete-id/nutrition",
                )
                .set(
                    "Authorization",
                    `Bearer ${token}`,
                );

            expect(response.status).toBe(403);
        });

        it("requires an active Performance Professional relationship", async () => {
            const user = await createTestUser({
                permissions: [
                    "nutrition-plans.generate",
                ],
            });

            const athlete = await createAthlete(
                user.user.tenantId,
            );

            try {
                const token = await login(
                    user.user.tenantId,
                    user.user.email,
                    user.password,
                );

                const response = await request(app)
                    .get(
                        `/api/v1/performance-professional/athletes/${athlete.id}/nutrition`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${token}`,
                    );

                expect(response.status).toBe(400);
                expect(response.body.error).toBe(
                    "Active Performance Professional athlete relationship is required.",
                );
            }
            finally {
                await cleanupAthlete(athlete.id);
            }
        });

        it("does not expose an Athlete from another tenant", async () => {
            const professional =
                await createTestUser({
                    permissions: [
                        "nutrition-plans.generate",
                    ],
                });

            const foreign =
                await createTestUser();

            const athlete = await createAthlete(
                foreign.user.tenantId,
            );

            try {
                const token = await login(
                    professional.user.tenantId,
                    professional.user.email,
                    professional.password,
                );

                const response = await request(app)
                    .get(
                        `/api/v1/performance-professional/athletes/${athlete.id}/nutrition`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${token}`,
                    );

                expect(response.status).toBe(404);
                expect(response.body.error).toBe(
                    "Athlete not found.",
                );
            }
            finally {
                await cleanupAthlete(athlete.id);
            }
        });

        it("returns the latest tenant-scoped Nutrition Plan without sensitive generation data", async () => {
            const user = await createTestUser({
                permissions: [
                    "nutrition-plans.generate",
                ],
            });

            const athlete = await createAthlete(
                user.user.tenantId,
            );

            try {
                await createRelationship(
                    user.user.tenantId,
                    athlete.id,
                    user.user.id,
                );

                await testPrisma.nutritionPlan.create({
                    data: {
                        tenantId: user.user.tenantId,
                        athleteId: athlete.id,
                        idempotencyKey:
                            `nutrition-${athlete.id}`,
                        requestFingerprint:
                            `fingerprint-${athlete.id}`,
                        requestFingerprintVersion: "1",
                        generatorId: "titan-nutrition",
                        generatorVersion: "1",
                        inputSnapshot: {
                            privateInput:
                                "must not be exposed",
                        },
                        planSnapshot: {
                            planType:
                                "AUTOMATED_NUTRITION_PLAN",
                            goalClassification:
                                "SPORT_PERFORMANCE",
                            macroTargets: {
                                caloriesKcal: 2800,
                                proteinGrams: 180,
                                carbohydrateGrams: 340,
                                fatGrams: 80,
                            },
                            hydrationGuidance: {
                                dailyWaterLitres: 3,
                                unit:
                                    "LITRES_PER_DAY",
                            },
                            guidance: [
                                "Performance nutrition guidance.",
                            ],
                        },
                    },
                });

                const token = await login(
                    user.user.tenantId,
                    user.user.email,
                    user.password,
                );

                const response = await request(app)
                    .get(
                        `/api/v1/performance-professional/athletes/${athlete.id}/nutrition`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${token}`,
                    );

                expect(response.status).toBe(200);
                expect(response.body.athleteId)
                    .toBe(athlete.id);
                expect(
                    response.body.latestNutritionPlan
                        .planSnapshot
                        .macroTargets
                        .caloriesKcal,
                ).toBe(2800);
                expect(
                    response.body.latestNutritionPlan
                        .planSnapshot
                        .hydrationGuidance
                        .dailyWaterLitres,
                ).toBe(3);

                expect(
                    response.body.latestNutritionPlan,
                ).not.toHaveProperty("tenantId");
                expect(
                    response.body.latestNutritionPlan,
                ).not.toHaveProperty(
                    "idempotencyKey",
                );
                expect(
                    response.body.latestNutritionPlan,
                ).not.toHaveProperty(
                    "inputSnapshot",
                );
                expect(
                    response.body.latestNutritionPlan,
                ).not.toHaveProperty(
                    "requestFingerprint",
                );
            }
            finally {
                await cleanupAthlete(athlete.id);
            }
        });
    },
);
