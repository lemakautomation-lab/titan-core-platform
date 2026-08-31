import { ProductRepository } from "../../domain/repositories/product.repository";

import { CreateProductCommand } from "../commands/create-product.command";
import { ProductDto } from "../dto/product/product.dto";
import { Result } from "../common/result";
import { UseCase } from "../common/use-case.interface";
import { ProductApplicationMapper } from "../mappers/product.mapper";

import { Product } from "../../domain/entities/product.entity";
import { BillingInterval } from "../../domain/enums/billing-interval.enum";
import { ProductStatus } from "../../domain/enums/product-status.enum";

export class CreateProductUseCase
implements UseCase<CreateProductCommand, Result<ProductDto>>
{

    constructor(
        private readonly productRepository: ProductRepository,
    ) {}

    async execute(
        command: CreateProductCommand,
    ): Promise<Result<ProductDto>> {

        const existing =
            await this.productRepository.findBySlug(
                command.slug,
                command.tenantId,
            );

        if (existing) {
            return Result.failure(
                "Product already exists.",
            );
        }

        const now = new Date();

        const product =
            new Product(
                crypto.randomUUID(),
                command.tenantId,
                command.name,
                command.slug,
                command.description,
                command.priceCents,
                command.currency.toUpperCase(),
                command.billingInterval as BillingInterval,
                ProductStatus.ACTIVE,
                now,
                now,
            );

        await this.productRepository.create(product);

        return Result.success(
            ProductApplicationMapper.toDto(product),
        );
    }
}