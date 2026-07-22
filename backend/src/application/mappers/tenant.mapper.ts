import { Tenant } from "../../domain/entities/tenant.entity";
import { TenantDto } from "../dto/tenant/tenant.dto";

export class TenantApplicationMapper {

    static toDto(tenant: Tenant): TenantDto {

        return new TenantDto(
            tenant.id,
            tenant.name,
            tenant.slug,
            tenant.status.toString(),
            tenant.createdAt,
            tenant.updatedAt,
        );

    }

}