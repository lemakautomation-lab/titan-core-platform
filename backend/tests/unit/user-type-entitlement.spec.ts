import {
    describe,
    expect,
    it,
} from "vitest";

import { Payment } from "../../src/domain/entities/payment.entity";
import { Product } from "../../src/domain/entities/product.entity";
import { UserTypeEntitlement } from "../../src/domain/entities/user-type-entitlement.entity";
import { BillingInterval } from "../../src/domain/enums/billing-interval.enum";
import { EntitlementStatus } from "../../src/domain/enums/entitlement-status.enum";
import { OnboardingUserType } from "../../src/domain/enums/onboarding-user-type.enum";
import { ProductStatus } from "../../src/domain/enums/product-status.enum";

const issuedAt =
    new Date("2026-09-14T08:00:00.000Z");

function createProduct(
    userType: OnboardingUserType | null =
        OnboardingUserType.ATHLETE,
): Product {

    return new Product(
        "product-1",
        "tenant-1",
        "Athlete Monthly",
        "athlete-monthly",
        null,
        19900,
        "ZAR",
        BillingInterval.MONTHLY,
        ProductStatus.ACTIVE,
        issuedAt,
        issuedAt,
        userType,
    );
}

function createPayment(
    interval: BillingInterval =
        BillingInterval.MONTHLY,
): Payment {

    const payment =
        Payment.create(
            "tenant-1",
            "user-1",
            "product-1",
            "price-1",
            19900,
            "ZAR",
            interval,
        );

    payment.confirm(
        "provider-reference",
    );

    return payment;
}

describe(
    "Paid user-type entitlement",
    () => {

        it(
            "issues an active entitlement from confirmed payment",
            () => {

                const entitlement =
                    UserTypeEntitlement.issue(
                        createPayment(),
                        createProduct(),
                        OnboardingUserType.ATHLETE,
                        issuedAt,
                    );

                expect(
                    entitlement.status,
                ).toBe(
                    EntitlementStatus.ACTIVE,
                );

                expect(
                    entitlement.validUntil,
                ).toEqual(
                    new Date(
                        "2026-10-14T08:00:00.000Z",
                    ),
                );
            },
        );

        it(
            "rejects a non-confirmed payment",
            () => {

                const payment =
                    createPayment();

                payment.refund();

                expect(
                    () =>
                        UserTypeEntitlement.issue(
                            payment,
                            createProduct(),
                            OnboardingUserType.ATHLETE,
                            issuedAt,
                        ),
                ).toThrow(
                    "A confirmed payment is required.",
                );
            },
        );

        it(
            "rejects a mismatched selected user type",
            () => {

                expect(
                    () =>
                        UserTypeEntitlement.issue(
                            createPayment(),
                            createProduct(
                                OnboardingUserType.TRAINER,
                            ),
                            OnboardingUserType.ATHLETE,
                            issuedAt,
                        ),
                ).toThrow(
                    "Selected user type does not match the Product.",
                );
            },
        );

        it(
            "rejects a Product without a user-type target",
            () => {

                expect(
                    () =>
                        UserTypeEntitlement.issue(
                            createPayment(),
                            createProduct(null),
                            OnboardingUserType.ATHLETE,
                            issuedAt,
                        ),
                ).toThrow(
                    "Selected user type does not match the Product.",
                );
            },
        );

        it(
            "denies access after payment refund",
            () => {

                const payment =
                    createPayment();

                const entitlement =
                    UserTypeEntitlement.issue(
                        payment,
                        createProduct(),
                        OnboardingUserType.ATHLETE,
                        issuedAt,
                    );

                payment.refund();

                expect(
                    entitlement.isActive(
                        payment,
                        issuedAt,
                    ),
                ).toBe(false);
            },
        );

        it(
            "expires monthly entitlement deterministically",
            () => {

                const payment =
                    createPayment();

                const entitlement =
                    UserTypeEntitlement.issue(
                        payment,
                        createProduct(),
                        OnboardingUserType.ATHLETE,
                        issuedAt,
                    );

                const expiry =
                    new Date(
                        "2026-10-14T08:00:00.000Z",
                    );

                expect(
                    entitlement.isActive(
                        payment,
                        expiry,
                    ),
                ).toBe(false);

                entitlement.expire(
                    expiry,
                );

                expect(
                    entitlement.status,
                ).toBe(
                    EntitlementStatus.EXPIRED,
                );
            },
        );

        it(
            "creates a non-expiring one-time entitlement",
            () => {

                const entitlement =
                    UserTypeEntitlement.issue(
                        createPayment(
                            BillingInterval.ONE_TIME,
                        ),
                        createProduct(),
                        OnboardingUserType.ATHLETE,
                        issuedAt,
                    );

                expect(
                    entitlement.validUntil,
                ).toBeNull();
            },
        );

        it(
            "denies access after revocation",
            () => {

                const payment =
                    createPayment();

                const entitlement =
                    UserTypeEntitlement.issue(
                        payment,
                        createProduct(),
                        OnboardingUserType.ATHLETE,
                        issuedAt,
                    );

                entitlement.revoke(
                    issuedAt,
                );

                expect(
                    entitlement.isActive(
                        payment,
                        issuedAt,
                    ),
                ).toBe(false);
            },
        );
    },
);
