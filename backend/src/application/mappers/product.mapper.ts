import { Product } from "../../domain/entities/product.entity";
import { ProductDto } from "../dto/product/product.dto";

export class ProductApplicationMapper {

    static toDto(
        product: Product,
    ): ProductDto {

        return {

            id: product.id,

            name: product.name,

            slug: product.slug,

            description: product.description,

            priceCents: product.priceCents,

            currency: product.currency,

            billingInterval: product.billingInterval,

            status: product.status,

            createdAt: product.createdAt,

            updatedAt: product.updatedAt,

        };

    }

}
