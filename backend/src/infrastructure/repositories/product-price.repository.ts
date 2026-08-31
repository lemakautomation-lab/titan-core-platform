import { ProductPrice } from "../../domain/entities/product-price.entity";
import { ProductPriceRepository } from "../../domain/repositories/product-price.repository";

import { DatabaseService } from "../database/database.service";
import { ProductPriceMapper } from "../mappers/product-price.mapper";

export class PrismaProductPriceRepository
implements ProductPriceRepository {

    constructor(
        private readonly database: DatabaseService,
    ) {}

    async findById(
        id: string,
    ): Promise<ProductPrice | null> {

        const price =
            await this.database.prisma.productPrice.findUnique({
                where: {
                    id,
                },
            });

        return price
            ? ProductPriceMapper.toDomain(price)
            : null;
    }

    async findActiveByProductId(
        productId: string,
    ): Promise<ProductPrice[]> {

        const prices =
            await this.database.prisma.productPrice.findMany({
                where: {
                    productId,
                    status: "ACTIVE",
                },
                orderBy: [
                    { billingInterval: "asc" },
                    { amountMinor: "asc" },
                    { id: "asc" },
                ],
            });

        return prices.map(
            ProductPriceMapper.toDomain,
        );
    }

    async create(
        price: ProductPrice,
    ): Promise<ProductPrice> {

        const created =
            await this.database.prisma.productPrice.create({
                data:
                    ProductPriceMapper.toPersistence(
                        price,
                    ),
            });

        return ProductPriceMapper.toDomain(created);
    }

    async update(
        price: ProductPrice,
    ): Promise<ProductPrice> {

        const updated =
            await this.database.prisma.productPrice.updateMany({
                where: {
                    id: price.id,
                },
                data:
                    ProductPriceMapper.toPersistence(
                        price,
                    ),
            });

        if (updated.count !== 1) {
            throw new Error(
                "Product price update failed.",
            );
        }

        const result =
            await this.database.prisma.productPrice.findUnique({
                where: {
                    id: price.id,
                },
            });

        if (!result) {
            throw new Error(
                "Product price not found after update.",
            );
        }

        return ProductPriceMapper.toDomain(result);
    }
}
