import { Tenant } from "../entities/tenant.entity";

export interface TenantRepository {

    findById(
        id: string
    ): Promise<Tenant | null>;

    findBySlug(
        slug: string
    ): Promise<Tenant | null>;

    findAll(): Promise<Tenant[]>;

    create(
        tenant: Tenant
    ): Promise<Tenant>;

    update(
        tenant: Tenant
    ): Promise<Tenant>;

    delete(
        id: string
    ): Promise<void>;

}