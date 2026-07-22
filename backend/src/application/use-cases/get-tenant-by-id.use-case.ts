import { UseCase } from "../common/use-case.interface";

import { Result } from "../common/result";

import { TenantRepository } from "../../domain/repositories/tenant.repository";

import { TenantDto } from "../dto/tenant/tenant.dto";

import { GetTenantByIdQuery } from "../queries/tenant/get-tenant-by-id.query";

import { TenantApplicationMapper } from "../mappers/tenant.mapper";


export class GetTenantByIdUseCase
    implements UseCase<GetTenantByIdQuery, Result<TenantDto>>
{

    constructor(
        private readonly tenantRepository: TenantRepository,
    ) {}

    async execute(
        query: GetTenantByIdQuery,
    ): Promise<Result<TenantDto>> {

        const tenant =
            await this.tenantRepository.findById(query.id);

        if (!tenant) {

            return Result.failure(
                "Tenant not found.",
            );

        }

        return Result.success(
            TenantApplicationMapper.toDto(tenant),
        );

    }

}