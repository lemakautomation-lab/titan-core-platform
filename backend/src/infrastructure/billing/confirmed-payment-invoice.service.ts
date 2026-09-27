import {
    createHash,
} from "node:crypto";

import {
    DatabaseService,
} from "../database/database.service";
import {
    buildTitanInvoicePdf,
} from "./titan-invoice-pdf";

export interface BillingInvoiceIssuerConfig {
    issuerName: string;
    issuerRegistrationNumber?: string | null;
    issuerAddressText?: string | null;
    accountsCopyEmail: string;
}

export interface IssuedBillingInvoice {
    id: string;
    invoiceNumber: string;
    paymentId: string;
    amountMinor: number;
    currency: string;
    issuedAt: Date;
    deliveryStatus: string;
    pdfSha256: string;
}

const invoiceResultSelect={
    id: true,
    invoiceNumber: true,
    paymentId: true,
    amountMinor: true,
    currency: true,
    issuedAt: true,
    deliveryStatus: true,
    pdfSha256: true,
} as const;

function validateConfig(
    config: Readonly<BillingInvoiceIssuerConfig>,
): void {
    if(!config.issuerName.trim()) {
        throw new Error(
            "Invoice issuer name is required.",
        );
    }

    if(!config.accountsCopyEmail.trim()) {
        throw new Error(
            "Invoice accounts-copy email is required.",
        );
    }
}

function buildInvoiceNumber(
    issueYear: number,
    sequence: number,
): string {
    return [
        "TITAN",
        issueYear.toString(),
        sequence
            .toString()
            .padStart(
                6,
                "0",
            ),
    ].join("-");
}

export class ConfirmedPaymentInvoiceService {
    constructor(
        private readonly database: DatabaseService,
        private readonly config: Readonly<BillingInvoiceIssuerConfig>,
    ) {
        validateConfig(
            config,
        );
    }

    async issueForConfirmedPayment(
        tenantId: string,
        paymentId: string,
    ): Promise<IssuedBillingInvoice> {
        const existing=
            await this.database.prisma.billingInvoice.findFirst({
                where: {
                    tenantId,
                    paymentId,
                },
                select:
                    invoiceResultSelect,
            });

        if(existing) {
            return existing;
        }

        try {
            return await this.database.prisma.$transaction(
                async transaction => {
                    const alreadyIssued=
                        await transaction.billingInvoice.findFirst({
                            where: {
                                tenantId,
                                paymentId,
                            },
                            select:
                                invoiceResultSelect,
                        });

                    if(alreadyIssued) {
                        return alreadyIssued;
                    }

                    const payment=
                        await transaction.payment.findFirst({
                            where: {
                                id:
                                    paymentId,
                                tenantId,
                                status:
                                    "CONFIRMED",
                                confirmedAt: {
                                    not:
                                        null,
                                },
                            },
                            include: {
                                user:
                                    true,
                                product:
                                    true,
                            },
                        });

                    if(
                        !payment ||
                        !payment.confirmedAt
                    ) {
                        throw new Error(
                            "Invoice issuance requires a confirmed payment.",
                        );
                    }

                    const issuedAt=
                        new Date();

                    const issueYear=
                        issuedAt.getUTCFullYear();

                    const counter=
                        await transaction.billingInvoiceCounter.upsert({
                            where: {
                                tenantId_issueYear: {
                                    tenantId,
                                    issueYear,
                                },
                            },
                            create: {
                                tenantId,
                                issueYear,
                                nextSequence:
                                    2,
                            },
                            update: {
                                nextSequence: {
                                    increment:
                                        1,
                                },
                            },
                            select: {
                                nextSequence:
                                    true,
                            },
                        });

                    const sequence=
                        counter.nextSequence - 1;

                    const invoiceNumber=
                        buildInvoiceNumber(
                            issueYear,
                            sequence,
                        );

                    const recipientName=
                        [
                            payment.user.firstName,
                            payment.user.lastName,
                        ]
                            .filter(
                                value =>
                                    Boolean(
                                        value?.trim(),
                                    ),
                            )
                            .join(" ")
                            .trim() || null;

                    const issuerName=
                        this.config.issuerName.trim();

                    const issuerRegistrationNumber=
                        this.config.issuerRegistrationNumber
                            ?.trim() || null;

                    const issuerAddressText=
                        this.config.issuerAddressText
                            ?.trim() || null;

                    const accountsCopyEmail=
                        this.config.accountsCopyEmail.trim();

                    const pdfBytes=
                        await buildTitanInvoicePdf({
                            invoiceNumber,
                            issuedAt,
                            recipientEmail:
                                payment.user.email,
                            recipientName,
                            issuerName,
                            issuerRegistrationNumber,
                            issuerAddressText,
                            productName:
                                payment.product.name,
                            amountMinor:
                                payment.amountMinor,
                            currency:
                                payment.currency,
                            paymentProviderReference:
                                payment.providerReference,
                            confirmedAt:
                                payment.confirmedAt,
                        });

                    const pdfSha256=
                        createHash(
                            "sha256",
                        )
                            .update(
                                pdfBytes,
                            )
                            .digest(
                                "hex",
                            );

                    return transaction.billingInvoice.create({
                        data: {
                            tenantId,
                            userId:
                                payment.userId,
                            paymentId:
                                payment.id,
                            productId:
                                payment.productId,
                            productPriceId:
                                payment.productPriceId,

                            invoiceNumber,
                            issueYear,
                            sequence,

                            recipientEmail:
                                payment.user.email,
                            recipientName,
                            accountsCopyEmail,

                            issuerName,
                            issuerRegistrationNumber,
                            issuerAddressText,

                            productName:
                                payment.product.name,
                            amountMinor:
                                payment.amountMinor,
                            currency:
                                payment.currency,
                            billingInterval:
                                payment.billingInterval,
                            paymentProviderReference:
                                payment.providerReference,
                            confirmedAt:
                                payment.confirmedAt,
                            issuedAt,

                            pdfContent:
                                Buffer.from(
                                    pdfBytes,
                                ),
                            pdfSha256,

                            deliveryStatus:
                                "PENDING",
                        },
                        select:
                            invoiceResultSelect,
                    });
                },
            );
        } catch(error) {
            /*
             * A concurrent retry may lose the unique-payment race.
             * Its transaction, including the counter increment, is rolled
             * back. Reload the winning invoice before propagating an error.
             */
            const concurrentInvoice=
                await this.database.prisma.billingInvoice.findFirst({
                    where: {
                        tenantId,
                        paymentId,
                    },
                    select:
                        invoiceResultSelect,
                });

            if(concurrentInvoice) {
                return concurrentInvoice;
            }

            throw error;
        }
    }
}