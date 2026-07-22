import { Tenant as PrismaTenant } from "../../generated/prisma/client";
import { Tenant } from "../../domain/entities/tenant.entity";
import { RecordStatus } from "../../domain/enums/record-status.enum";

export class TenantMapper {

    static toDomain(prisma: PrismaTenant): Tenant {

        return new Tenant(
            prisma.id,
            prisma.name,
            prisma.slug,
            prisma.status as RecordStatus,
            prisma.createdAt,
            prisma.updatedAt,
        );

    }

    static toPersistence(
        tenant: Tenant,
    ) {

        return {

            id: tenant.id,

            name: tenant.name,

            slug: tenant.slug,

            status: tenant.status,

        };

    }

}