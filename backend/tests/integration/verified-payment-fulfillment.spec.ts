import {afterAll, beforeAll, describe, expect, it} from "vitest";
import {DatabaseService} from "../../src/infrastructure/database/database.service";
import {BillingSubscriptionService} from "../../src/infrastructure/billing/billing-subscription.service";
import {PaidPeriodEntitlementService} from "../../src/infrastructure/billing/paid-period-entitlement.service";
import {ConfirmedPaymentInvoiceService} from "../../src/infrastructure/billing/confirmed-payment-invoice.service";
import {PaymentReconciliationService} from "../../src/infrastructure/billing/payment-reconciliation.service";
import {PaymentEventVerifier, VerifiedPaymentEvent, VerifiedPaymentEventService} from "../../src/infrastructure/billing/verified-payment-event.service";
import {testPrisma} from "../helpers/prisma-test.client";

const database = new DatabaseService();
let tenantId: string;
let otherTenantId: string;
let userId: string;
let productId: string;
let priceId: string;
let verified: VerifiedPaymentEvent;
const verifier: PaymentEventVerifier = {
    async verify(_raw, signature) {
        if(signature !== "valid-test-signature") throw new Error("Invalid provider signature.");
        return verified;
    },
};
const issuer = new ConfirmedPaymentInvoiceService(database, {
    issuerName: "TitanTech (Pty) Ltd",
    accountsCopyEmail: "accounts@titan-tech.co.za",
});
const processor = new VerifiedPaymentEventService(
    database, verifier, new BillingSubscriptionService(database),
    new PaidPeriodEntitlementService(database), issuer,
);
const reconciliation = new PaymentReconciliationService(database);
const body = new TextEncoder().encode("signed-provider-test-event");

beforeAll(async () => {
    const tenant = await testPrisma.tenant.create({data: {
        name: `Fulfillment ${crypto.randomUUID()}`,
        slug: `fulfillment-${crypto.randomUUID()}`,
    }});
    const other = await testPrisma.tenant.create({data: {
        name: `Other fulfillment ${crypto.randomUUID()}`,
        slug: `other-fulfillment-${crypto.randomUUID()}`,
    }});
    tenantId = tenant.id;
    otherTenantId = other.id;
    const user = await testPrisma.user.create({data: {
        tenantId, email: `fulfillment-${crypto.randomUUID()}@titan.test`,
        passwordHash: "test-hash", selectedUserType: "ATHLETE",
    }});
    userId = user.id;
    const product = await testPrisma.product.create({data: {
        tenantId, name: "Athlete monthly", slug: `athlete-${crypto.randomUUID()}`,
        priceCents: 19900, currency: "ZAR", billingInterval: "MONTHLY",
        entitlementUserType: "ATHLETE",
    }});
    productId = product.id;
    const price = await testPrisma.productPrice.create({data: {
        productId, amountMinor: 19900, currency: "ZAR", billingInterval: "MONTHLY",
    }});
    priceId = price.id;
});

afterAll(async () => {
    await testPrisma.billingInvoice.deleteMany({where: {tenantId}});
    await testPrisma.billingInvoiceCounter.deleteMany({where: {tenantId}});
    await testPrisma.userTypeEntitlement.deleteMany({where: {tenantId}});
    await testPrisma.billingSubscriptionPeriod.deleteMany({where: {tenantId}});
    await testPrisma.billingSubscription.deleteMany({where: {tenantId}});
    await testPrisma.payment.deleteMany({where: {tenantId}});
    await testPrisma.productPrice.deleteMany({where: {id: priceId}});
    await testPrisma.product.deleteMany({where: {id: productId}});
    await testPrisma.user.deleteMany({where: {id: userId}});
    await testPrisma.tenant.deleteMany({where: {id: {in: [tenantId, otherTenantId]}}});
});

async function pendingPayment() {
    return testPrisma.payment.create({data: {
        tenantId, userId, productId, productPriceId: priceId,
        amountMinor: 19900, currency: "ZAR", billingInterval: "MONTHLY",
    }});
}

function event(paymentId: string, outcome: VerifiedPaymentEvent["outcome"]): VerifiedPaymentEvent {
    return {tenantId, paymentId, outcome, amountMinor: 19900,
        currency: "ZAR", providerReference: `provider-${paymentId}`};
}

describe("Verified payment to paid access", () => {
    it("fulfills once, issues invoice, and denies access after refund", async () => {
        const pending = await pendingPayment();
        verified = event(pending.id, "CONFIRMED");
        const first = await processor.process(body, "valid-test-signature");
        const second = await processor.process(body, "valid-test-signature");
        expect(second).toEqual(first);
        const entitlement = await testPrisma.userTypeEntitlement.findUnique({where: {paymentId: pending.id}});
        const period = await testPrisma.billingSubscriptionPeriod.findUnique({where: {paymentId: pending.id}});
        const invoice = await testPrisma.billingInvoice.findFirst({where: {tenantId, paymentId: pending.id}});
        expect(entitlement?.validFrom).toEqual(period?.periodStart);
        expect(entitlement?.validUntil).toEqual(period?.periodEnd);
        expect(invoice?.amountMinor).toBe(19900);
        expect(await reconciliation.inspect(tenantId)).toEqual([]);

        verified = event(pending.id, "REFUNDED");
        expect(await processor.process(body, "valid-test-signature"))
            .toEqual({status: "REFUNDED"});
        expect((await testPrisma.payment.findUnique({where: {id: pending.id}}))?.status).toBe("REFUNDED");
        expect((await reconciliation.inspect(tenantId)).some(x =>
            x.paymentId === pending.id && x.issues.includes("REFUNDED_ENTITLEMENT_STILL_MARKED_ACTIVE"),
        )).toBe(true);
    });

    it("records a failed payment without issuing access", async () => {
        const pending = await pendingPayment();
        verified = event(pending.id, "FAILED");
        await processor.process(body, "valid-test-signature");
        expect((await testPrisma.payment.findUnique({where: {id: pending.id}}))?.status).toBe("FAILED");
        expect(await testPrisma.userTypeEntitlement.findUnique({where: {paymentId: pending.id}})).toBeNull();
    });

    it("rejects unsigned, cross-tenant, and amount-mismatched events", async () => {
        const pending = await pendingPayment();
        verified = event(pending.id, "CONFIRMED");
        await expect(processor.process(body, "invalid"))
            .rejects.toThrow("Invalid provider signature.");
        verified = {...verified, tenantId: otherTenantId};
        await expect(processor.process(body, "valid-test-signature"))
            .rejects.toThrow("Verified payment does not match its immutable snapshot.");
        verified = {...verified, tenantId, amountMinor: 1};
        await expect(processor.process(body, "valid-test-signature"))
            .rejects.toThrow("Verified payment does not match its immutable snapshot.");
        expect((await testPrisma.payment.findUnique({where: {id: pending.id}}))?.status).toBe("PENDING");
    });
});
