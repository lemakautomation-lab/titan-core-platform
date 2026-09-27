import {
    randomUUID,
} from "node:crypto";

import {
    afterAll,
    describe,
    expect,
    it,
} from "vitest";

import {
    InvoiceEmailDelivery,
} from "../../src/application/ports/invoice-email-delivery";
import {
    BillingInvoiceDeliveryService,
} from "../../src/infrastructure/billing/billing-invoice-delivery.service";
import {
    ConfirmedPaymentInvoiceService,
} from "../../src/infrastructure/billing/confirmed-payment-invoice.service";
import {
    DatabaseService,
} from "../../src/infrastructure/database/database.service";
import {
    testPrisma,
} from "../helpers/prisma-test.client";

const database=
    new DatabaseService();

const tenants: string[]=[];
const users: string[]=[];
const products: string[]=[];
const prices: string[]=[];

async function createInvoice() {
    const key=
        randomUUID();

    const tenant=
        await testPrisma.tenant.create({
            data: {
                name:
                    `Delivery ${key}`,
                slug:
                    `delivery-${key}`,
            },
        });

    tenants.push(
        tenant.id,
    );

    const user=
        await testPrisma.user.create({
            data: {
                tenantId:
                    tenant.id,
                email:
                    `delivery-${key}@titan.test`,
                firstName:
                    "Invoice",
                lastName:
                    "Recipient",
                passwordHash:
                    "test-hash",
            },
        });

    users.push(
        user.id,
    );

    const product=
        await testPrisma.product.create({
            data: {
                tenantId:
                    tenant.id,
                name:
                    "Delivery Membership",
                slug:
                    `delivery-product-${key}`,
                priceCents:
                    15000,
                currency:
                    "ZAR",
                billingInterval:
                    "MONTHLY",
            },
        });

    products.push(
        product.id,
    );

    const price=
        await testPrisma.productPrice.create({
            data: {
                productId:
                    product.id,
                amountMinor:
                    15000,
                currency:
                    "ZAR",
                billingInterval:
                    "MONTHLY",
            },
        });

    prices.push(
        price.id,
    );

    const payment=
        await testPrisma.payment.create({
            data: {
                tenantId:
                    tenant.id,
                userId:
                    user.id,
                productId:
                    product.id,
                productPriceId:
                    price.id,
                amountMinor:
                    15000,
                currency:
                    "ZAR",
                billingInterval:
                    "MONTHLY",
                status:
                    "CONFIRMED",
                providerReference:
                    `provider-${key}`,
                confirmedAt:
                    new Date(),
            },
        });

    const issuer=
        new ConfirmedPaymentInvoiceService(
            database,
            {
                issuerName:
                    "TitanTech (Pty) Ltd",
                accountsCopyEmail:
                    "accounts@titan-tech.co.za",
            },
        );

    const invoice=
        await issuer.issueForConfirmedPayment(
            tenant.id,
            payment.id,
        );

    return {
        tenant,
        invoice,
    };
}

afterAll(async () => {
    await testPrisma.billingInvoice.deleteMany({
        where: {
            tenantId: {
                in:
                    tenants,
            },
        },
    });

    await testPrisma.billingInvoiceCounter.deleteMany({
        where: {
            tenantId: {
                in:
                    tenants,
            },
        },
    });

    await testPrisma.payment.deleteMany({
        where: {
            tenantId: {
                in:
                    tenants,
            },
        },
    });

    await testPrisma.productPrice.deleteMany({
        where: {
            id: {
                in:
                    prices,
            },
        },
    });

    await testPrisma.product.deleteMany({
        where: {
            id: {
                in:
                    products,
            },
        },
    });

    await testPrisma.user.deleteMany({
        where: {
            id: {
                in:
                    users,
            },
        },
    });

    await testPrisma.tenant.deleteMany({
        where: {
            id: {
                in:
                    tenants,
            },
        },
    });
});

describe(
    "Mission 110.2 invoice delivery state",
    () => {
        it(
            "marks a successful fake delivery SENT and does not send twice",
            async () => {
                const fixture=
                    await createInvoice();

                let calls=0;

                const fake: InvoiceEmailDelivery={
                    async deliver(message) {
                        calls+=1;

                        expect(
                            message.accountsCopyEmail,
                        ).toBe(
                            "accounts@titan-tech.co.za",
                        );

                        expect(
                            message.pdfContent.length,
                        ).toBeGreaterThan(
                            100,
                        );

                        return {
                            provider:
                                "fake",
                            providerMessageId:
                                "fake-message-1",
                        };
                    },
                };

                const delivery=
                    new BillingInvoiceDeliveryService(
                        database,
                        fake,
                    );

                const first=
                    await delivery.deliver(
                        fixture.tenant.id,
                        fixture.invoice.id,
                    );

                const retry=
                    await delivery.deliver(
                        fixture.tenant.id,
                        fixture.invoice.id,
                    );

                expect(
                    calls,
                ).toBe(
                    1,
                );

                expect(
                    first.deliveryStatus,
                ).toBe(
                    "SENT",
                );

                expect(
                    retry.deliveryStatus,
                ).toBe(
                    "SENT",
                );

                expect(
                    retry.deliveryAttempts,
                ).toBe(
                    1,
                );

                expect(
                    retry.deliveryProviderMessageId,
                ).toBe(
                    "fake-message-1",
                );
            },
        );

        it(
            "records failure and retries without creating another invoice",
            async () => {
                const fixture=
                    await createInvoice();

                let calls=0;

                const fake: InvoiceEmailDelivery={
                    async deliver() {
                        calls+=1;

                        if(calls === 1) {
                            throw new Error(
                                "Synthetic delivery failure.",
                            );
                        }

                        return {
                            provider:
                                "fake",
                            providerMessageId:
                                "fake-message-2",
                        };
                    },
                };

                const delivery=
                    new BillingInvoiceDeliveryService(
                        database,
                        fake,
                    );

                await expect(
                    delivery.deliver(
                        fixture.tenant.id,
                        fixture.invoice.id,
                    ),
                ).rejects.toThrow(
                    "Synthetic delivery failure.",
                );

                const failed=
                    await testPrisma.billingInvoice.findUniqueOrThrow({
                        where: {
                            id:
                                fixture.invoice.id,
                        },
                    });

                expect(
                    failed.deliveryStatus,
                ).toBe(
                    "FAILED",
                );

                expect(
                    failed.deliveryAttempts,
                ).toBe(
                    1,
                );

                const sent=
                    await delivery.deliver(
                        fixture.tenant.id,
                        fixture.invoice.id,
                    );

                expect(
                    sent.deliveryStatus,
                ).toBe(
                    "SENT",
                );

                expect(
                    sent.deliveryAttempts,
                ).toBe(
                    2,
                );

                expect(
                    await testPrisma.billingInvoice.count({
                        where: {
                            id:
                                fixture.invoice.id,
                        },
                    }),
                ).toBe(
                    1,
                );
            },
        );

        it(
            "rejects cross-tenant delivery",
            async () => {
                const fixture=
                    await createInvoice();

                const other=
                    await testPrisma.tenant.create({
                        data: {
                            name:
                                `Other ${randomUUID()}`,
                            slug:
                                `other-${randomUUID()}`,
                        },
                    });

                tenants.push(
                    other.id,
                );

                let calls=0;

                const fake: InvoiceEmailDelivery={
                    async deliver() {
                        calls+=1;

                        return {
                            provider:
                                "fake",
                            providerMessageId:
                                "should-not-send",
                        };
                    },
                };

                const delivery=
                    new BillingInvoiceDeliveryService(
                        database,
                        fake,
                    );

                await expect(
                    delivery.deliver(
                        other.id,
                        fixture.invoice.id,
                    ),
                ).rejects.toThrow(
                    "Invoice was not found in the tenant.",
                );

                expect(
                    calls,
                ).toBe(
                    0,
                );
            },
        );
    },
);