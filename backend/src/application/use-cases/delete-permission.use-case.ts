import { UseCase } from "../common/use-case.interface";
import { Result } from "../common/result";

import { PermissionRepository } from "../../domain/repositories/permission.repository";

import { DeletePermissionCommand } from "../commands/delete-permission.command";

import { AuditLogService } from "../services/audit-log.service";
import { AuditLogStatus } from "../../domain/entities/audit-log.entity";

export class DeletePermissionUseCase
implements UseCase<DeletePermissionCommand, Result<void>>
{

    constructor(
        private readonly permissionRepository: PermissionRepository,
        private readonly auditLogService: AuditLogService,
    ) {}

    async execute(
        command: DeletePermissionCommand,
    ): Promise<Result<void>> {

        const permission =
            await this.permissionRepository.findById(
                command.id,
                command.tenantId,
            );

        if (!permission) {

            return Result.failure(
                "Permission not found.",
            );
        }

        await this.permissionRepository.delete(
            command.id,
            command.tenantId,
        );

        await this.auditLogService.log(
            command.tenantId,
            command.userId,
            "PERMISSION_DELETE",
            "PERMISSION",
            command.id,
            AuditLogStatus.SUCCESS,
        );

        return Result.success(
            undefined,
        );
    }

}

