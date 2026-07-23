import { UseCase } from "../common/use-case.interface";
import { Result } from "../common/result";

import { TenantRepository } from "../../domain/repositories/tenant.repository";
import { Tenant } from "../../domain/entities/tenant.entity";

import { TenantDto } from "../dto/tenant/tenant.dto";
import { CreateTenantCommand } from "../commands/create-tenant.command";

import { TenantApplicationMapper } from "../mappers/tenant.mapper";

export class CreateTenantUseCase
    implements UseCase<CreateTenantCommand, Result<TenantDto>>
{
    constructor(
        private readonly tenantRepository: TenantRepository,
    ) {}

    async execute(
        command: CreateTenantCommand,
    ): Promise<Result<TenantDto>> {

        const slug = command.name
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");

        const existingTenant =
            await this.tenantRepository.findBySlug(slug);

        if (existingTenant) {
            return Result.failure("Tenant slug already exists.");
        }

        const tenant = Tenant.create(command.name);

        await this.tenantRepository.create(tenant);

        return Result.success(
            TenantApplicationMapper.toDto(tenant),
        );
    }
}
