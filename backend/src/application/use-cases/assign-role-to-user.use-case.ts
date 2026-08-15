import { UseCase } from "../common/use-case.interface";
import { Result } from "../common/result";

import { UserRepository } from "../../domain/repositories/user.repository";
import { RoleRepository } from "../../domain/repositories/role.repository";

import { AssignRoleToUserCommand } from "../commands/assign-role-to-user.command";

import { AuditLogService } from "../services/audit-log.service";
import { AuditLogStatus } from "../../domain/entities/audit-log.entity";

import { PermissionResolutionService } from "../services/permission-resolution.service";

export class AssignRoleToUserUseCase
implements UseCase<AssignRoleToUserCommand, Result<void>>
{

    constructor(

        private readonly userRepository: UserRepository,

        private readonly roleRepository: RoleRepository,

        private readonly auditLogService: AuditLogService,

        private readonly permissionResolutionService:
            PermissionResolutionService,

    ) {}

    async execute(

        command: AssignRoleToUserCommand,

    ): Promise<Result<void>> {

        const user =
            await this.userRepository.findById(
                command.userId,
            );

        if (!user) {

            return Result.failure(
                "User not found.",
            );

        }

        if (
            user.tenantId !==
            command.tenantId
        ) {

            return Result.failure(
                "Forbidden.",
            );

        }

        const role =
            await this.roleRepository.findById(
                command.roleId,
                command.tenantId,
            );

        if (!role) {

            return Result.failure(
                "Role not found.",
            );

        }

        const actorPermissions =
            await this.permissionResolutionService
                .getUserPermissions(
                    command.actorUserId,
                    command.tenantId,
                );

        const actorPermissionSet =
            new Set(
                actorPermissions,
            );

        const rolePermissions =
            await this.roleRepository.findPermissions(
                role.id,
                command.tenantId,
            );

        if (rolePermissions.length === 0) {

            return Result.failure(
                "Forbidden.",
            );

        }

        const canDelegateRole =
            rolePermissions.every(
                permission =>
                    actorPermissionSet.has(
                        permission.name,
                    ),
            );

        if (!canDelegateRole) {

            return Result.failure(
                "Forbidden.",
            );

        }

        const alreadyAssigned =
            await this.userRepository.hasRole(

                command.userId,

                command.roleId,

                command.tenantId,

            );

        if (alreadyAssigned) {

            return Result.failure(
                "Role already assigned.",
            );

        }

        await this.userRepository.assignRole(

            command.userId,

            command.roleId,

            command.tenantId,

        );

        await this.auditLogService.log(

            command.tenantId,

            command.actorUserId,

            "USER_ROLE_ASSIGN",

            "USER_ROLE",

            command.userId,

            AuditLogStatus.SUCCESS,

        );

        return Result.success(
            undefined,
        );

    }

}
