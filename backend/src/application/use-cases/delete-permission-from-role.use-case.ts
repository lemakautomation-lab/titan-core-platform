import { DeletePermissionFromRoleCommand } from "../commands/delete-permission-from-role.command";

import { RoleRepository } from "../../domain/repositories/role.repository";
import { PermissionRepository } from "../../domain/repositories/permission.repository";
import { RolePermissionRepository } from "../../domain/repositories/role-permission.repository";

import { AuditLogService } from "../services/audit-log.service";
import { AuditLogStatus } from "../../domain/entities/audit-log.entity";

export class DeletePermissionFromRoleUseCase {

    constructor(
        private readonly roleRepository: RoleRepository,
        private readonly permissionRepository: PermissionRepository,
        private readonly rolePermissionRepository: RolePermissionRepository,
        private readonly auditLogService: AuditLogService,
    ) {}

    async execute(
        command: DeletePermissionFromRoleCommand,
    ) {

        const role =
            await this.roleRepository.findById(
                command.roleId,
                command.tenantId,
            );

        if (!role) {

            return {
                isSuccess: false,
                error: "Role not found.",
            };
        }

        const permission =
            await this.permissionRepository.findById(
                command.permissionId,
                command.tenantId,
            );

        if (!permission) {

            return {
                isSuccess: false,
                error: "Permission not found.",
            };
        }

        const assignment =
            await this.rolePermissionRepository.findByRoleAndPermission(
                command.roleId,
                command.permissionId,
            );

        if (!assignment) {

            return {
                isSuccess: false,
                error: "Permission is not assigned to role.",
            };
        }

        await this.rolePermissionRepository.delete(
            command.roleId,
            command.permissionId,
        );

        await this.auditLogService.log(
            command.tenantId,
            command.userId,
            "ROLE_PERMISSION_DELETE",
            "ROLE_PERMISSION",
            assignment.id,
            AuditLogStatus.SUCCESS,
        );

        return {
            isSuccess: true,
            value: true,
        };
    }

}
