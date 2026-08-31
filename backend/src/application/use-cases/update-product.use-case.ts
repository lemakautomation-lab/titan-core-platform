import { Product } from "../../domain/entities/product.entity";
import { ProductRepository } from "../../domain/repositories/product.repository";

import { UpdateProductCommand } from "../commands/update-product.command";
import { ProductDto } from "../dto/product/product.dto";
import { Result } from "../common/result";
import { UseCase } from "../common/use-case.interface";
import { ProductApplicationMapper } from "../mappers/product.mapper";

import { BillingInterval } from "../../domain/enums/billing-interval.enum";

export class UpdateProductUseCase
implements UseCase<UpdateProductCommand, Result<ProductDto>>
{

    constructor(
        private readonly productRepository: ProductRepository,
    ) {}

    async execute(
        command: UpdateProductCommand,
    ): Promise<Result<ProductDto>> {

        const product =
            await this.productRepository.findById(
                command.id,
                command.tenantId,
            );

        if (!product) {
            return Result.failure(
                "Product not found.",
            );
        }

        const duplicate =
            await this.productRepository.findBySlug(
                command.slug,
                command.tenantId,
            );

        if (
            duplicate &&
            duplicate.id !== product.id
        ) {
            return Result.failure(
                "Product already exists.",
            );
        }

        const updated =
            new Product(
                product.id,
                product.tenantId,
                command.name,
                command.slug,
                command.description,
                command.priceCents,
                command.currency.toUpperCase(),
                command.billingInterval as BillingInterval,
                product.status,
                product.createdAt,
                new Date(),
            );

        await this.productRepository.update(updated);

        return Result.success(
            ProductApplicationMapper.toDto(updated),
        );
    }
}