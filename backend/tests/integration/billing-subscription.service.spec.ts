import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { BillingInterval } from "../../src/domain/enums/billing-interval.enum";
import { BillingSubscriptionService } from "../../src/infrastructure/billing/billing-subscription.service";
import { DatabaseService } from "../../src/infrastructure/database/database.service";
import { testPrisma } from "../helpers/prisma-test.client";

const service = new BillingSubscriptionService(new DatabaseService());
let tenantId: string;
let otherTenantId: string;
let userId: string;
let productId: string;
let monthlyPriceId: string;
let annualPriceId: string;

beforeAll(async () => {
    const tenant = await testPrisma.tenant.create({data: {
        name: `Subscription ${crypto.randomUUID()}`,
        slug: `subscription-${crypto.randomUUID()}`,
    }});
    const other = await testPrisma.tenant.create({data: {
        name: `Other subscription ${crypto.randomUUID()}`,
        slug: `other-subscription-${crypto.randomUUID()}`,
    }});
    tenantId = tenant.id;
    otherTenantId = other.id;
    const user = await testPrisma.user.create({data: {
        tenantId, email: `subscription-${crypto.randomUUID()}@titan.test`,
        passwordHash: "test-hash",
    }});
    userId = user.id;
    const product = await testPrisma.product.create({data: {
        tenantId, name: "Subscription test product",
        slug: `subscription-product-${crypto.randomUUID()}`,
        priceCents: 19900, currency: "ZAR",
        billingInterval: BillingInterval.MONTHLY,
    }});
    productId = product.id;
    const monthly = await testPrisma.productPrice.create({data: {
        productId, amountMinor: 19900, currency: "ZAR",
        billingInterval: BillingInterval.MONTHLY,
    }});
    const annual = await testPrisma.productPrice.create({data: {
        productId, amountMinor: 199000, currency: "ZAR",
        billingInterval: BillingInterval.ANNUALLY,
    }});
    monthlyPriceId = monthly.id;
    annualPriceId = annual.id;
});

afterAll(async () => {
    await testPrisma.billingSubscriptionPeriod.deleteMany({where: {tenantId}});
    await testPrisma.billingSubscription.deleteMany({where: {tenantId}});
    await testPrisma.payment.deleteMany({where: {tenantId}});
    await testPrisma.productPrice.deleteMany({where: {productId}});
    await testPrisma.product.deleteMany({where: {id: productId}});
    await testPrisma.user.deleteMany({where: {id: userId}});
    await testPrisma.tenant.deleteMany({where: {id: {in: [tenantId, otherTenantId]}}});
});

async function payment(interval: BillingInterval, confirmedAt: Date, status: "CONFIRMED" | "PENDING" = "CONFIRMED") {
    return testPrisma.payment.create({data: {
        tenantId, userId, productId,
        productPriceId: interval === BillingInterval.MONTHLY ? monthlyPriceId : annualPriceId,
        amountMinor: interval === BillingInterval.MONTHLY ? 19900 : 199000,
        currency: "ZAR", billingInterval: interval, status,
        providerReference: status === "CONFIRMED" ? `provider-${crypto.randomUUID()}` : null,
        confirmedAt: status === "CONFIRMED" ? confirmedAt : null,
    }});
}

describe("Billing subscription payment linkage", () => {
    it("links monthly payments to one tenant/user subscription and extends a paid period", async () => {
        const first = await payment(BillingInterval.MONTHLY, new Date("2027-01-31T10:30:00.000Z"));
        const a = await service.linkConfirmedPayment({tenantId, paymentId: first.id});
        expect(a.periodEnd).toEqual(new Date("2027-02-28T10:30:00.000Z"));
        expect((await service.linkConfirmedPayment({tenantId, paymentId: first.id})).id).toBe(a.id);

        const next = await payment(BillingInterval.MONTHLY, new Date("2027-02-25T10:30:00.000Z"));
        const b = await service.linkConfirmedPayment({tenantId, paymentId: next.id, subscriptionId: a.subscriptionId});
        expect(b.periodStart).toEqual(a.periodEnd);
        expect(b.periodEnd).toEqual(new Date("2027-03-31T10:30:00.000Z"));
        expect(b.userId).toBe(userId);
    });

    it("clamps annual leap-day periods", async () => {
        const paid = await payment(BillingInterval.ANNUALLY, new Date("2028-02-29T08:00:00.000Z"));
        const period = await service.linkConfirmedPayment({tenantId, paymentId: paid.id});
        expect(period.periodEnd).toEqual(new Date("2029-02-28T08:00:00.000Z"));
    });

    it("rejects pending payments and cross-tenant access", async () => {
        const pending = await payment(BillingInterval.MONTHLY, new Date(), "PENDING");
        await expect(service.linkConfirmedPayment({tenantId, paymentId: pending.id}))
            .rejects.toThrow("A confirmed payment with provider evidence is required.");
        const paid = await payment(BillingInterval.MONTHLY, new Date());
        await expect(service.linkConfirmedPayment({tenantId: otherTenantId, paymentId: paid.id}))
            .rejects.toThrow("A confirmed payment with provider evidence is required.");
    });

    it("rejects a renewal against a subscription with a different interval", async () => {
        const annual = await payment(BillingInterval.ANNUALLY, new Date("2028-01-01T00:00:00.000Z"));
        const linked = await service.linkConfirmedPayment({tenantId, paymentId: annual.id});
        const monthly = await payment(BillingInterval.MONTHLY, new Date("2028-02-01T00:00:00.000Z"));
        await expect(service.linkConfirmedPayment({tenantId, paymentId: monthly.id, subscriptionId: linked.subscriptionId}))
            .rejects.toThrow("Subscription ownership or interval does not match.");
    });
});
