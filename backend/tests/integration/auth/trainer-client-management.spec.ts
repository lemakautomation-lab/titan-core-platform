import crypto from "crypto";
import request from "supertest";
import {
    beforeEach,
    describe,
    expect,
    it,
} from "vitest";

import app from "../../../src/app";
import { BillingInterval } from "../../../src/domain/enums/billing-interval.enum";
import { rateLimitModule } from "../../../src/infrastructure/composition/rate-limit.module";
import { createTestUser } from "../../factories/user.factory";
import { testPrisma } from "../../helpers/prisma-test.client";

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
                name: "Trainer Client Management",
                slug:
                    `trainer-clients-${crypto.randomUUID()}`,
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
                    `trainer-clients-${crypto.randomUUID()}`,
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
                    new Date(
                        Date.now() + 86_400_000,
                    ),
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
    firstName = "Trainer",
    lastName = "Client",
) {
    return testPrisma.athlete.create({
        data: {
            tenantId,
            firstName,
            lastName,
            countryCode: "ZA",
        },
    });
}

async function cleanupAthlete(
    athleteId: string,
): Promise<void> {
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

describe("Trainer client management API", () => {

    beforeEach(async () => {
        await rateLimitModule
            .resetAuthRateLimiter();
    });

    it(
        "rejects unauthenticated client management",
        async () => {
            const listResponse =
                await request(app)
                    .get(
                        "/api/v1/auth/me/trainer-clients",
                    );

            const addResponse =
                await request(app)
                    .post(
                        "/api/v1/auth/me/trainer-clients/athlete-id",
                    );

            const removeResponse =
                await request(app)
                    .delete(
                        "/api/v1/auth/me/trainer-clients/athlete-id",
                    );

            expect(listResponse.status).toBe(401);
            expect(addResponse.status).toBe(401);
            expect(removeResponse.status).toBe(401);
        },
    );

    it(
        "denies a user who has not selected TRAINER",
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
                            `/api/v1/auth/me/trainer-clients/${athlete.id}`,
                        )
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        );

                expect(response.status).toBe(403);

                const relationship =
                    await testPrisma
                        .athleteRelationship
                        .findFirst({
                            where: {
                                athleteId:
                                    athlete.id,
                            },
                        });

                expect(relationship).toBeNull();
            }
            finally {
                await cleanupAthlete(
                    athlete.id,
                );
            }
        },
    );

    it(
        "denies a TRAINER without active commercial entitlement",
        async () => {
            const {
                user,
                password,
            } = await createTestUser();

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
                            `/api/v1/auth/me/trainer-clients/${athlete.id}`,
                        )
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        );

                expect(response.status).toBe(403);

                const relationship =
                    await testPrisma
                        .athleteRelationship
                        .findFirst({
                            where: {
                                athleteId:
                                    athlete.id,
                            },
                        });

                expect(relationship).toBeNull();
            }
            finally {
                await cleanupAthlete(
                    athlete.id,
                );
            }
        },
    );

    it(
        "adds and lists a client with server-derived ownership",
        async () => {
            const {
                user,
                password,
            } = await createTestUser();

            const evidence =
                await createTrainerCommercialEvidence(
                    user,
                );

            const athlete =
                await createAthlete(
                    user.tenantId,
                    "Alice",
                    "Athlete",
                );

            try {
                const token =
                    await login(
                        user.tenantId,
                        user.email,
                        password,
                    );

                const addResponse =
                    await request(app)
                        .post(
                            `/api/v1/auth/me/trainer-clients/${athlete.id}`,
                        )
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        )
                        .send({
                            tenantId:
                                "attacker-tenant",
                            relatedEntityId:
                                "attacker-user",
                            relationshipType:
                                "COACH",
                        });

                expect(addResponse.status).toBe(201);
                expect(
                    addResponse.body.relationshipId,
                ).toEqual(
                    expect.any(String),
                );

                const persisted =
                    await testPrisma
                        .athleteRelationship
                        .findFirstOrThrow({
                            where: {
                                athleteId:
                                    athlete.id,
                                tenantId:
                                    user.tenantId,
                                relationshipType:
                                    "TRAINER",
                            },
                        });

                expect(
                    persisted.relatedEntityId,
                ).toBe(user.id);

                expect(persisted.status).toBe(
                    "ACTIVE",
                );

                const listResponse =
                    await request(app)
                        .get(
                            "/api/v1/auth/me/trainer-clients",
                        )
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        );

                expect(listResponse.status).toBe(200);

                expect(listResponse.body).toEqual([
                    expect.objectContaining({
                        athleteId:
                            athlete.id,
                        firstName:
                            "Alice",
                        lastName:
                            "Athlete",
                        countryCode:
                            "ZA",
                        relationshipId:
                            persisted.id,
                        relationshipStatus:
                            "ACTIVE",
                    }),
                ]);

                expect(
                    JSON.stringify(
                        listResponse.body,
                    ),
                ).not.toContain(
                    user.tenantId,
                );

                expect(
                    JSON.stringify(
                        listResponse.body,
                    ),
                ).not.toContain(
                    user.id,
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
        "rejects duplicate active client association",
        async () => {
            const {
                user,
                password,
            } = await createTestUser();

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

                const first =
                    await request(app)
                        .post(
                            `/api/v1/auth/me/trainer-clients/${athlete.id}`,
                        )
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        );

                const second =
                    await request(app)
                        .post(
                            `/api/v1/auth/me/trainer-clients/${athlete.id}`,
                        )
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        );

                expect(first.status).toBe(201);
                expect(second.status).toBe(409);

                const count =
                    await testPrisma
                        .athleteRelationship
                        .count({
                            where: {
                                athleteId:
                                    athlete.id,
                                tenantId:
                                    user.tenantId,
                                relatedEntityId:
                                    user.id,
                                relationshipType:
                                    "TRAINER",
                            },
                        });

                expect(count).toBe(1);
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
        "rejects a cross-tenant athlete",
        async () => {
            const trainer =
                await createTestUser();

            const other =
                await createTestUser();

            const evidence =
                await createTrainerCommercialEvidence(
                    trainer.user,
                );

            const athlete =
                await createAthlete(
                    other.user.tenantId,
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
                        .post(
                            `/api/v1/auth/me/trainer-clients/${athlete.id}`,
                        )
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        );

                expect(response.status).toBe(404);

                const relationship =
                    await testPrisma
                        .athleteRelationship
                        .findFirst({
                            where: {
                                athleteId:
                                    athlete.id,
                                relatedEntityId:
                                    trainer.user.id,
                            },
                        });

                expect(relationship).toBeNull();
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
        "isolates client rosters between Trainers",
        async () => {
            const trainerA =
                await createTestUser();

            const trainerB =
                await createTestUser({
                    tenantId:
                        trainerA.user.tenantId,
                });

            const evidenceA =
                await createTrainerCommercialEvidence(
                    trainerA.user,
                );

            const evidenceB =
                await createTrainerCommercialEvidence(
                    trainerB.user,
                );

            const athlete =
                await createAthlete(
                    trainerA.user.tenantId,
                );

            try {
                const tokenA =
                    await login(
                        trainerA.user.tenantId,
                        trainerA.user.email,
                        trainerA.password,
                    );

                const tokenB =
                    await login(
                        trainerB.user.tenantId,
                        trainerB.user.email,
                        trainerB.password,
                    );

                const addResponse =
                    await request(app)
                        .post(
                            `/api/v1/auth/me/trainer-clients/${athlete.id}`,
                        )
                        .set(
                            "Authorization",
                            `Bearer ${tokenA}`,
                        );

                expect(addResponse.status).toBe(201);

                const listB =
                    await request(app)
                        .get(
                            "/api/v1/auth/me/trainer-clients",
                        )
                        .set(
                            "Authorization",
                            `Bearer ${tokenB}`,
                        );

                expect(listB.status).toBe(200);
                expect(listB.body).toEqual([]);
            }
            finally {
                await cleanupAthlete(
                    athlete.id,
                );

                await cleanupCommercialEvidence(
                    evidenceB,
                );

                await cleanupCommercialEvidence(
                    evidenceA,
                );
            }
        },
    );

    it(
        "ends a client relationship and excludes it from the active roster",
        async () => {
            const {
                user,
                password,
            } = await createTestUser();

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

                const addResponse =
                    await request(app)
                        .post(
                            `/api/v1/auth/me/trainer-clients/${athlete.id}`,
                        )
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        );

                expect(addResponse.status).toBe(201);

                const removeResponse =
                    await request(app)
                        .delete(
                            `/api/v1/auth/me/trainer-clients/${athlete.id}`,
                        )
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        );

                expect(removeResponse.status).toBe(204);

                const persisted =
                    await testPrisma
                        .athleteRelationship
                        .findFirstOrThrow({
                            where: {
                                athleteId:
                                    athlete.id,
                                relatedEntityId:
                                    user.id,
                                relationshipType:
                                    "TRAINER",
                            },
                        });

                expect(persisted.status).toBe(
                    "INACTIVE",
                );

                expect(persisted.endsAt).not.toBeNull();

                const listResponse =
                    await request(app)
                        .get(
                            "/api/v1/auth/me/trainer-clients",
                        )
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        );

                expect(listResponse.status).toBe(200);
                expect(listResponse.body).toEqual([]);
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
        "reactivates an existing inactive Trainer relationship",
        async () => {
            const {
                user,
                password,
            } = await createTestUser();

            const evidence =
                await createTrainerCommercialEvidence(
                    user,
                );

            const athlete =
                await createAthlete(
                    user.tenantId,
                );

            try {
                const existing =
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
                                startsAt:
                                    new Date(
                                        Date.now() -
                                        86_400_000,
                                    ),
                                endsAt:
                                    new Date(),
                            },
                        });

                const token =
                    await login(
                        user.tenantId,
                        user.email,
                        password,
                    );

                const response =
                    await request(app)
                        .post(
                            `/api/v1/auth/me/trainer-clients/${athlete.id}`,
                        )
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        );

                expect(response.status).toBe(201);

                expect(
                    response.body.relationshipId,
                ).toBe(existing.id);

                const persisted =
                    await testPrisma
                        .athleteRelationship
                        .findUniqueOrThrow({
                            where: {
                                id: existing.id,
                            },
                        });

                expect(persisted.status).toBe(
                    "ACTIVE",
                );

                expect(persisted.endsAt).toBeNull();
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
});
