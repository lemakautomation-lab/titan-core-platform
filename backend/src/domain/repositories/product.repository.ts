import { Product } from "../entities/product.entity";

export interface ProductRepository {

    findById(
        id: string,
        tenantId: string,
    ): Promise<Product | null>;

    findBySlug(
        slug: string,
        tenantId: string,
    ): Promise<Product | null>;

    findAll(
        tenantId: string,
    ): Promise<Product[]>;

    create(
        product: Product,
    ): Promise<Product>;

    update(
        product: Product,
    ): Promise<Product>;

    delete(
        id: string,
        tenantId: string,
    ): Promise<void>;
}