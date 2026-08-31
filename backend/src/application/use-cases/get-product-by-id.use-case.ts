import { ProductRepository } from "../../domain/repositories/product.repository";

import { GetProductByIdQuery } from "../queries/product/get-product-by-id.query";
import { ProductDto } from "../dto/product/product.dto";
import { Result } from "../common/result";
import { UseCase } from "../common/use-case.interface";
import { ProductApplicationMapper } from "../mappers/product.mapper";

export class GetProductByIdUseCase
implements UseCase<GetProductByIdQuery, Result<ProductDto>>
{

    constructor(
        private readonly productRepository: ProductRepository,
    ) {}

    async execute(
        query: GetProductByIdQuery,
    ): Promise<Result<ProductDto>> {

        const product =
            await this.productRepository.findById(
                query.id,
                query.tenantId,
            );

        if (!product) {
            return Result.failure(
                "Product not found.",
            );
        }

        return Result.success(
            ProductApplicationMapper.toDto(product),
        );
    }
}