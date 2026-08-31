import { ProductPrice as PrismaProductPrice } from "../../generated/prisma/client";

import { ProductPrice } from "../../domain/entities/product-price.entity";
import { BillingInterval } from "../../domain/enums/billing-interval.enum";
import { ProductStatus } from "../../domain/enums/product-status.enum";

export class ProductPriceMapper {

    static toDomain(
        prisma: PrismaProductPrice,
    ): ProductPrice {

        return new ProductPrice(
            prisma.id,
            prisma.productId,
            prisma.amountMinor,
            prisma.currency,
            prisma.billingInterval as BillingInterval,
            prisma.status as ProductStatus,
            prisma.createdAt,
            prisma.updatedAt,
        );
    }

    static toPersistence(
        price: ProductPrice,
    ) {

        return {
            id: price.id,
            productId: price.productId,
            amountMinor: price.amountMinor,
            currency: price.currency,
            billingInterval: price.billingInterval,
            status: price.status,
        };
    }
}
