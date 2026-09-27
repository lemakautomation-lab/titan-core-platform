export interface InvoiceEmailMessage {
    invoiceId: string;
    invoiceNumber: string;
    recipientEmail: string;
    recipientName: string | null;
    accountsCopyEmail: string;
    productName: string;
    amountMinor: number;
    currency: string;
    issuedAt: Date;
    pdfContent: Uint8Array;
}

export interface InvoiceEmailDeliveryResult {
    provider: string;
    providerMessageId: string;
}

export interface InvoiceEmailDelivery {
    deliver(
        message: Readonly<InvoiceEmailMessage>,
    ): Promise<InvoiceEmailDeliveryResult>;
}