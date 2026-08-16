import { UseCase } from "../common/use-case.interface";

import { Result } from "../common/result";

import { TenantRepository } from "../../domain/repositories/tenant.repository";

import { TenantDto } from "../dto/tenant/tenant.dto";

import { ListTenantsQuery } from "../queries/tenant/list-tenants.query";

import { TenantApplicationMapper } from "../mappers/tenant.mapper";


export class ListTenantsUseCase
    implements UseCase<ListTenantsQuery, Result<TenantDto[]>>
{

    constructor(
        private readonly tenantRepository: TenantRepository,
    ) {}

    async execute(
        query: ListTenantsQuery,
    ): Promise<Result<TenantDto[]>> {

        const tenant =
            await this.tenantRepository.findById(
                query.tenantId,
            );

        if (!tenant) {

            return Result.success([]);

        }

        return Result.success([
            TenantApplicationMapper.toDto(tenant),
        ]);

    }

}
