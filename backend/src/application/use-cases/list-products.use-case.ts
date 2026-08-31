import { ProductRepository } from "../../domain/repositories/product.repository";

import { ListProductsQuery } from "../queries/product/list-products.query";
import { ProductDto } from "../dto/product/product.dto";
import { Result } from "../common/result";
import { UseCase } from "../common/use-case.interface";
import { ProductApplicationMapper } from "../mappers/product.mapper";

export class ListProductsUseCase
implements UseCase<ListProductsQuery, Result<ProductDto[]>>
{

    constructor(
        private readonly productRepository: ProductRepository,
    ) {}

    async execute(
        query: ListProductsQuery,
    ): Promise<Result<ProductDto[]>> {

        const products =
            await this.productRepository.findAll(
                query.tenantId,
            );

        return Result.success(
            products.map(
                ProductApplicationMapper.toDto,
            ),
        );
    }
}