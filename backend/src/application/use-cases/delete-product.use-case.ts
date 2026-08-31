import { ProductRepository } from "../../domain/repositories/product.repository";

import { DeleteProductCommand } from "../commands/delete-product.command";
import { Result } from "../common/result";
import { UseCase } from "../common/use-case.interface";

export class DeleteProductUseCase
implements UseCase<DeleteProductCommand, Result<void>>
{

    constructor(
        private readonly productRepository: ProductRepository,
    ) {}

    async execute(
        command: DeleteProductCommand,
    ): Promise<Result<void>> {

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

        await this.productRepository.delete(
            command.id,
            command.tenantId,
        );

        return Result.success(undefined);
    }
}