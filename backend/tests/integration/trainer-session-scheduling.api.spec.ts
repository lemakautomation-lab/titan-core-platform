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
    const response = await request(app)
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
        where: { id: user.id },
        data: { selectedUserType: "TRAINER" },
    });

    const product = await testPrisma.product.create({
        data: {
            tenantId: user.tenantId,
            name: "Trainer Session Scheduling",
            slug: `trainer-scheduling-${crypto.randomUUID()}`,
            description: null,
            priceCents: 29900,
            currency: "ZAR",
            billingInterval: BillingInterval.MONTHLY,
            entitlementUserType: "TRAINER",
        },
    });

    const price = await testPrisma.productPrice.create({
        data: {
            productId: product.id,
            amountMinor: 29900,
            currency: "ZAR",
            billingInterval: BillingInterval.MONTHLY,
        },
    });

    const payment = await testPrisma.payment.create({
        data: {
            tenantId: user.tenantId,
            userId: user.id,
            productId: product.id,
            productPriceId: price.id,
            amountMinor: 29900,
            currency: "ZAR",
            billingInterval: BillingInterval.MONTHLY,
            status: "CONFIRMED",
            providerReference:
                `trainer-scheduling-${crypto.randomUUID()}`,
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
                validFrom: new Date(Date.now() - 60_000),
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
        ReturnType<typeof createTrainerCommercialEvidence>
    >,
): Promise<void> {
    await testPrisma.userTypeEntitlement.deleteMany({
        where: { id: evidence.entitlement.id },
    });

    await testPrisma.payment.deleteMany({
        where: { id: evidence.payment.id },
    });

    await testPrisma.productPrice.deleteMany({
        where: { id: evidence.price.id },
    });

    await testPrisma.product.deleteMany({
        where: { id: evidence.product.id },
    });
}

async function createAthlete(
    tenantId: string,
) {
    return testPrisma.athlete.create({
        data: {
            tenantId,
            firstName: "Session",
            lastName: "Client",
            countryCode: "ZA",
        },
    });
}

describe(
    "Mission 064.10 - Trainer session scheduling API",
    () => {
        beforeEach(async () => {
            await rateLimitModule.resetAuthRateLimiter();
        });

        it(
            "rejects unauthenticated session creation",
            async () => {
                const response = await request(app)
                    .post(
                        "/api/v1/workout-programmes/trainer/sessions",
                    )
                    .send({});

                expect(response.status).toBe(401);
            },
        );

        it(
            "enforces scheduling endpoint permissions",
            async () => {
                const { user, password } =
                    await createTestUser({
                        permissions: [],
                    });

                const token = await login(
                    user.tenantId,
                    user.email,
                    password,
                );

                const createResponse = await request(app)
                    .post(
                        "/api/v1/workout-programmes/trainer/sessions",
                    )
                    .set("Authorization", `Bearer ${token}`)
                    .send({});

                const listResponse = await request(app)
                    .get(
                        "/api/v1/workout-programmes/trainer/sessions",
                    )
                    .set("Authorization", `Bearer ${token}`);

                const updateResponse = await request(app)
                    .patch(
                        "/api/v1/workout-programmes/trainer/sessions/session-id",
                    )
                    .set("Authorization", `Bearer ${token}`)
                    .send({});

                expect(createResponse.status).toBe(403);
                expect(listResponse.status).toBe(403);
                expect(updateResponse.status).toBe(403);
            },
        );

        it(
            "creates, lists, updates and persists an authorized Trainer session",
            async () => {
                const { user, password } =
                    await createTestUser({
                        permissions: [
                            "workout-programmes.create",
                            "workout-programmes.read",
                            "workout-programmes.update",
                        ],
                    });

                const evidence =
                    await createTrainerCommercialEvidence(
                        user,
                    );

                const athlete =
                    await createAthlete(user.tenantId);

                await testPrisma.athleteRelationship.create({
                    data: {
                        tenantId: user.tenantId,
                        athleteId: athlete.id,
                        relationshipType: "TRAINER",
                        relatedEntityId: user.id,
                        status: "ACTIVE",
                    },
                });

                try {
                    const token = await login(
                        user.tenantId,
                        user.email,
                        password,
                    );

                    const startsAt =
                        new Date(Date.now() + 3_600_000);

                    const endsAt =
                        new Date(startsAt.getTime() + 3_600_000);

                    const createResponse =
                        await request(app)
                            .post(
                                "/api/v1/workout-programmes/trainer/sessions",
                            )
                            .set(
                                "Authorization",
                                `Bearer ${token}`,
                            )
                            .send({
                                athleteId: athlete.id,
                                title: "Strength Session",
                                notes: "Initial session",
                                startsAt:
                                    startsAt.toISOString(),
                                endsAt:
                                    endsAt.toISOString(),
                            });

                    expect(createResponse.status)
                        .toBe(201);

                    expect(createResponse.body.tenantId)
                        .toBe(user.tenantId);

                    expect(createResponse.body.trainerUserId)
                        .toBe(user.id);

                    expect(createResponse.body.athleteId)
                        .toBe(athlete.id);

                    expect(createResponse.body.status)
                        .toBe("SCHEDULED");

                    const scheduleId =
                        createResponse.body.id;

                    const persisted =
                        await testPrisma
                            .trainerSessionSchedule
                            .findFirst({
                                where: {
                                    id: scheduleId,
                                    tenantId:
                                        user.tenantId,
                                },
                            });

                    expect(persisted)
                        .not.toBeNull();

                    const listResponse =
                        await request(app)
                            .get(
                                "/api/v1/workout-programmes/trainer/sessions",
                            )
                            .query({
                                startsFrom:
                                    new Date(
                                        startsAt.getTime() -
                                            60_000,
                                    ).toISOString(),
                                startsBefore:
                                    new Date(
                                        endsAt.getTime() +
                                            60_000,
                                    ).toISOString(),
                                athleteId:
                                    athlete.id,
                            })
                            .set(
                                "Authorization",
                                `Bearer ${token}`,
                            );

                    expect(listResponse.status)
                        .toBe(200);

                    expect(
                        listResponse.body.some(
                            (item: { id: string }) =>
                                item.id === scheduleId,
                        ),
                    ).toBe(true);

                    const updatedStartsAt =
                        new Date(
                            startsAt.getTime() +
                                7_200_000,
                        );

                    const updatedEndsAt =
                        new Date(
                            updatedStartsAt.getTime() +
                                3_600_000,
                        );

                    const updateResponse =
                        await request(app)
                            .patch(
                                `/api/v1/workout-programmes/trainer/sessions/${scheduleId}`,
                            )
                            .set(
                                "Authorization",
                                `Bearer ${token}`,
                            )
                            .send({
                                title:
                                    "Updated Strength Session",
                                notes:
                                    "Updated session",
                                startsAt:
                                    updatedStartsAt.toISOString(),
                                endsAt:
                                    updatedEndsAt.toISOString(),
                            });

                    expect(updateResponse.status)
                        .toBe(200);

                    expect(updateResponse.body.title)
                        .toBe(
                            "Updated Strength Session",
                        );

                    const updated =
                        await testPrisma
                            .trainerSessionSchedule
                            .findFirst({
                                where: {
                                    id: scheduleId,
                                    tenantId:
                                        user.tenantId,
                                },
                            });

                    expect(updated?.title)
                        .toBe(
                            "Updated Strength Session",
                        );

                    const completeResponse =
                        await request(app)
                            .patch(
                                `/api/v1/workout-programmes/trainer/sessions/${scheduleId}/status`,
                            )
                            .set(
                                "Authorization",
                                `Bearer ${token}`,
                            )
                            .send({
                                status: "COMPLETED",
                            });

                    expect(completeResponse.status)
                        .toBe(200);
                    expect(completeResponse.body.status)
                        .toBe("COMPLETED");

                    const completed =
                        await testPrisma
                            .trainerSessionSchedule
                            .findFirst({
                                where: {
                                    id: scheduleId,
                                    tenantId:
                                        user.tenantId,
                                },
                            });

                    expect(completed?.status)
                        .toBe("COMPLETED");

                    const cancelCompletedResponse =
                        await request(app)
                            .patch(
                                `/api/v1/workout-programmes/trainer/sessions/${scheduleId}/status`,
                            )
                            .set(
                                "Authorization",
                                `Bearer ${token}`,
                            )
                            .send({
                                status: "CANCELLED",
                            });

                    expect(cancelCompletedResponse.status)
                        .toBe(400);
                }
                finally {
                    await testPrisma
                        .trainerSessionSchedule
                        .deleteMany({
                            where: {
                                tenantId:
                                    user.tenantId,
                            },
                        });

                    await testPrisma
                        .athleteRelationship
                        .deleteMany({
                            where: {
                                athleteId:
                                    athlete.id,
                            },
                        });

                    await testPrisma.athlete.deleteMany({
                        where: {
                            id: athlete.id,
                        },
                    });

                    await cleanupCommercialEvidence(
                        evidence,
                    );
                }
            },
        );
    },
);
