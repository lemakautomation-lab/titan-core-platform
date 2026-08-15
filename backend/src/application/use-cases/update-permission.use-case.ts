import { UseCase } from "../common/use-case.interface";
import { Result } from "../common/result";

import { PermissionRepository } from "../../domain/repositories/permission.repository";

import { UpdatePermissionCommand } from "../commands/update-permission.command";

import { PermissionDto } from "../dto/permission/permission.dto";
import { PermissionApplicationMapper } from "../mappers/permission.mapper";

import { AuditLogService } from "../services/audit-log.service";
import { AuditLogStatus } from "../../domain/entities/audit-log.entity";

export class UpdatePermissionUseCase
implements UseCase<UpdatePermissionCommand, Result<PermissionDto>>
{

    constructor(
        private readonly permissionRepository: PermissionRepository,
        private readonly auditLogService: AuditLogService,
    ) {}

    async execute(
        command: UpdatePermissionCommand,
    ): Promise<Result<PermissionDto>> {

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

        if (
            command.name !==
            permission.name
        ) {

            return Result.failure(
                "Permission name cannot be changed.",
            );
        }

        permission.updateDescription(
            command.description,
        );

        const updatedPermission =
            await this.permissionRepository.update(
                permission,
                command.tenantId,
            );

        await this.auditLogService.log(
            command.tenantId,
            command.userId,
            "PERMISSION_UPDATE",
            "PERMISSION",
            permission.id,
            AuditLogStatus.SUCCESS,
        );

        return Result.success(
            PermissionApplicationMapper.toDto(
                updatedPermission,
            ),
        );
    }

}
