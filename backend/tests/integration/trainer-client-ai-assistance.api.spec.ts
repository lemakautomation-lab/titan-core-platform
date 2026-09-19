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
        .send({ tenantId, email, password });

    expect(response.status).toBe(200);
    return response.body.data.accessToken;
}

async function createTrainerCommercialEvidence(
    user: { id: string; tenantId: string },
) {
    await testPrisma.user.update({
        where: { id: user.id },
        data: { selectedUserType: "TRAINER" },
    });

    const product = await testPrisma.product.create({
        data: {
            tenantId: user.tenantId,
            name: "Trainer AI Assistance",
            slug: `trainer-ai-${crypto.randomUUID()}`,
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
            providerReference: `trainer-ai-${crypto.randomUUID()}`,
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
                validUntil: new Date(Date.now() + 86_400_000),
            },
        });

    return { product, price, payment, entitlement };
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

describe(
    "Mission 064.9 - Trainer AI assistance API",
    () => {
        beforeEach(async () => {
            await rateLimitModule.resetAuthRateLimiter();
        });

        it("rejects unauthenticated AI assistance", async () => {
            const response = await request(app).get(
                "/api/v1/workout-programmes/trainer/clients/athlete-id/ai-assistance",
            );

            expect(response.status).toBe(401);
        });

        it("enforces workout-programmes.read permission", async () => {
            const { user, password } =
                await createTestUser({
                    permissions: [],
                });

            const token = await login(
                user.tenantId,
                user.email,
                password,
            );

            const response = await request(app)
                .get(
                    "/api/v1/workout-programmes/trainer/clients/athlete-id/ai-assistance",
                )
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(403);
        });

        it("rejects AI assistance without an active Trainer-client relationship", async () => {
            const { user, password } =
                await createTestUser({
                    permissions: [
                        "workout-programmes.read",
                    ],
                });

            const evidence =
                await createTrainerCommercialEvidence(user);

            const athlete = await testPrisma.athlete.create({
                data: {
                    tenantId: user.tenantId,
                    firstName: "Unrelated",
                    lastName: "AI",
                    countryCode: "ZA",
                },
            });

            try {
                const token = await login(
                    user.tenantId,
                    user.email,
                    password,
                );

                const response = await request(app)
                    .get(
                        `/api/v1/workout-programmes/trainer/clients/${athlete.id}/ai-assistance`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${token}`,
                    );

                expect(response.status).toBe(400);
                expect(response.body.error).toBe(
                    "Active Trainer client relationship is required.",
                );
            } finally {
                await testPrisma.athlete.deleteMany({
                    where: { id: athlete.id },
                });

                await cleanupCommercialEvidence(
                    evidence,
                );
            }
        });

        it("fails closed when the AI provider is unavailable", async () => {
            const { user, password } =
                await createTestUser({
                    permissions: [
                        "workout-programmes.read",
                    ],
                });

            const evidence =
                await createTrainerCommercialEvidence(user);

            const athlete = await testPrisma.athlete.create({
                data: {
                    tenantId: user.tenantId,
                    firstName: "Client",
                    lastName: "AI",
                    countryCode: "ZA",
                },
            });

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

                const response = await request(app)
                    .get(
                        `/api/v1/workout-programmes/trainer/clients/${athlete.id}/ai-assistance`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${token}`,
                    );

                expect(response.status).toBe(400);
                expect(response.body.error).toBe(
                    "AI assistance is unavailable.",
                );
            } finally {
                await testPrisma.athleteRelationship.deleteMany({
                    where: { athleteId: athlete.id },
                });

                await testPrisma.athlete.deleteMany({
                    where: { id: athlete.id },
                });

                await cleanupCommercialEvidence(
                    evidence,
                );
            }
        });
    },
);
