import { Product as PrismaProduct } from "../../generated/prisma/client";

import { Product } from "../../domain/entities/product.entity";
import { BillingInterval } from "../../domain/enums/billing-interval.enum";
import { ProductStatus } from "../../domain/enums/product-status.enum";

export class ProductMapper {

    static toDomain(
        prisma: PrismaProduct,
    ): Product {

        return new Product(
            prisma.id,
            prisma.tenantId,
            prisma.name,
            prisma.slug,
            prisma.description,
            prisma.priceCents,
            prisma.currency,
            prisma.billingInterval as BillingInterval,
            prisma.status as ProductStatus,
            prisma.createdAt,
            prisma.updatedAt,
        );
    }

    static toPersistence(
        product: Product,
    ) {

        return {
            id: product.id,
            tenantId: product.tenantId,
            name: product.name,
            slug: product.slug,
            description: product.description,
            priceCents: product.priceCents,
            currency: product.currency,
            billingInterval: product.billingInterval,
            status: product.status,
        };
    }
}