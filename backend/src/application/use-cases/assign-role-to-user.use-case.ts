import { UseCase } from "../common/use-case.interface";
import { Result } from "../common/result";

import { UserRepository } from "../../domain/repositories/user.repository";
import { RoleRepository } from "../../domain/repositories/role.repository";

import { AssignRoleToUserCommand } from "../commands/assign-role-to-user.command";

import { AuditLogService } from "../services/audit-log.service";
import { AuditLogStatus } from "../../domain/entities/audit-log.entity";

export class AssignRoleToUserUseCase
implements UseCase<AssignRoleToUserCommand, Result<void>>
{

    constructor(

        private readonly userRepository: UserRepository,

        private readonly roleRepository: RoleRepository,

        private readonly auditLogService: AuditLogService,

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

            user.tenantId,

            user.id,

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
