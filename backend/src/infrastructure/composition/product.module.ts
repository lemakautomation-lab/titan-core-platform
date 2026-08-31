import { DatabaseService } from "../database/database.service";
import { PrismaProductRepository } from "../repositories/product.repository";

import { CreateProductUseCase } from "../../application/use-cases/create-product.use-case";
import { GetProductByIdUseCase } from "../../application/use-cases/get-product-by-id.use-case";
import { ListProductsUseCase } from "../../application/use-cases/list-products.use-case";
import { UpdateProductUseCase } from "../../application/use-cases/update-product.use-case";
import { DeleteProductUseCase } from "../../application/use-cases/delete-product.use-case";

const databaseService = new DatabaseService();

const productRepository =
    new PrismaProductRepository(databaseService);

export const productModule = {

    createProductUseCase:
        new CreateProductUseCase(
            productRepository,
        ),

    getProductByIdUseCase:
        new GetProductByIdUseCase(
            productRepository,
        ),

    listProductsUseCase:
        new ListProductsUseCase(
            productRepository,
        ),

    updateProductUseCase:
        new UpdateProductUseCase(
            productRepository,
        ),

    deleteProductUseCase:
        new DeleteProductUseCase(
            productRepository,
        ),
};
