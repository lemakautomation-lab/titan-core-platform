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
                name: "Trainer Client Monitoring",
                slug:
                    `trainer-monitoring-${crypto.randomUUID()}`,
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
                    `trainer-monitoring-${crypto.randomUUID()}`,
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
            lastName: "Monitoring",
            countryCode: "ZA",
        },
    });
}

async function cleanupAthlete(
    athleteId: string,
): Promise<void> {
    await testPrisma.performanceMeasurement.deleteMany({
        where: {
            athleteId,
        },
    });

    await testPrisma.performanceMetric.deleteMany({
        where: {
            athleteId,
        },
    });

    await testPrisma.recoveryTracking.deleteMany({
        where: {
            athleteId,
        },
    });

    await testPrisma.trainingStress.deleteMany({
        where: {
            athleteId,
        },
    });

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
    "Mission 064.7 - Trainer client monitoring API",
    () => {
        beforeEach(async () => {
            await rateLimitModule
                .resetAuthRateLimiter();
        });

        it(
            "rejects unauthenticated monitoring",
            async () => {
                const response =
                    await request(app)
                        .get(
                            "/api/v1/workout-programmes/trainer/clients/athlete-id/monitoring",
                        );

                expect(response.status).toBe(401);
            },
        );

        it(
            "enforces workout-programmes.read permission",
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
                        .get(
                            "/api/v1/workout-programmes/trainer/clients/athlete-id/monitoring",
                        )
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        );

                expect(response.status).toBe(403);
            },
        );

        it(
            "rejects monitoring without an active Trainer-client relationship",
            async () => {
                const {
                    user,
                    password,
                } = await createTestUser({
                    permissions: [
                        "workout-programmes.read",
                    ],
                });

                const evidence =
                    await createTrainerCommercialEvidence(
                        user,
                    );

                const athlete =
                    await createAthlete(
                        user.tenantId,
                        "Unrelated",
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
                            .get(
                                `/api/v1/workout-programmes/trainer/clients/${athlete.id}/monitoring`,
                            )
                            .set(
                                "Authorization",
                                `Bearer ${token}`,
                            );

                    expect(response.status)
                        .toBe(400);

                    expect(response.body.error)
                        .toBe(
                            "Active Trainer client relationship is required.",
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

        it(
            "returns bounded monitoring data for an active Trainer client",
            async () => {
                const {
                    user,
                    password,
                } = await createTestUser({
                    permissions: [
                        "workout-programmes.read",
                    ],
                });

                const evidence =
                    await createTrainerCommercialEvidence(
                        user,
                    );

                const athlete =
                    await createAthlete(
                        user.tenantId,
                        "Client",
                    );

                const sport =
                    await testPrisma.sport.create({
                        data: {
                            tenantId:
                                user.tenantId,
                            name:
                                `Monitoring ${crypto.randomUUID()}`,
                            slug:
                                `monitoring-${crypto.randomUUID()}`,
                        },
                    });

                const metric =
                    await testPrisma.performanceMetric.create({
                        data: {
                            tenantId:
                                user.tenantId,
                            athleteId:
                                athlete.id,
                            sportId:
                                sport.id,
                            name:
                                "Monitoring Metric",
                            slug:
                                `monitoring-${crypto.randomUUID()}`,
                            unit:
                                "score",
                            dataType:
                                "NUMBER",
                            status:
                                "ACTIVE",
                        },
                    });

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

                await testPrisma
                    .performanceMeasurement
                    .create({
                        data: {
                            tenantId:
                                user.tenantId,
                            athleteId:
                                athlete.id,
                            metricId:
                                metric.id,
                            value:
                                91,
                            recordedAt:
                                new Date(
                                    "2026-09-19T08:00:00.000Z",
                                ),
                            sourceType:
                                "TEST",
                            sourceId:
                                `device-${crypto.randomUUID()}`,
                            sourceObservationId:
                                `measurement-${crypto.randomUUID()}`,
                        },
                    });

                await testPrisma
                    .recoveryTracking
                    .create({
                        data: {
                            tenantId:
                                user.tenantId,
                            athleteId:
                                athlete.id,
                            value:
                                82,
                            recordedAt:
                                new Date(
                                    "2026-09-19T09:00:00.000Z",
                                ),
                            sourceType:
                                "TEST",
                            sourceId:
                                `device-${crypto.randomUUID()}`,
                            sourceObservationId:
                                `recovery-${crypto.randomUUID()}`,
                        },
                    });

                await testPrisma
                    .trainingStress
                    .create({
                        data: {
                            tenantId:
                                user.tenantId,
                            athleteId:
                                athlete.id,
                            value:
                                7.5,
                            recordedAt:
                                new Date(
                                    "2026-09-19T10:00:00.000Z",
                                ),
                            sourceType:
                                "TEST",
                            sourceId:
                                `device-${crypto.randomUUID()}`,
                            sourceObservationId:
                                `stress-${crypto.randomUUID()}`,
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
                                    athlete.id,
                                name:
                                    "Monitoring Programme",
                                description:
                                    "Mission 064.7",
                                goal:
                                    "Performance",
                                experience:
                                    "Intermediate",
                                trainingFrequency:
                                    4,
                                sessionDurationMinutes:
                                    60,
                                sportId:
                                    sport.id,
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
                            .get(
                                `/api/v1/workout-programmes/trainer/clients/${athlete.id}/monitoring?limit=1`,
                            )
                            .set(
                                "Authorization",
                                `Bearer ${token}`,
                            );

                    expect(response.status)
                        .toBe(200);

                    expect(response.body.athleteId)
                        .toBe(athlete.id);

                    expect(response.body.performance)
                        .toHaveLength(1);

                    expect(
                        response.body.performance[0]
                            .metric.id,
                    ).toBe(metric.id);

                    expect(
                        response.body.performance[0]
                            .measurements,
                    ).toHaveLength(1);

                    expect(
                        response.body.performance[0]
                            .measurements[0].value,
                    ).toBe(91);

                    expect(response.body.recovery)
                        .toHaveLength(1);

                    expect(response.body.recovery[0].value)
                        .toBe(82);

                    expect(response.body.trainingStress)
                        .toHaveLength(1);

                    expect(
                        response.body.trainingStress[0].value,
                    ).toBe(7.5);

                    expect(
                        response.body.workoutProgrammes
                            .some(
                                (
                                    value: {
                                        id: string;
                                    },
                                ) =>
                                    value.id ===
                                    programme.id,
                            ),
                    ).toBe(true);
                }
                finally {
                    await cleanupAthlete(
                        athlete.id,
                    );

                    await testPrisma.sport.deleteMany({
                        where: {
                            id: sport.id,
                        },
                    });

                    await cleanupCommercialEvidence(
                        evidence,
                    );
                }
            },
        );

        it(
            "does not expose an Athlete from another tenant",
            async () => {
                const trainer =
                    await createTestUser({
                        permissions: [
                            "workout-programmes.read",
                        ],
                    });

                const other =
                    await createTestUser();

                const evidence =
                    await createTrainerCommercialEvidence(
                        trainer.user,
                    );

                const athlete =
                    await createAthlete(
                        other.user.tenantId,
                        "OtherTenant",
                    );

                try {
                    const token =
                        await login(
                            trainer.user.tenantId,
                            trainer.user.email,
                            trainer.password,
                        );

                    const response =
                        await request(app)
                            .get(
                                `/api/v1/workout-programmes/trainer/clients/${athlete.id}/monitoring`,
                            )
                            .set(
                                "Authorization",
                                `Bearer ${token}`,
                            );

                    expect(response.status)
                        .toBe(404);

                    expect(response.body.error)
                        .toBe(
                            "Athlete not found.",
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