import {
    describe,
    expect,
    it,
} from "vitest";

import {
    InvoiceResendTransport,
    ResendInvoiceEmailDelivery,
} from "../../src/infrastructure/email/resend-invoice-email-delivery";

describe(
    "Mission 110.2 Resend invoice adapter",
    () => {
        it(
            "sends the customer PDF with accounts BCC and deterministic idempotency",
            async () => {
                let request:
                    Parameters<InvoiceResendTransport["send"]>[0] |
                    null=null;

                let options:
                    Parameters<InvoiceResendTransport["send"]>[1] |
                    null=null;

                const transport: InvoiceResendTransport={
                    async send(
                        sentRequest,
                        sentOptions,
                    ) {
                        request=
                            sentRequest;

                        options=
                            sentOptions;

                        return {
                            data: {
                                id:
                                    "email-test-1",
                            },
                            error:
                                null,
                        };
                    },
                };

                const delivery=
                    new ResendInvoiceEmailDelivery(
                        transport,
                        "TITAN Billing <billing@example.invalid>",
                    );

                const result=
                    await delivery.deliver({
                        invoiceId:
                            "invoice-123",
                        invoiceNumber:
                            "TITAN-2026-000001",
                        recipientEmail:
                            "customer@example.invalid",
                        recipientName:
                            "TITAN Customer",
                        accountsCopyEmail:
                            "accounts@titan-tech.co.za",
                        productName:
                            "Athlete Membership",
                        amountMinor:
                            24680,
                        currency:
                            "ZAR",
                        issuedAt:
                            new Date(
                                "2026-09-27T12:00:00Z",
                            ),
                        pdfContent:
                            new Uint8Array([
                                37,
                                80,
                                68,
                                70,
                            ]),
                    });

                expect(
                    request?.to,
                ).toEqual([
                    "customer@example.invalid",
                ]);

                expect(
                    request?.bcc,
                ).toEqual([
                    "accounts@titan-tech.co.za",
                ]);

                expect(
                    request?.attachments,
                ).toHaveLength(
                    1,
                );

                expect(
                    request?.attachments[0]?.filename,
                ).toBe(
                    "TITAN-2026-000001.pdf",
                );

                expect(
                    request?.attachments[0]?.content,
                ).toBe(
                    Buffer.from([
                        37,
                        80,
                        68,
                        70,
                    ]).toString(
                        "base64",
                    ),
                );

                expect(
                    options?.idempotencyKey,
                ).toBe(
                    "titan-invoice/invoice-123",
                );

                expect(
                    request?.text.toLowerCase(),
                ).not.toContain(
                    "tax",
                );

                expect(
                    request?.text.toLowerCase(),
                ).not.toContain(
                    "vat",
                );

                expect(
                    result,
                ).toEqual({
                    provider:
                        "resend",
                    providerMessageId:
                        "email-test-1",
                });
            },
        );

        it(
            "fails closed when the provider reports an error",
            async () => {
                const transport: InvoiceResendTransport={
                    async send() {
                        return {
                            data:
                                null,
                            error: {
                                message:
                                    "provider failure",
                            },
                        };
                    },
                };

                const delivery=
                    new ResendInvoiceEmailDelivery(
                        transport,
                        "billing@example.invalid",
                    );

                await expect(
                    delivery.deliver({
                        invoiceId:
                            "invoice-failure",
                        invoiceNumber:
                            "TITAN-2026-000002",
                        recipientEmail:
                            "customer@example.invalid",
                        recipientName:
                            null,
                        accountsCopyEmail:
                            "accounts@titan-tech.co.za",
                        productName:
                            "Membership",
                        amountMinor:
                            10000,
                        currency:
                            "ZAR",
                        issuedAt:
                            new Date(),
                        pdfContent:
                            new Uint8Array([
                                37,
                                80,
                                68,
                                70,
                            ]),
                    }),
                ).rejects.toThrow(
                    "Invoice email delivery failed.",
                );
            },
        );
    },
);