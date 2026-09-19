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
                name: "Trainer Programme Creation",
                slug:
                    `trainer-programme-${crypto.randomUUID()}`,
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
                    `trainer-programme-${crypto.randomUUID()}`,
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
) {
    return testPrisma.athlete.create({
        data: {
            tenantId,
            firstName: "Programme",
            lastName: "Client",
            countryCode: "ZA",
        },
    });
}

function programmePayload(
    athleteId: string,
) {
    return {
        athleteId,
        name: "Trainer Strength Programme",
        description:
            "Mission 064.5 programme creation",
        goal: "Strength",
        experience: "Intermediate",
        trainingFrequency: 3,
        sessionDurationMinutes: 60,
        sportId: null,
    };
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
    "Mission 064.5 - Trainer programme creation API",
    () => {
        beforeEach(async () => {
            await rateLimitModule
                .resetAuthRateLimiter();
        });

        it(
            "rejects unauthenticated Trainer programme creation",
            async () => {
                const response =
                    await request(app)
                        .post(
                            "/api/v1/workout-programmes/trainer",
                        )
                        .send(
                            programmePayload(
                                "athlete-id",
                            ),
                        );

                expect(response.status).toBe(401);
            },
        );

        it(
            "enforces workout-programmes.create permission",
            async () => {
                const {
                    user,
                    password,
                } = await createTestUser();

                const athlete =
                    await createAthlete(
                        user.tenantId,
                    );

                try {
                    const token =
                        await login(
                            user.tenantId,
                            user.email,
                            password,
                        );

                    const response =
                        await request(app)
                            .post(
                                "/api/v1/workout-programmes/trainer",
                            )
                            .set(
                                "Authorization",
                                `Bearer ${token}`,
                            )
                            .send(
                                programmePayload(
                                    athlete.id,
                                ),
                            );

                    expect(response.status).toBe(403);
                }
                finally {
                    await cleanupAthlete(
                        athlete.id,
                    );
                }
            },
        );

        it(
            "rejects a Trainer without active commercial access",
            async () => {
                const {
                    user,
                    password,
                } = await createTestUser({
                    permissions: [
                        "workout-programmes.create",
                    ],
                });

                await testPrisma.user.update({
                    where: {
                        id: user.id,
                    },
                    data: {
                        selectedUserType:
                            "TRAINER",
                    },
                });

                const athlete =
                    await createAthlete(
                        user.tenantId,
                    );

                try {
                    const token =
                        await login(
                            user.tenantId,
                            user.email,
                            password,
                        );

                    const response =
                        await request(app)
                            .post(
                                "/api/v1/workout-programmes/trainer",
                            )
                            .set(
                                "Authorization",
                                `Bearer ${token}`,
                            )
                            .send(
                                programmePayload(
                                    athlete.id,
                                ),
                            );

                    expect(response.status).toBe(400);

                    const count =
                        await testPrisma
                            .workoutProgramme
                            .count({
                                where: {
                                    athleteId:
                                        athlete.id,
                                },
                            });

                    expect(count).toBe(0);
                }
                finally {
                    await cleanupAthlete(
                        athlete.id,
                    );
                }
            },
        );

        it(
            "rejects an Athlete without an active Trainer relationship",
            async () => {
                const {
                    user,
                    password,
                } = await createTestUser({
                    permissions: [
                        "workout-programmes.create",
                    ],
                });

                const evidence =
                    await createTrainerCommercialEvidence(
                        user,
                    );

                const athlete =
                    await createAthlete(
                        user.tenantId,
                    );

                try {
                    const token =
                        await login(
                            user.tenantId,
                            user.email,
                            password,
                        );

                    const response =
                        await request(app)
                            .post(
                                "/api/v1/workout-programmes/trainer",
                            )
                            .set(
                                "Authorization",
                                `Bearer ${token}`,
                            )
                            .send(
                                programmePayload(
                                    athlete.id,
                                ),
                            );

                    expect(response.status).toBe(400);

                    const count =
                        await testPrisma
                            .workoutProgramme
                            .count({
                                where: {
                                    athleteId:
                                        athlete.id,
                                },
                            });

                    expect(count).toBe(0);
                }
                finally {
                    await cleanupAthlete(
                        athlete.id,
                    );

                    await cleanupCommercialEvidence(
                        evidence,
                    );
                }
            },
        );

        it(
            "rejects an inactive Trainer-client relationship",
            async () => {
                const {
                    user,
                    password,
                } = await createTestUser({
                    permissions: [
                        "workout-programmes.create",
                    ],
                });

                const evidence =
                    await createTrainerCommercialEvidence(
                        user,
                    );

                const athlete =
                    await createAthlete(
                        user.tenantId,
                    );

                await testPrisma
                    .athleteRelationship
                    .create({
                        data: {
                            tenantId:
                                user.tenantId,
                            athleteId:
                                athlete.id,
                            relationshipType:
                                "TRAINER",
                            relatedEntityId:
                                user.id,
                            status:
                                "INACTIVE",
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
                            .post(
                                "/api/v1/workout-programmes/trainer",
                            )
                            .set(
                                "Authorization",
                                `Bearer ${token}`,
                            )
                            .send(
                                programmePayload(
                                    athlete.id,
                                ),
                            );

                    expect(response.status).toBe(400);

                    const count =
                        await testPrisma
                            .workoutProgramme
                            .count({
                                where: {
                                    athleteId:
                                        athlete.id,
                                },
                            });

                    expect(count).toBe(0);
                }
                finally {
                    await cleanupAthlete(
                        athlete.id,
                    );

                    await cleanupCommercialEvidence(
                        evidence,
                    );
                }
            },
        );

        it(
            "creates and persists a programme for an active Trainer client",
            async () => {
                const {
                    user,
                    password,
                } = await createTestUser({
                    permissions: [
                        "workout-programmes.create",
                    ],
                });

                const evidence =
                    await createTrainerCommercialEvidence(
                        user,
                    );

                const athlete =
                    await createAthlete(
                        user.tenantId,
                    );

                await testPrisma
                    .athleteRelationship
                    .create({
                        data: {
                            tenantId:
                                user.tenantId,
                            athleteId:
                                athlete.id,
                            relationshipType:
                                "TRAINER",
                            relatedEntityId:
                                user.id,
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
                            .post(
                                "/api/v1/workout-programmes/trainer",
                            )
                            .set(
                                "Authorization",
                                `Bearer ${token}`,
                            )
                            .send(
                                programmePayload(
                                    athlete.id,
                                ),
                            );

                    expect(response.status).toBe(201);
                    expect(response.body.tenantId)
                        .toBe(user.tenantId);
                    expect(response.body.athleteId)
                        .toBe(athlete.id);
                    expect(response.body.name)
                        .toBe(
                            "Trainer Strength Programme",
                        );

                    const persisted =
                        await testPrisma
                            .workoutProgramme
                            .findFirst({
                                where: {
                                    id:
                                        response.body.id,
                                    tenantId:
                                        user.tenantId,
                                    athleteId:
                                        athlete.id,
                                },
                            });

                    expect(persisted)
                        .not.toBeNull();
                    expect(persisted?.name)
                        .toBe(
                            "Trainer Strength Programme",
                        );
                }
                finally {
                    await cleanupAthlete(
                        athlete.id,
                    );

                    await cleanupCommercialEvidence(
                        evidence,
                    );
                }
            },
        );
    },
);
