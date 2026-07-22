import { Tenant } from "../../domain/entities/tenant.entity";
import { TenantRepository } from "../../domain/repositories/tenant.repository";

import { DatabaseService } from "../database/database.service";
import { TenantMapper } from "../mappers/tenant.mapper";

export class PrismaTenantRepository implements TenantRepository {

    constructor(
        private readonly database: DatabaseService,
    ) {}

    async findById(id: string): Promise<Tenant | null> {

        const tenant = await this.database.prisma.tenant.findUnique({
            where: { id },
        });

        return tenant ? TenantMapper.toDomain(tenant) : null;

    }

    async findBySlug(slug: string): Promise<Tenant | null> {

        const tenant = await this.database.prisma.tenant.findUnique({
            where: { slug },
        });

        return tenant ? TenantMapper.toDomain(tenant) : null;

    }

    async findAll(): Promise<Tenant[]> {

        const tenants = await this.database.prisma.tenant.findMany();

        return tenants.map(TenantMapper.toDomain);

    }

    async create(tenant: Tenant): Promise<Tenant> {

        const created = await this.database.prisma.tenant.create({
            data: TenantMapper.toPersistence(tenant),
        });

        return TenantMapper.toDomain(created);

    }

    async update(tenant: Tenant): Promise<Tenant> {

        const updated = await this.database.prisma.tenant.update({
            where: {
                id: tenant.id,
            },
            data: TenantMapper.toPersistence(tenant),
        });

        return TenantMapper.toDomain(updated);

    }

    async delete(id: string): Promise<void> {

        await this.database.prisma.tenant.delete({
            where: {
                id,
            },
        });

    }

}