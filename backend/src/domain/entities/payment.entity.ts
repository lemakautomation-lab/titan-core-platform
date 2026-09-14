import { randomUUID } from "crypto";

import { BillingInterval } from "../enums/billing-interval.enum";
import { PaymentStatus } from "../enums/payment-status.enum";

export class Payment {

    constructor(
        public readonly id: string,
        public readonly tenantId: string,
        public readonly userId: string,
        public readonly productId: string,
        public readonly productPriceId: string,
        public readonly amountMinor: number,
        public readonly currency: string,
        public readonly billingInterval: BillingInterval,
        public status: PaymentStatus,
        public providerReference: string | null,
        public confirmedAt: Date | null,
        public readonly createdAt: Date,
        public updatedAt: Date,
    ) {}

    static create(
        tenantId: string,
        userId: string,
        productId: string,
        productPriceId: string,
        amountMinor: number,
        currency: string,
        billingInterval: BillingInterval,
    ): Payment {

        Payment.requireIdentifier(tenantId, "tenant");
        Payment.requireIdentifier(userId, "user");
        Payment.requireIdentifier(productId, "product");
        Payment.requireIdentifier(
            productPriceId,
            "product price",
        );
        Payment.validateAmount(amountMinor);
        Payment.validateCurrency(currency);

        const now=new Date();

        return new Payment(
            randomUUID(),
            tenantId,
            userId,
            productId,
            productPriceId,
            amountMinor,
            currency.toUpperCase(),
            billingInterval,
            PaymentStatus.PENDING,
            null,
            null,
            now,
            now,
        );

    }

    confirm(
        providerReference: string,
    ): void {

        if(this.status !== PaymentStatus.PENDING) {
            throw new Error(
                "Only a pending payment can be confirmed.",
            );
        }

        const normalized=providerReference.trim();

        if(!normalized || normalized.length > 255) {
            throw new Error(
                "A valid provider reference is required.",
            );
        }

        const now=new Date();

        this.status=PaymentStatus.CONFIRMED;
        this.providerReference=normalized;
        this.confirmedAt=now;
        this.updatedAt=now;

    }

    fail(): void {

        if(this.status !== PaymentStatus.PENDING) {
            throw new Error(
                "Only a pending payment can fail.",
            );
        }

        this.status=PaymentStatus.FAILED;
        this.updatedAt=new Date();

    }

    cancel(): void {

        if(this.status !== PaymentStatus.PENDING) {
            throw new Error(
                "Only a pending payment can be cancelled.",
            );
        }

        this.status=PaymentStatus.CANCELLED;
        this.updatedAt=new Date();

    }

    refund(): void {

        if(this.status !== PaymentStatus.CONFIRMED) {
            throw new Error(
                "Only a confirmed payment can be refunded.",
            );
        }

        this.status=PaymentStatus.REFUNDED;
        this.updatedAt=new Date();

    }

    private static requireIdentifier(
        value: string,
        field: string,
    ): void {

        if(typeof value !== "string" || !value.trim()) {
            throw new Error(
                `Payment ${field} identifier is required.`,
            );
        }

    }

    private static validateAmount(
        amountMinor: number,
    ): void {

        if(
            !Number.isInteger(amountMinor) ||
            amountMinor <= 0
        ) {
            throw new Error(
                "Payment amount must be a positive integer.",
            );
        }

    }

    private static validateCurrency(
        currency: string,
    ): void {

        if(!/^[A-Z]{3}$/i.test(currency)) {
            throw new Error(
                "Payment currency must be a three-letter ISO code.",
            );
        }

    }

}