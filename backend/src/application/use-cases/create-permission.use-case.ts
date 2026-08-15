import { UseCase } from "../common/use-case.interface";
import { Result } from "../common/result";

import { Permission } from "../../domain/entities/permission.entity";
import { PermissionRepository } from "../../domain/repositories/permission.repository";

import { CreatePermissionCommand } from "../commands/create-permission.command";
import { PermissionDto } from "../dto/permission/permission.dto";
import { PermissionApplicationMapper } from "../mappers/permission.mapper";

import { AuditLogService } from "../services/audit-log.service";
import { AuditLogStatus } from "../../domain/entities/audit-log.entity";

const RESERVED_PERMISSION_NAMES = new Set([
    "users.read",
    "users.create",
    "users.update",
    "users.delete",

    "roles.read",
    "roles.create",
    "roles.update",
    "roles.delete",

    "permissions.read",
    "permissions.create",
    "permissions.update",
    "permissions.delete",

    "roles.permissions.manage",
]);

export class CreatePermissionUseCase
implements UseCase<CreatePermissionCommand, Result<PermissionDto>>
{

    constructor(
        private readonly permissionRepository: PermissionRepository,
        private readonly auditLogService: AuditLogService,
    ) {}

    async execute(
        command: CreatePermissionCommand,
    ): Promise<Result<PermissionDto>> {

        if (
            RESERVED_PERMISSION_NAMES.has(
                command.name,
            )
        ) {

            return Result.failure(
                "Permission name is reserved.",
            );
        }

        const existingPermission =
            await this.permissionRepository.findByName(
                command.name,
                command.tenantId,
            );

        if (existingPermission) {

            return Result.failure(
                "Permission already exists.",
            );
        }

        const permission =
            Permission.create(
                command.tenantId,
                command.name,
                command.name,
                command.description ?? "",
            );

        await this.permissionRepository.create(
            permission,
        );

        await this.auditLogService.log(
            command.tenantId,
            command.userId,
            "PERMISSION_CREATE",
            "PERMISSION",
            permission.id,
            AuditLogStatus.SUCCESS,
        );

        return Result.success(
            PermissionApplicationMapper.toDto(
                permission,
            ),
        );
    }

}
