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
                name: "Trainer Profile Subscription",
                slug:
                    `trainer-profile-${crypto.randomUUID()}`,
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
                    `trainer-profile-${crypto.randomUUID()}`,
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

async function cleanup(
    userId: string,
    evidence?: Awaited<
        ReturnType<
            typeof createTrainerCommercialEvidence
        >
    >,
): Promise<void> {
    await testPrisma.trainerProfile.deleteMany({
        where: {
            userId,
        },
    });

    if (!evidence) {
        return;
    }

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

describe("Trainer professional profile API", () => {

    beforeEach(async () => {
        await rateLimitModule
            .resetAuthRateLimiter();
    });

    it(
        "rejects unauthenticated profile access",
        async () => {
            const getResponse =
                await request(app)
                    .get(
                        "/api/v1/auth/me/trainer-profile",
                    );

            expect(getResponse.status).toBe(401);

            const putResponse =
                await request(app)
                    .put(
                        "/api/v1/auth/me/trainer-profile",
                    )
                    .send({});

            expect(putResponse.status).toBe(401);
        },
    );

    it(
        "denies a user who has not selected TRAINER",
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
                        "/api/v1/auth/me/trainer-profile",
                    )
                    .set(
                        "Authorization",
                        `Bearer ${token}`,
                    );

            expect(response.status).toBe(403);
        },
    );

    it(
        "denies a Trainer without active commercial entitlement",
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
                    selectedUserType: "TRAINER",
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
                        "/api/v1/auth/me/trainer-profile",
                    )
                    .set(
                        "Authorization",
                        `Bearer ${token}`,
                    );

            expect(response.status).toBe(403);
        },
    );

    it(
        "returns null before an entitled Trainer creates a profile",
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
                            "/api/v1/auth/me/trainer-profile",
                        )
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        );

                expect(response.status).toBe(200);
                expect(response.body).toBeNull();
            }
            finally {
                await cleanup(
                    user.id,
                    evidence,
                );
            }
        },
    );

    it(
        "creates a tenant-owned professional profile",
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
                        .put(
                            "/api/v1/auth/me/trainer-profile",
                        )
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        )
                        .send({
                            professionalTitle:
                                "Performance Coach",
                            bio:
                                "Strength and conditioning specialist.",
                            qualifications:
                                "Certified Performance Coach",
                            specialisations:
                                "Strength, Conditioning",
                            yearsExperience: 8,
                            countryCode: "za",
                            websiteUrl:
                                "https://example.com",
                        });

                expect(response.status).toBe(200);
                expect(
                    response.body,
                ).not.toHaveProperty("userId");
                expect(
                    response.body,
                ).not.toHaveProperty("tenantId");
                expect(
                    response.body.countryCode,
                ).toBe("ZA");

                const stored =
                    await testPrisma
                        .trainerProfile
                        .findFirst({
                            where: {
                                userId: user.id,
                                tenantId:
                                    user.tenantId,
                            },
                        });

                expect(stored).not.toBeNull();
                expect(
                    stored?.professionalTitle,
                ).toBe("Performance Coach");
                expect(
                    stored?.yearsExperience,
                ).toBe(8);
            }
            finally {
                await cleanup(
                    user.id,
                    evidence,
                );
            }
        },
    );

    it(
        "updates the existing profile without creating a duplicate",
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

                const endpoint =
                    "/api/v1/auth/me/trainer-profile";

                const first =
                    await request(app)
                        .put(endpoint)
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        )
                        .send({
                            professionalTitle:
                                "Trainer",
                            yearsExperience: 3,
                        });

                expect(first.status).toBe(200);

                const second =
                    await request(app)
                        .put(endpoint)
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        )
                        .send({
                            professionalTitle:
                                "Senior Trainer",
                            yearsExperience: 4,
                        });

                expect(second.status).toBe(200);
                expect(
                    second.body.professionalTitle,
                ).toBe("Senior Trainer");

                const count =
                    await testPrisma
                        .trainerProfile
                        .count({
                            where: {
                                userId: user.id,
                                tenantId:
                                    user.tenantId,
                            },
                        });

                expect(count).toBe(1);
            }
            finally {
                await cleanup(
                    user.id,
                    evidence,
                );
            }
        },
    );

    it(
        "rejects client-controlled ownership and authorization fields",
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

                for (
                    const forbiddenField of [
                        "tenantId",
                        "userId",
                        "selectedUserType",
                        "roles",
                        "permissions",
                        "paymentStatus",
                        "entitlementStatus",
                        "status",
                    ]
                ) {
                    const response =
                        await request(app)
                            .put(
                                "/api/v1/auth/me/trainer-profile",
                            )
                            .set(
                                "Authorization",
                                `Bearer ${token}`,
                            )
                            .send({
                                professionalTitle:
                                    "Trainer",
                                [forbiddenField]:
                                    "malicious",
                            });

                    expect(
                        response.status,
                        forbiddenField,
                    ).toBe(400);
                }

                const count =
                    await testPrisma
                        .trainerProfile
                        .count({
                            where: {
                                userId: user.id,
                            },
                        });

                expect(count).toBe(0);
            }
            finally {
                await cleanup(
                    user.id,
                    evidence,
                );
            }
        },
    );

    it(
        "rejects invalid professional profile values",
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

                const endpoint =
                    "/api/v1/auth/me/trainer-profile";

                const negativeExperience =
                    await request(app)
                        .put(endpoint)
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        )
                        .send({
                            yearsExperience: -1,
                        });

                expect(
                    negativeExperience.status,
                ).toBe(400);

                const invalidCountry =
                    await request(app)
                        .put(endpoint)
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        )
                        .send({
                            countryCode: "South Africa",
                        });

                expect(
                    invalidCountry.status,
                ).toBe(400);

                const invalidWebsite =
                    await request(app)
                        .put(endpoint)
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        )
                        .send({
                            websiteUrl:
                                "javascript:alert(1)",
                        });

                expect(
                    invalidWebsite.status,
                ).toBe(400);
            }
            finally {
                await cleanup(
                    user.id,
                    evidence,
                );
            }
        },
    );

    it(
        "returns only the authenticated Trainer's tenant-owned profile",
        async () => {
            const first =
                await createTestUser();

            const second =
                await createTestUser();

            const firstEvidence =
                await createTrainerCommercialEvidence(
                    first.user,
                );

            const secondEvidence =
                await createTrainerCommercialEvidence(
                    second.user,
                );

            try {
                const firstToken =
                    await login(
                        first.user.tenantId,
                        first.user.email,
                        first.password,
                    );

                const secondToken =
                    await login(
                        second.user.tenantId,
                        second.user.email,
                        second.password,
                    );

                await request(app)
                    .put(
                        "/api/v1/auth/me/trainer-profile",
                    )
                    .set(
                        "Authorization",
                        `Bearer ${firstToken}`,
                    )
                    .send({
                        professionalTitle:
                            "First Trainer",
                    })
                    .expect(200);

                await request(app)
                    .put(
                        "/api/v1/auth/me/trainer-profile",
                    )
                    .set(
                        "Authorization",
                        `Bearer ${secondToken}`,
                    )
                    .send({
                        professionalTitle:
                            "Second Trainer",
                    })
                    .expect(200);

                const response =
                    await request(app)
                        .get(
                            "/api/v1/auth/me/trainer-profile",
                        )
                        .set(
                            "Authorization",
                            `Bearer ${firstToken}`,
                        );

                expect(response.status).toBe(200);
                expect(
                    response.body,
                ).not.toHaveProperty("userId");
                expect(
                    response.body,
                ).not.toHaveProperty("tenantId");
                expect(
                    response.body.professionalTitle,
                ).toBe("First Trainer");
            }
            finally {
                await cleanup(
                    first.user.id,
                    firstEvidence,
                );

                await cleanup(
                    second.user.id,
                    secondEvidence,
                );
            }
        },
    );

});
