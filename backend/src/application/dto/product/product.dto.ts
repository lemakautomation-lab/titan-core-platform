export interface ProductDto {

    id: string;

    name: string;

    slug: string;

    description: string | null;

    priceCents: number;

    currency: string;

    billingInterval: string;

    status: string;

    createdAt: Date;

    updatedAt: Date;

}
