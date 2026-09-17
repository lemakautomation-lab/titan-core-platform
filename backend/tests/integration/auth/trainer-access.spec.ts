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

async function selectTrainer(
    userId: string,
): Promise<void> {
    await testPrisma.user.update({
        where: {
            id: userId,
        },
        data: {
            selectedUserType: "TRAINER",
        },
    });
}

async function createTrainerCommercialEvidence(
    user: {
        id: string;
        tenantId: string;
    },
) {
    await selectTrainer(user.id);

    const product =
        await testPrisma.product.create({
            data: {
                tenantId: user.tenantId,
                name: "Trainer Subscription",
                slug:
                    `trainer-${crypto.randomUUID()}`,
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
                    `trainer-${crypto.randomUUID()}`,
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
                    new Date(
                        Date.now() - 60_000,
                    ),
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

describe("Trainer access API", () => {

    beforeEach(async () => {
        await rateLimitModule
            .resetAuthRateLimiter();
    });

    it(
        "rejects an unauthenticated request",
        async () => {
            const response =
                await request(app)
                    .get(
                        "/api/v1/auth/me/trainer-access",
                    );

            expect(response.status).toBe(401);
        },
    );

    it(
        "denies access when TRAINER is not selected",
        async () => {
            const {
                user,
                password,
            } = await createTestUser();

            const token =
                await login(
                    user.tenantId,
                    user.email,
                    password,
                );

            const response =
                await request(app)
                    .get(
                        "/api/v1/auth/me/trainer-access",
                    )
                    .set(
                        "Authorization",
                        `Bearer ${token}`,
                    );

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                accessGranted: false,
                reason:
                    "TRAINER_TYPE_REQUIRED",
            });
        },
    );

    it(
        "denies an inactive Trainer account",
        async () => {
            const {
                user,
            } = await createTestUser();

            await selectTrainer(user.id);

            await testPrisma.user.update({
                where: {
                    id: user.id,
                },
                data: {
                    status: "INACTIVE",
                },
            });

            const result =
                await import(
                    "../../../src/infrastructure/composition/auth.module"
                );

            const access =
                await result.authModule
                    .getMyTrainerAccessUseCase
                    .execute({
                        userId: user.id,
                        tenantId: user.tenantId,
                    });

            expect(access.isSuccess).toBe(false);
            expect(access.error).toBe(
                "User account is not active.",
            );
        },
    );
    it(
        "denies access without an active Trainer entitlement",
        async () => {
            const {
                user,
                password,
            } = await createTestUser();

            await selectTrainer(user.id);

            const token =
                await login(
                    user.tenantId,
                    user.email,
                    password,
                );

            const response =
                await request(app)
                    .get(
                        "/api/v1/auth/me/trainer-access",
                    )
                    .set(
                        "Authorization",
                        `Bearer ${token}`,
                    );

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                accessGranted: false,
                reason:
                    "ACTIVE_TRAINER_ENTITLEMENT_REQUIRED",
            });
        },
    );

    it(
        "grants access with valid Trainer entitlement and confirmed source payment",
        async () => {
            const {
                user,
                password,
            } = await createTestUser();

            const evidence =
                await createTrainerCommercialEvidence(
                    user,
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
                            "/api/v1/auth/me/trainer-access",
                        )
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        );

                expect(response.status).toBe(200);
                expect(response.body).toEqual({
                    accessGranted: true,
                    reason: "GRANTED",
                });
            }
            finally {
                await cleanupCommercialEvidence(
                    evidence,
                );
            }
        },
    );

    it(
        "denies access when the source payment is refunded",
        async () => {
            const {
                user,
                password,
            } = await createTestUser();

            const evidence =
                await createTrainerCommercialEvidence(
                    user,
                );

            try {
                await testPrisma.payment.update({
                    where: {
                        id: evidence.payment.id,
                    },
                    data: {
                        status: "REFUNDED",
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
                        .get(
                            "/api/v1/auth/me/trainer-access",
                        )
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        );

                expect(response.status).toBe(200);
                expect(response.body).toEqual({
                    accessGranted: false,
                    reason:
                        "ACTIVE_TRAINER_ENTITLEMENT_REQUIRED",
                });
            }
            finally {
                await cleanupCommercialEvidence(
                    evidence,
                );
            }
        },
    );

    it(
        "denies an expired Trainer entitlement",
        async () => {
            const {
                user,
                password,
            } = await createTestUser();

            const evidence =
                await createTrainerCommercialEvidence(
                    user,
                );

            try {
                await testPrisma
                    .userTypeEntitlement
                    .update({
                        where: {
                            id:
                                evidence
                                    .entitlement.id,
                        },
                        data: {
                            validUntil:
                                new Date(
                                    Date.now() -
                                    60_000,
                                ),
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
                        .get(
                            "/api/v1/auth/me/trainer-access",
                        )
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        );

                expect(response.status).toBe(200);
                expect(response.body.accessGranted)
                    .toBe(false);
            }
            finally {
                await cleanupCommercialEvidence(
                    evidence,
                );
            }
        },
    );

    it(
        "denies a revoked Trainer entitlement",
        async () => {
            const {
                user,
                password,
            } = await createTestUser();

            const evidence =
                await createTrainerCommercialEvidence(
                    user,
                );

            try {
                await testPrisma
                    .userTypeEntitlement
                    .update({
                        where: {
                            id:
                                evidence
                                    .entitlement.id,
                        },
                        data: {
                            status: "REVOKED",
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
                        .get(
                            "/api/v1/auth/me/trainer-access",
                        )
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        );

                expect(response.status).toBe(200);
                expect(response.body.accessGranted)
                    .toBe(false);
            }
            finally {
                await cleanupCommercialEvidence(
                    evidence,
                );
            }
        },
    );
});
