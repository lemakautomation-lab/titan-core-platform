import { UseCase } from "../common/use-case.interface";
import { Result } from "../common/result";

import { UserRepository } from "../../domain/repositories/user.repository";
import { RoleRepository } from "../../domain/repositories/role.repository";

import { RemoveRoleFromUserCommand } from "../commands/remove-role-from-user.command";

import { AuditLogService } from "../services/audit-log.service";
import {
    AuditLogStatus,
} from "../../domain/entities/audit-log.entity";


export class RemoveRoleFromUserUseCase
    implements UseCase<RemoveRoleFromUserCommand, Result<void>>
{

    constructor(

        private readonly userRepository: UserRepository,

        private readonly roleRepository: RoleRepository,

        private readonly auditLogService: AuditLogService,

    ) {}

    async execute(

        command: RemoveRoleFromUserCommand,

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

        const role =
            await this.roleRepository.findById(
                command.roleId,
            );

        if (!role) {

            return Result.failure(
                "Role not found.",
            );

        }

        const assigned =
            await this.userRepository.hasRole(

                command.userId,

                command.roleId,

            );

        if (!assigned) {

            return Result.failure(
                "Role is not assigned.",
            );

        }

        await this.userRepository.removeRole(

            command.userId,

            command.roleId,

        );

        await this.auditLogService.log(

            user.tenantId,

            user.id,

            "USER_ROLE_REMOVE",

            "USER_ROLE",

            command.userId,

            AuditLogStatus.SUCCESS,

        );

        return Result.success(
            undefined,
        );

    }

}
