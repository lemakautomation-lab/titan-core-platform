import {
    Resend,
} from "resend";

import {
    InvoiceEmailDelivery,
    InvoiceEmailDeliveryResult,
    InvoiceEmailMessage,
} from "../../application/ports/invoice-email-delivery";

interface ResendSendRequest {
    from: string;
    to: string[];
    bcc: string[];
    subject: string;
    text: string;
    html: string;
    attachments: Array<{
        filename: string;
        content: string;
    }>;
}

interface ResendSendOptions {
    idempotencyKey: string;
}

interface ResendSendResult {
    data: {
        id: string;
    } | null;
    error: unknown;
}

export interface InvoiceResendTransport {
    send(
        message: ResendSendRequest,
        options: ResendSendOptions,
    ): Promise<ResendSendResult>;
}

class ResendSdkInvoiceTransport
implements InvoiceResendTransport {
    constructor(
        private readonly client: Resend,
    ) {}

    async send(
        message: ResendSendRequest,
        options: ResendSendOptions,
    ): Promise<ResendSendResult> {
        return this.client.emails.send(
            message,
            options,
        );
    }
}

function escapeHtml(
    value: string,
): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll('"', "&quot;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

function formatAmount(
    amountMinor: number,
    currency: string,
): string {
    return new Intl.NumberFormat(
        "en-ZA",
        {
            style: "currency",
            currency,
        },
    ).format(
        amountMinor / 100,
    );
}

export class ResendInvoiceEmailDelivery
implements InvoiceEmailDelivery {
    constructor(
        private readonly transport: InvoiceResendTransport,
        private readonly fromEmail: string,
    ) {
        if(!fromEmail.trim()) {
            throw new Error(
                "Invoice sender email is required.",
            );
        }
    }

    async deliver(
        message: Readonly<InvoiceEmailMessage>,
    ): Promise<InvoiceEmailDeliveryResult> {
        const amount=
            formatAmount(
                message.amountMinor,
                message.currency,
            );

        const displayName=
            message.recipientName?.trim() ||
            "TITAN customer";

        const subject=
            `TITAN invoice ${message.invoiceNumber}`;

        const text=[
            `Hello ${displayName},`,
            "",
            "Thank you for your payment.",
            "",
            `Invoice: ${message.invoiceNumber}`,
            `Description: ${message.productName}`,
            `Amount paid: ${amount}`,
            "",
            "Your invoice is attached as a PDF.",
            "",
            "TitanTech (Pty) Ltd",
        ].join("\n");

        const html=[
            '<div style="margin:0;padding:32px;background:#080a0c;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">',
            '<div style="max-width:640px;margin:0 auto;border:1px solid #252a2f;background:#111418;">',
            '<div style="padding:28px 32px;border-bottom:4px solid #70ff52;">',
            '<div style="font-size:28px;font-weight:800;letter-spacing:2px;color:#70ff52;">TITAN</div>',
            '<div style="margin-top:6px;font-size:13px;color:#aeb5bc;">TitanTech (Pty) Ltd</div>',
            '</div>',
            '<div style="padding:32px;">',
            `<p style="margin-top:0;">Hello ${escapeHtml(displayName)},</p>`,
            '<p>Thank you for your payment. Your TITAN invoice is attached.</p>',
            '<div style="margin:28px 0;padding:22px;background:#090b0d;border-left:4px solid #70ff52;">',
            `<div style="font-size:12px;color:#aeb5bc;">INVOICE</div>`,
            `<div style="margin-top:4px;font-size:18px;font-weight:700;">${escapeHtml(message.invoiceNumber)}</div>`,
            `<div style="margin-top:18px;font-size:12px;color:#aeb5bc;">DESCRIPTION</div>`,
            `<div style="margin-top:4px;">${escapeHtml(message.productName)}</div>`,
            `<div style="margin-top:18px;font-size:12px;color:#aeb5bc;">AMOUNT PAID</div>`,
            `<div style="margin-top:4px;font-size:22px;font-weight:700;color:#70ff52;">${escapeHtml(amount)}</div>`,
            '</div>',
            '<p style="margin-bottom:0;color:#aeb5bc;font-size:12px;">Generated securely by TITAN Enterprise.</p>',
            '</div>',
            '</div>',
            '</div>',
        ].join("");

        const result=
            await this.transport.send(
                {
                    from:
                        this.fromEmail,
                    to: [
                        message.recipientEmail,
                    ],
                    bcc: [
                        message.accountsCopyEmail,
                    ],
                    subject,
                    text,
                    html,
                    attachments: [
                        {
                            filename:
                                `${message.invoiceNumber}.pdf`,
                            content:
                                Buffer.from(
                                    message.pdfContent,
                                ).toString(
                                    "base64",
                                ),
                        },
                    ],
                },
                {
                    idempotencyKey:
                        `titan-invoice/${message.invoiceId}`,
                },
            );

        if(
            result.error ||
            !result.data?.id
        ) {
            throw new Error(
                "Invoice email delivery failed.",
                {
                    cause:
                        result.error,
                },
            );
        }

        return {
            provider:
                "resend",
            providerMessageId:
                result.data.id,
        };
    }
}

export function createResendInvoiceEmailDelivery(
    apiKey: string,
    fromEmail: string,
): InvoiceEmailDelivery {
    return new ResendInvoiceEmailDelivery(
        new ResendSdkInvoiceTransport(
            new Resend(
                apiKey,
            ),
        ),
        fromEmail,
    );
}