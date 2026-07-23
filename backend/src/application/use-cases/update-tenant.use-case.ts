import { UseCase } from "../common/use-case.interface";

import { Result } from "../common/result";

import { TenantRepository } from "../../domain/repositories/tenant.repository";

import { TenantDto } from "../dto/tenant/tenant.dto";

import { UpdateTenantCommand } from "../commands/update-tenant.command";

import { TenantApplicationMapper } from "../mappers/tenant.mapper";


export class UpdateTenantUseCase
implements UseCase<UpdateTenantCommand, Result<TenantDto>>
{

    constructor(

        private readonly tenantRepository: TenantRepository

    ) {}


    async execute(

        command: UpdateTenantCommand

    ): Promise<Result<TenantDto>> {


        const tenant =
            await this.tenantRepository.findById(
                command.id
            );


        if (!tenant) {

            return Result.failure(
                "Tenant not found"
            );

        }


        tenant.updateDetails(

            command.name,

            command.slug

        );


        const updatedTenant =
            await this.tenantRepository.update(
                tenant
            );


        return Result.success(

            TenantApplicationMapper.toDto(
                updatedTenant
            )

        );

    }

}