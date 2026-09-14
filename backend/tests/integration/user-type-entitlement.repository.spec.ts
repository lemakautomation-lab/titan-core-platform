import {
    afterAll,
    afterEach,
    beforeAll,
    describe,
    expect,
    it,
} from "vitest";

import { UserTypeEntitlement } from "../../src/domain/entities/user-type-entitlement.entity";
import { BillingInterval } from "../../src/domain/enums/billing-interval.enum";
import { EntitlementStatus } from "../../src/domain/enums/entitlement-status.enum";
import { OnboardingUserType } from "../../src/domain/enums/onboarding-user-type.enum";
import { PrismaUserTypeEntitlementRepository } from "../../src/infrastructure/repositories/user-type-entitlement.repository";
import { DatabaseService } from "../../src/infrastructure/database/database.service";
import { testPrisma } from "../helpers/prisma-test.client";

const database =
    new DatabaseService();

const repository =
    new PrismaUserTypeEntitlementRepository(
        database,
    );

let tenantId: string;
let otherTenantId: string;
let userId: string;
let productId: string;
let productPriceId: string;

const validFrom =
    new Date("2026-09-14T10:00:00.000Z");

const validUntil =
    new Date("2026-10-14T10:00:00.000Z");

beforeAll(
    async () => {

        const tenant =
            await testPrisma.tenant.create({
                data: {
                    name:
                        `Entitlement Tenant ${crypto.randomUUID()}`,
                    slug:
                        `entitlement-${crypto.randomUUID()}`,
                },
            });

        const otherTenant =
            await testPrisma.tenant.create({
                data: {
                    name:
                        `Other Entitlement Tenant ${crypto.randomUUID()}`,
                    slug:
                        `other-entitlement-${crypto.randomUUID()}`,
                },
            });

        tenantId = tenant.id;
        otherTenantId = otherTenant.id;

        const user =
            await testPrisma.user.create({
                data: {
                    tenantId,
                    email:
                        `entitlement-${crypto.randomUUID()}@titan.test`,
                    passwordHash: "test-password-hash",
                    selectedUserType:
                        OnboardingUserType.ATHLETE,
                },
            });

        userId = user.id;

        const product =
            await testPrisma.product.create({
                data: {
                    tenantId,
                    name: "Athlete Entitlement Product",
                    slug:
                        `athlete-entitlement-${crypto.randomUUID()}`,
                    description: null,
                    priceCents: 19900,
                    currency: "ZAR",
                    billingInterval:
                        BillingInterval.MONTHLY,
                    entitlementUserType:
                        OnboardingUserType.ATHLETE,
                },
            });

        productId = product.id;

        const price =
            await testPrisma.productPrice.create({
                data: {
                    productId,
                    amountMinor: 19900,
                    currency: "ZAR",
                    billingInterval:
                        BillingInterval.MONTHLY,
                },
            });

        productPriceId = price.id;
    },
);

afterEach(
    async () => {

        await testPrisma.userTypeEntitlement.deleteMany({
            where: {
                tenantId,
            },
        });

        await testPrisma.payment.deleteMany({
            where: {
                tenantId,
            },
        });
    },
);

afterAll(
    async () => {

        await testPrisma.userTypeEntitlement.deleteMany({
            where: {
                tenantId,
            },
        });

        await testPrisma.payment.deleteMany({
            where: {
                tenantId,
            },
        });

        await testPrisma.productPrice.deleteMany({
            where: {
                productId,
            },
        });

        await testPrisma.product.deleteMany({
            where: {
                tenantId,
            },
        });

        await testPrisma.user.deleteMany({
            where: {
                tenantId,
            },
        });

        await testPrisma.tenant.deleteMany({
            where: {
                id: {
                    in: [
                        tenantId,
                        otherTenantId,
                    ],
                },
            },
        });
    },
);

async function createConfirmedPayment(): Promise<string> {

    const payment =
        await testPrisma.payment.create({
            data: {
                tenantId,
                userId,
                productId,
                productPriceId,
                amountMinor: 19900,
                currency: "ZAR",
                billingInterval:
                    BillingInterval.MONTHLY,
                status: "CONFIRMED",
                providerReference:
                    `provider-${crypto.randomUUID()}`,
                confirmedAt: validFrom,
            },
        });

    return payment.id;
}

async function createEntitlement(
    status: EntitlementStatus =
        EntitlementStatus.ACTIVE,
): Promise<UserTypeEntitlement> {

    const paymentId =
        await createConfirmedPayment();

    return new UserTypeEntitlement(
        crypto.randomUUID(),
        tenantId,
        userId,
        paymentId,
        productId,
        OnboardingUserType.ATHLETE,
        status,
        validFrom,
        validUntil,
        validFrom,
        validFrom,
    );
}

describe(
    "User-type entitlement repository",
    () => {

        it(
            "creates and retrieves an entitlement in its tenant",
            async () => {

                const entitlement =
                    await createEntitlement();

                const created =
                    await repository.create(
                        entitlement,
                    );

                const found =
                    await repository.findById(
                        created.id,
                        tenantId,
                    );

                expect(found?.id).toBe(
                    entitlement.id,
                );

                expect(found?.userType).toBe(
                    OnboardingUserType.ATHLETE,
                );
            },
        );

        it(
            "does not expose an entitlement across tenants",
            async () => {

                const entitlement =
                    await createEntitlement();

                await repository.create(
                    entitlement,
                );

                const found =
                    await repository.findById(
                        entitlement.id,
                        otherTenantId,
                    );

                expect(found).toBeNull();
            },
        );

        it(
            "finds only active and unexpired entitlements",
            async () => {

                const entitlement =
                    await createEntitlement();

                await repository.create(
                    entitlement,
                );

                const active =
                    await repository.findActive(
                        userId,
                        OnboardingUserType.ATHLETE,
                        tenantId,
                        new Date(
                            "2026-09-20T10:00:00.000Z",
                        ),
                    );

                const expired =
                    await repository.findActive(
                        userId,
                        OnboardingUserType.ATHLETE,
                        tenantId,
                        validUntil,
                    );

                expect(active).toHaveLength(1);
                expect(expired).toHaveLength(0);
            },
        );

        it(
            "persists entitlement revocation",
            async () => {

                const entitlement =
                    await createEntitlement();

                const created =
                    await repository.create(
                        entitlement,
                    );

                created.revoke(
                    new Date(
                        "2026-09-20T10:00:00.000Z",
                    ),
                );

                const updated =
                    await repository.update(
                        created,
                    );

                expect(updated.status).toBe(
                    EntitlementStatus.REVOKED,
                );
            },
        );

        it(
            "prevents two entitlements for one payment",
            async () => {

                const entitlement =
                    await createEntitlement();

                await repository.create(
                    entitlement,
                );

                const duplicate =
                    new UserTypeEntitlement(
                        crypto.randomUUID(),
                        entitlement.tenantId,
                        entitlement.userId,
                        entitlement.paymentId,
                        entitlement.productId,
                        entitlement.userType,
                        EntitlementStatus.ACTIVE,
                        entitlement.validFrom,
                        entitlement.validUntil,
                        entitlement.createdAt,
                        entitlement.updatedAt,
                    );

                await expect(
                    repository.create(
                        duplicate,
                    ),
                ).rejects.toThrow();
            },
        );
    },
);
