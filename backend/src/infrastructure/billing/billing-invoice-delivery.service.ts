import {
    InvoiceEmailDelivery,
} from "../../application/ports/invoice-email-delivery";
import {
    DatabaseService,
} from "../database/database.service";

const CLAIM_TIMEOUT_MS=
    15 * 60 * 1000;

export class BillingInvoiceDeliveryService {
    constructor(
        private readonly database: DatabaseService,
        private readonly delivery: InvoiceEmailDelivery,
    ) {}

    async deliver(
        tenantId: string,
        invoiceId: string,
    ) {
        const existing=
            await this.database.prisma.billingInvoice.findFirst({
                where: {
                    id:
                        invoiceId,
                    tenantId,
                },
            });

        if(!existing) {
            throw new Error(
                "Invoice was not found in the tenant.",
            );
        }

        if(existing.deliveryStatus === "SENT") {
            return existing;
        }

        const now=
            new Date();

        const staleBefore=
            new Date(
                now.getTime() -
                CLAIM_TIMEOUT_MS,
            );

        const claim=
            await this.database.prisma.billingInvoice.updateMany({
                where: {
                    id:
                        invoiceId,
                    tenantId,
                    OR: [
                        {
                            deliveryStatus: {
                                in: [
                                    "PENDING",
                                    "FAILED",
                                ],
                            },
                        },
                        {
                            deliveryStatus:
                                "SENDING",
                            OR: [
                                {
                                    deliveryLastAttemptAt:
                                        null,
                                },
                                {
                                    deliveryLastAttemptAt: {
                                        lte:
                                            staleBefore,
                                    },
                                },
                            ],
                        },
                    ],
                },
                data: {
                    deliveryStatus:
                        "SENDING",
                    deliveryAttempts: {
                        increment:
                            1,
                    },
                    deliveryLastAttemptAt:
                        now,
                    deliveryLastError:
                        null,
                },
            });

        if(claim.count !== 1) {
            const latest=
                await this.database.prisma.billingInvoice.findFirst({
                    where: {
                        id:
                            invoiceId,
                        tenantId,
                    },
                });

            if(
                latest?.deliveryStatus ===
                "SENT"
            ) {
                return latest;
            }

            throw new Error(
                "Invoice delivery is already in progress.",
            );
        }

        const invoice=
            await this.database.prisma.billingInvoice.findFirstOrThrow({
                where: {
                    id:
                        invoiceId,
                    tenantId,
                },
            });

        try {
            const result=
                await this.delivery.deliver({
                    invoiceId:
                        invoice.id,
                    invoiceNumber:
                        invoice.invoiceNumber,
                    recipientEmail:
                        invoice.recipientEmail,
                    recipientName:
                        invoice.recipientName,
                    accountsCopyEmail:
                        invoice.accountsCopyEmail,
                    productName:
                        invoice.productName,
                    amountMinor:
                        invoice.amountMinor,
                    currency:
                        invoice.currency,
                    issuedAt:
                        invoice.issuedAt,
                    pdfContent:
                        new Uint8Array(
                            invoice.pdfContent,
                        ),
                });

            const sentAt=
                new Date();

            const updated=
                await this.database.prisma.billingInvoice.updateMany({
                    where: {
                        id:
                            invoice.id,
                        tenantId,
                        deliveryStatus:
                            "SENDING",
                    },
                    data: {
                        deliveryStatus:
                            "SENT",
                        deliveryProvider:
                            result.provider,
                        deliveryProviderMessageId:
                            result.providerMessageId,
                        deliverySentAt:
                            sentAt,
                        deliveryLastError:
                            null,
                    },
                });

            if(updated.count !== 1) {
                throw new Error(
                    "Invoice delivery state could not be finalized.",
                );
            }

            return this.database.prisma.billingInvoice.findFirstOrThrow({
                where: {
                    id:
                        invoice.id,
                    tenantId,
                },
            });
        } catch(error) {
            const message=
                error instanceof Error
                    ? error.message
                    : "Invoice email delivery failed.";

            await this.database.prisma.billingInvoice.updateMany({
                where: {
                    id:
                        invoice.id,
                    tenantId,
                    deliveryStatus:
                        "SENDING",
                },
                data: {
                    deliveryStatus:
                        "FAILED",
                    deliveryLastError:
                        message.slice(
                            0,
                            1000,
                        ),
                },
            });

            throw error;
        }
    }
}