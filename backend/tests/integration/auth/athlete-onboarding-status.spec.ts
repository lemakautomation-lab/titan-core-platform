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

async function createCompleteEvidence(
    user: {
        id: string;
        tenantId: string;
    },
    entitlementStatus:
        "ACTIVE" | "EXPIRED" = "ACTIVE",
) {
    await testPrisma.user.update({
        where: {
            id: user.id,
        },
        data: {
            selectedUserType: "ATHLETE",
            contactNumber: "+27821234567",
        },
    });

    const athlete =
        await testPrisma.athlete.create({
            data: {
                tenantId: user.tenantId,
                userId: user.id,
                firstName: "Complete",
                lastName: "Athlete",
                countryCode: "ZA",
                dateOfBirth:
                    new Date(
                        "2000-01-01T00:00:00.000Z",
                    ),
            },
        });

    await testPrisma.athleteGoal.create({
        data: {
            tenantId: user.tenantId,
            athleteId: athlete.id,
            classification: "GENERAL_FITNESS",
            isPrimary: true,
        },
    });

    await testPrisma
        .athleteBodyMeasurement
        .create({
            data: {
                tenantId: user.tenantId,
                athleteId: athlete.id,
                heightCm: 180,
                weightKg: 81,
                bmi: 25,
            },
        });

    const product =
        await testPrisma.product.create({
            data: {
                tenantId: user.tenantId,
                name:
                    "Onboarding Athlete Product",
                slug:
                    `onboarding-${crypto.randomUUID()}`,
                description: null,
                priceCents: 19900,
                currency: "ZAR",
                billingInterval:
                    BillingInterval.MONTHLY,
                entitlementUserType: "ATHLETE",
            },
        });

    const price =
        await testPrisma.productPrice.create({
            data: {
                productId: product.id,
                amountMinor: 19900,
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
                amountMinor: 19900,
                currency: "ZAR",
                billingInterval:
                    BillingInterval.MONTHLY,
                status: "CONFIRMED",
                providerReference:
                    `onboarding-${crypto.randomUUID()}`,
                confirmedAt: new Date(),
            },
        });

    await testPrisma.userTypeEntitlement.create({
        data: {
            tenantId: user.tenantId,
            userId: user.id,
            paymentId: payment.id,
            productId: product.id,
            userType: "ATHLETE",
            status: entitlementStatus,
            validFrom: new Date(),
            validUntil: null,
        },
    });

    return {
        productId: product.id,
        priceId: price.id,
        paymentId: payment.id,
    };
}

async function removeCommercialEvidence(
    identifiers: {
        productId: string;
        priceId: string;
        paymentId: string;
    },
) {
    await testPrisma
        .userTypeEntitlement
        .deleteMany({
            where: {
                paymentId: identifiers.paymentId,
            },
        });

    await testPrisma.payment.deleteMany({
        where: {
            id: identifiers.paymentId,
        },
    });

    await testPrisma.productPrice.deleteMany({
        where: {
            id: identifiers.priceId,
        },
    });

    await testPrisma.product.deleteMany({
        where: {
            id: identifiers.productId,
        },
    });
}

describe(
    "Athlete onboarding status API",
    () => {

        beforeEach(
            async () => {
                await rateLimitModule
                    .resetAuthRateLimiter();
            },
        );

        it(
            "rejects an unauthenticated request",
            async () => {
                const response =
                    await request(app)
                        .get(
                            "/api/v1/auth/me/onboarding-status",
                        );

                expect(response.status).toBe(401);
            },
        );

        it(
            "returns deterministic missing requirements",
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
                            "/api/v1/auth/me/onboarding-status",
                        )
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        );

                expect(response.status).toBe(200);
                expect(response.body.complete).toBe(
                    false,
                );

                expect(
                    response.body.missingRequirements,
                ).toEqual([
                    "SELECTED_USER_TYPE",
                    "ACTIVE_ATHLETE_ENTITLEMENT",
                    "ATHLETE_PROFILE",
                    "FIRST_NAME",
                    "SURNAME",
                    "CONTACT_NUMBER",
                    "COUNTRY",
                    "DATE_OF_BIRTH",
                    "ATHLETE_GOALS",
                    "BODY_MEASUREMENT",
                ]);
            },
        );

        it(
            "reports complete with all required evidence",
            async () => {
                const {
                    user,
                    password,
                } = await createTestUser();

                const commercial =
                    await createCompleteEvidence(user);

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
                                "/api/v1/auth/me/onboarding-status",
                            )
                            .set(
                                "Authorization",
                                `Bearer ${token}`,
                            );

                    expect(response.status).toBe(200);
                    expect(response.body).toEqual({
                        complete: true,
                        missingRequirements: [],
                    });
                }
                finally {
                    await removeCommercialEvidence(
                        commercial,
                    );
                }
            },
        );

        it(
            "rejects inactive entitlement as incomplete",
            async () => {
                const {
                    user,
                    password,
                } = await createTestUser();

                const commercial =
                    await createCompleteEvidence(
                        user,
                        "EXPIRED",
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
                                "/api/v1/auth/me/onboarding-status",
                            )
                            .set(
                                "Authorization",
                                `Bearer ${token}`,
                            );

                    expect(response.status).toBe(200);
                    expect(response.body.complete).toBe(
                        false,
                    );
                    expect(
                        response.body
                            .missingRequirements,
                    ).toEqual([
                        "ACTIVE_ATHLETE_ENTITLEMENT",
                    ]);
                }
                finally {
                    await removeCommercialEvidence(
                        commercial,
                    );
                }
            },
        );
    },
);