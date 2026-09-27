import { createHash, randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";

import { ConfirmedPaymentInvoiceService } from "../../src/infrastructure/billing/confirmed-payment-invoice.service";
import { DatabaseService } from "../../src/infrastructure/database/database.service";
import { testPrisma } from "../helpers/prisma-test.client";

const database = new DatabaseService();

const service = new ConfirmedPaymentInvoiceService(
    database,
    {
        issuerName: "TitanTech (Pty) Ltd",
        issuerRegistrationNumber: "TEST-REGISTRATION",
        issuerAddressText: "TEST ADDRESS\nSouth Africa",
        accountsCopyEmail: "accounts@titan-tech.co.za",
    },
);

const tenantIds: string[] = [];
const userIds: string[] = [];
const productIds: string[] = [];
const priceIds: string[] = [];

async function fixture(label: string) {
    const key = randomUUID();

    const tenant = await testPrisma.tenant.create({
        data: {
            name: `Invoice ${label}`,
            slug: `invoice-${key}`,
        },
    });

    tenantIds.push(tenant.id);

    const user = await testPrisma.user.create({
        data: {
            tenantId: tenant.id,
            email: `invoice-${key}@titan.test`,
            firstName: "TITAN",
            lastName: label,
            passwordHash: "test-hash",
        },
    });

    userIds.push(user.id);

    const product = await testPrisma.product.create({
        data: {
            tenantId: tenant.id,
            name: `${label} Membership`,
            slug: `product-${key}`,
            priceCents: 24680,
            currency: "ZAR",
            billingInterval: "MONTHLY",
        },
    });

    productIds.push(product.id);

    const price = await testPrisma.productPrice.create({
        data: {
            productId: product.id,
            amountMinor: 24680,
            currency: "ZAR",
            billingInterval: "MONTHLY",
        },
    });

    priceIds.push(price.id);

    return { tenant, user, product, price };
}

async function payment(
    f: Awaited<ReturnType<typeof fixture>>,
    status: "PENDING" | "CONFIRMED" | "FAILED",
) {
    const confirmed = status === "CONFIRMED";

    return testPrisma.payment.create({
        data: {
            tenantId: f.tenant.id,
            userId: f.user.id,
            productId: f.product.id,
            productPriceId: f.price.id,
            amountMinor: 24680,
            currency: "ZAR",
            billingInterval: "MONTHLY",
            status,
            providerReference: confirmed ? `provider-${randomUUID()}` : null,
            confirmedAt: confirmed ? new Date() : null,
        },
    });
}

afterAll(async () => {
    await testPrisma.billingInvoice.deleteMany({
        where: { tenantId: { in: tenantIds } },
    });

    await testPrisma.billingInvoiceCounter.deleteMany({
        where: { tenantId: { in: tenantIds } },
    });

    await testPrisma.payment.deleteMany({
        where: { tenantId: { in: tenantIds } },
    });

    await testPrisma.productPrice.deleteMany({
        where: { id: { in: priceIds } },
    });

    await testPrisma.product.deleteMany({
        where: { id: { in: productIds } },
    });

    await testPrisma.user.deleteMany({
        where: { id: { in: userIds } },
    });

    await testPrisma.tenant.deleteMany({
        where: { id: { in: tenantIds } },
    });
});

describe("Mission 110.2 confirmed-payment invoices", () => {
    it("creates the invoice and immutable PDF snapshot", async () => {
        const f = await fixture("Snapshot");
        const p = await payment(f, "CONFIRMED");

        const result = await service.issueForConfirmedPayment(
            f.tenant.id,
            p.id,
        );

        const invoice = await testPrisma.billingInvoice.findUniqueOrThrow({
            where: { id: result.id },
        });

        expect(invoice.paymentId).toBe(p.id);
        expect(invoice.amountMinor).toBe(24680);
        expect(invoice.currency).toBe("ZAR");
        expect(invoice.recipientEmail).toBe(f.user.email);
        expect(invoice.accountsCopyEmail).toBe("accounts@titan-tech.co.za");
        expect(invoice.issuerName).toBe("TitanTech (Pty) Ltd");
        expect(invoice.deliveryStatus).toBe("PENDING");
        expect(invoice.deliveryAttempts).toBe(0);
        expect(invoice.invoiceNumber).toMatch(/^TITAN-\d{4}-000001$/);

        const pdf = Buffer.from(invoice.pdfContent);

        expect(pdf.subarray(0, 4).toString()).toBe("%PDF");

        expect(
            createHash("sha256")
                .update(pdf)
                .digest("hex"),
        ).toBe(invoice.pdfSha256);
    });

    it("is idempotent and allocates sequential invoice numbers", async () => {
        const f = await fixture("Sequence");

        const p1 = await payment(f, "CONFIRMED");

        const first = await service.issueForConfirmedPayment(
            f.tenant.id,
            p1.id,
        );

        const retry = await service.issueForConfirmedPayment(
            f.tenant.id,
            p1.id,
        );

        expect(retry.id).toBe(first.id);

        const p2 = await payment(f, "CONFIRMED");

        const second = await service.issueForConfirmedPayment(
            f.tenant.id,
            p2.id,
        );

        const firstStored =
            await testPrisma.billingInvoice.findUniqueOrThrow({
                where: { id: first.id },
            });

        const secondStored =
            await testPrisma.billingInvoice.findUniqueOrThrow({
                where: { id: second.id },
            });

        expect(firstStored.sequence).toBe(1);
        expect(secondStored.sequence).toBe(2);
        expect(second.invoiceNumber).toMatch(/^TITAN-\d{4}-000002$/);

        expect(
            await testPrisma.billingInvoice.count({
                where: { tenantId: f.tenant.id },
            }),
        ).toBe(2);
    });

    it.each([
        "PENDING",
        "FAILED",
    ] as const)(
        "rejects %s payments",
        async status => {
            const f = await fixture(status);
            const p = await payment(f, status);

            await expect(
                service.issueForConfirmedPayment(
                    f.tenant.id,
                    p.id,
                ),
            ).rejects.toThrow(
                "Invoice issuance requires a confirmed payment.",
            );

            expect(
                await testPrisma.billingInvoice.count({
                    where: { tenantId: f.tenant.id },
                }),
            ).toBe(0);

            expect(
                await testPrisma.billingInvoiceCounter.count({
                    where: { tenantId: f.tenant.id },
                }),
            ).toBe(0);
        },
    );

    it("enforces tenant isolation", async () => {
        const owner = await fixture("Owner");
        const attacker = await fixture("Other");

        const p = await payment(owner, "CONFIRMED");

        await expect(
            service.issueForConfirmedPayment(
                attacker.tenant.id,
                p.id,
            ),
        ).rejects.toThrow(
            "Invoice issuance requires a confirmed payment.",
        );

        expect(
            await testPrisma.billingInvoice.count({
                where: { paymentId: p.id },
            }),
        ).toBe(0);
    });
});