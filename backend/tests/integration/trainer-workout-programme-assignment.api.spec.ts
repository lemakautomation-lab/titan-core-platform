import crypto from "crypto";
import request from "supertest";
import {
    beforeEach,
    describe,
    expect,
    it,
} from "vitest";

import app from "../../src/app";
import { BillingInterval } from "../../src/domain/enums/billing-interval.enum";
import { rateLimitModule } from "../../src/infrastructure/composition/rate-limit.module";
import { createTestUser } from "../factories/user.factory";
import { testPrisma } from "../helpers/prisma-test.client";

async function login(
    tenantId: string,
    email: string,
    password: string,
): Promise<string> {
    const response =
        await request(app)
            .post("/api/v1/auth/login")
            .send({
                tenantId,
                email,
                password,
            });

    expect(response.status).toBe(200);

    return response.body.data.accessToken;
}

async function createTrainerCommercialEvidence(
    user: {
        id: string;
        tenantId: string;
    },
) {
    await testPrisma.user.update({
        where: {
            id: user.id,
        },
        data: {
            selectedUserType: "TRAINER",
        },
    });

    const product =
        await testPrisma.product.create({
            data: {
                tenantId: user.tenantId,
                name: "Trainer Workout Assignment",
                slug:
                    `trainer-assignment-${crypto.randomUUID()}`,
                description: null,
                priceCents: 29900,
                currency: "ZAR",
                billingInterval:
                    BillingInterval.MONTHLY,
                entitlementUserType: "TRAINER",
            },
        });

    const price =
        await testPrisma.productPrice.create({
            data: {
                productId: product.id,
                amountMinor: 29900,
                currency: "ZAR",
                billingInterval:
                    BillingInterval.MONTHLY,
            },
        });

    const payment =
        await testPrisma.payment.create({
            data: {
                tenantId: user.tenantId,
                userId: user.id,
                productId: product.id,
                productPriceId: price.id,
                amountMinor: 29900,
                currency: "ZAR",
                billingInterval:
                    BillingInterval.MONTHLY,
                status: "CONFIRMED",
                providerReference:
                    `trainer-assignment-${crypto.randomUUID()}`,
                confirmedAt: new Date(),
            },
        });

    const entitlement =
        await testPrisma.userTypeEntitlement.create({
            data: {
                tenantId: user.tenantId,
                userId: user.id,
                paymentId: payment.id,
                productId: product.id,
                userType: "TRAINER",
                status: "ACTIVE",
                validFrom:
                    new Date(Date.now() - 60_000),
                validUntil:
                    new Date(Date.now() + 86_400_000),
            },
        });

    return {
        product,
        price,
        payment,
        entitlement,
    };
}

async function cleanupCommercialEvidence(
    evidence: Awaited<
        ReturnType<
            typeof createTrainerCommercialEvidence
        >
    >,
): Promise<void> {
    await testPrisma.userTypeEntitlement.deleteMany({
        where: {
            id: evidence.entitlement.id,
        },
    });

    await testPrisma.payment.deleteMany({
        where: {
            id: evidence.payment.id,
        },
    });

    await testPrisma.productPrice.deleteMany({
        where: {
            id: evidence.price.id,
        },
    });

    await testPrisma.product.deleteMany({
        where: {
            id: evidence.product.id,
        },
    });
}

async function createAthlete(
    tenantId: string,
    firstName: string,
) {
    return testPrisma.athlete.create({
        data: {
            tenantId,
            firstName,
            lastName: "Assignment",
            countryCode: "ZA",
        },
    });
}

async function cleanupAthlete(
    athleteId: string,
): Promise<void> {
    await testPrisma.workoutProgramme.deleteMany({
        where: {
            athleteId,
        },
    });

    await testPrisma.athleteRelationship.deleteMany({
        where: {
            athleteId,
        },
    });

    await testPrisma.athlete.deleteMany({
        where: {
            id: athleteId,
        },
    });
}

describe(
    "Mission 064.6 - Trainer client workout assignment API",
    () => {
        beforeEach(async () => {
            await rateLimitModule
                .resetAuthRateLimiter();
        });

        it(
            "rejects unauthenticated workout assignment",
            async () => {
                const response =
                    await request(app)
                        .patch(
                            "/api/v1/workout-programmes/trainer/programme-id/assignment",
                        )
                        .send({
                            athleteId: "athlete-id",
                        });

                expect(response.status).toBe(401);
            },
        );

        it(
            "enforces workout-programmes.update permission",
            async () => {
                const {
                    user,
                    password,
                } = await createTestUser({
                    permissions: [],
                });

                const token =
                    await login(
                        user.tenantId,
                        user.email,
                        password,
                    );

                const response =
                    await request(app)
                        .patch(
                            "/api/v1/workout-programmes/trainer/programme-id/assignment",
                        )
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        )
                        .send({
                            athleteId: "athlete-id",
                        });

                expect(response.status).toBe(403);
            },
        );

        it(
            "assigns and persists a programme for an active Trainer client",
            async () => {
                const {
                    user,
                    password,
                } = await createTestUser({
                    permissions: [
                        "workout-programmes.update",
                    ],
                });

                const evidence =
                    await createTrainerCommercialEvidence(
                        user,
                    );

                const sourceAthlete =
                    await createAthlete(
                        user.tenantId,
                        "Source",
                    );

                const targetAthlete =
                    await createAthlete(
                        user.tenantId,
                        "Target",
                    );

                await testPrisma
                    .athleteRelationship
                    .create({
                        data: {
                            tenantId:
                                user.tenantId,
                            athleteId:
                                targetAthlete.id,
                            relationshipType:
                                "TRAINER",
                            relatedEntityId:
                                user.id,
                            status:
                                "ACTIVE",
                        },
                    });

                const programme =
                    await testPrisma
                        .workoutProgramme
                        .create({
                            data: {
                                tenantId:
                                    user.tenantId,
                                athleteId:
                                    sourceAthlete.id,
                                name:
                                    "Assignment Programme",
                                description:
                                    "Mission 064.6 assignment",
                                goal:
                                    "Strength",
                                experience:
                                    "Intermediate",
                                trainingFrequency:
                                    3,
                                sessionDurationMinutes:
                                    60,
                                sportId:
                                    null,
                                status:
                                    "ACTIVE",
                            },
                        });

                try {
                    const token =
                        await login(
                            user.tenantId,
                            user.email,
                            password,
                        );

                    const response =
                        await request(app)
                            .patch(
                                `/api/v1/workout-programmes/trainer/${programme.id}/assignment`,
                            )
                            .set(
                                "Authorization",
                                `Bearer ${token}`,
                            )
                            .send({
                                athleteId:
                                    targetAthlete.id,
                            });

                    expect(response.status)
                        .toBe(200);

                    expect(response.body.id)
                        .toBe(programme.id);

                    expect(response.body.tenantId)
                        .toBe(user.tenantId);

                    expect(response.body.athleteId)
                        .toBe(targetAthlete.id);

                    const persisted =
                        await testPrisma
                            .workoutProgramme
                            .findFirst({
                                where: {
                                    id:
                                        programme.id,
                                    tenantId:
                                        user.tenantId,
                                },
                            });

                    expect(persisted)
                        .not.toBeNull();

                    expect(persisted?.athleteId)
                        .toBe(targetAthlete.id);
                }
                finally {
                    await testPrisma
                        .workoutProgramme
                        .deleteMany({
                            where: {
                                id:
                                    programme.id,
                            },
                        });

                    await cleanupAthlete(
                        targetAthlete.id,
                    );

                    await cleanupAthlete(
                        sourceAthlete.id,
                    );

                    await cleanupCommercialEvidence(
                        evidence,
                    );
                }
            },
        );
    },
);
