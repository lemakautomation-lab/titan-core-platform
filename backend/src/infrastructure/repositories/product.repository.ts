import { Product } from "../../domain/entities/product.entity";
import { ProductRepository } from "../../domain/repositories/product.repository";

import { DatabaseService } from "../database/database.service";
import { ProductMapper } from "../mappers/product.mapper";

export class PrismaProductRepository
implements ProductRepository {

    constructor(
        private readonly database: DatabaseService,
    ) {}

    async findById(
        id: string,
        tenantId: string,
    ): Promise<Product | null> {

        const product =
            await this.database.prisma.product.findFirst({
                where: {
                    id,
                    tenantId,
                    status: "ACTIVE",
                },
            });

        return product
            ? ProductMapper.toDomain(product)
            : null;
    }

    async findBySlug(
        slug: string,
        tenantId: string,
    ): Promise<Product | null> {

        const product =
            await this.database.prisma.product.findFirst({
                where: {
                    slug,
                    tenantId,
                    status: "ACTIVE",
                },
            });

        return product
            ? ProductMapper.toDomain(product)
            : null;
    }

    async findAll(
        tenantId: string,
    ): Promise<Product[]> {

        const products =
            await this.database.prisma.product.findMany({
                where: {
                    tenantId,
                    status: "ACTIVE",
                },
                orderBy: [
                    { name: "asc" },
                    { id: "asc" },
                ],
            });

        return products.map(
            ProductMapper.toDomain,
        );
    }

    async create(
        product: Product,
    ): Promise<Product> {

        const created =
            await this.database.prisma.product.create({
                data:
                    ProductMapper.toPersistence(
                        product,
                    ),
            });

        return ProductMapper.toDomain(created);
    }

    async update(
        product: Product,
    ): Promise<Product> {

        const updated =
            await this.database.prisma.product.updateMany({
                where: {
                    id: product.id,
                    tenantId: product.tenantId,
                    status: "ACTIVE",
                },
                data:
                    ProductMapper.toPersistence(
                        product,
                    ),
            });

        if (updated.count !== 1) {
            throw new Error(
                "Product update failed.",
            );
        }

        const result =
            await this.database.prisma.product.findFirst({
                where: {
                    id: product.id,
                    tenantId: product.tenantId,
                    status: "ACTIVE",
                },
            });

        if (!result) {
            throw new Error(
                "Product not found after update.",
            );
        }

        return ProductMapper.toDomain(result);
    }

    async delete(
        id: string,
        tenantId: string,
    ): Promise<void> {

        await this.database.prisma.product.updateMany({
            where: {
                id,
                tenantId,
                status: "ACTIVE",
            },
            data: {
                status: "INACTIVE",
            },
        });
    }
}