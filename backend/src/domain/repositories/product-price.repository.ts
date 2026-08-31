import { ProductPrice } from "../entities/product-price.entity";

export interface ProductPriceRepository {

    findById(
        id: string,
    ): Promise<ProductPrice | null>;

    findActiveByProductId(
        productId: string,
    ): Promise<ProductPrice[]>;

    create(
        price: ProductPrice,
    ): Promise<ProductPrice>;

    update(
        price: ProductPrice,
    ): Promise<ProductPrice>;
}
