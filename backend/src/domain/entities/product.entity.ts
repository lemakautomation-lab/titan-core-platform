import { BillingInterval } from "../enums/billing-interval.enum";
import { ProductStatus } from "../enums/product-status.enum";

export class Product {

    constructor(
        public readonly id: string,
        public readonly tenantId: string,
        public readonly name: string,
        public readonly slug: string,
        public readonly description: string | null,
        public readonly priceCents: number,
        public readonly currency: string,
        public readonly billingInterval: BillingInterval,
        public readonly status: ProductStatus,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) {}

}