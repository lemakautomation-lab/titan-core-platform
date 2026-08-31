import { randomUUID } from "crypto";

import { BillingInterval } from "../enums/billing-interval.enum";
import { ProductStatus } from "../enums/product-status.enum";

export class ProductPrice {

    constructor(

        public readonly id: string,

        public readonly productId: string,

        public amountMinor: number,

        public currency: string,

        public billingInterval: BillingInterval,

        public status: ProductStatus,

        public readonly createdAt: Date,

        public updatedAt: Date,

    ) {}

    static create(
        productId: string,
        amountMinor: number,
        currency: string,
        billingInterval: BillingInterval,
    ): ProductPrice {

        ProductPrice.validateAmount(amountMinor);
        ProductPrice.validateCurrency(currency);

        const now = new Date();

        return new ProductPrice(
            randomUUID(),
            productId,
            amountMinor,
            currency.toUpperCase(),
            billingInterval,
            ProductStatus.ACTIVE,
            now,
            now,
        );
    }

    updateDetails(
        amountMinor: number,
        currency: string,
        billingInterval: BillingInterval,
    ): void {

        ProductPrice.validateAmount(amountMinor);
        ProductPrice.validateCurrency(currency);

        this.amountMinor = amountMinor;
        this.currency = currency.toUpperCase();
        this.billingInterval = billingInterval;
        this.updatedAt = new Date();
    }

    activate(): void {

        this.status = ProductStatus.ACTIVE;
        this.updatedAt = new Date();
    }

    deactivate(): void {

        this.status = ProductStatus.INACTIVE;
        this.updatedAt = new Date();
    }

    isActive(): boolean {

        return this.status === ProductStatus.ACTIVE;
    }

    private static validateAmount(
        amountMinor: number,
    ): void {

        if (
            !Number.isInteger(amountMinor) ||
            amountMinor <= 0
        ) {
            throw new Error(
                "Product price must be a positive integer in minor currency units.",
            );
        }
    }

    private static validateCurrency(
        currency: string,
    ): void {

        if (!/^[A-Z]{3}$/i.test(currency)) {
            throw new Error(
                "Currency must be a valid three-letter ISO currency code.",
            );
        }
    }
}
