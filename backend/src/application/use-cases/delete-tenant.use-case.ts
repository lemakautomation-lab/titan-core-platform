import { UseCase } from "../common/use-case.interface";

import { Result } from "../common/result";

import { TenantRepository } from "../../domain/repositories/tenant.repository";

import { DeleteTenantCommand } from "../commands/delete-tenant.command";


export class DeleteTenantUseCase
    implements UseCase<DeleteTenantCommand, Result<void>>
{

    constructor(
        private readonly tenantRepository: TenantRepository,
    ) {}

    async execute(
        command: DeleteTenantCommand,
    ): Promise<Result<void>> {

        const tenant =
            await this.tenantRepository.findById(
                command.id,
            );

        if (!tenant) {
            return Result.failure(
                "Tenant not found.",
            );
        }

        tenant.delete();

        await this.tenantRepository.update(
            tenant,
        );

        return Result.success(
            undefined,
        );

    }

}