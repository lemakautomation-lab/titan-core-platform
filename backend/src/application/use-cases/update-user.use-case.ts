import { UseCase } from "../common/use-case.interface";
import { Result } from "../common/result";

import { UserRepository } from "../../domain/repositories/user.repository";

import { UpdateUserCommand } from "../commands/update-user.command";

import { UserDto } from "../dto/user/user.dto";
import { UserApplicationMapper } from "../mappers/user.mapper";

import { passwordSecurity } from "../../security/bcrypt";

import { AuditLogService } from "../services/audit-log.service";
import { AuditLogStatus } from "../../domain/entities/audit-log.entity";
import { AuditAction } from "../../domain/security/audit-action";

export class UpdateUserUseCase
implements UseCase<UpdateUserCommand, Result<UserDto>>
{

    constructor(

        private readonly userRepository: UserRepository,

        private readonly auditLogService: AuditLogService,

    ) {}

    async execute(

        command: UpdateUserCommand,

    ): Promise<Result<UserDto>> {

        const user =
            await this.userRepository.findById(
                command.id,
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

        if (user.email !== command.email) {

            const existingUser =
                await this.userRepository.findByEmail(
                command.email,
                user.tenantId,
            );

            if (
                existingUser &&
                existingUser.tenantId === user.tenantId &&
                existingUser.id !== user.id
            ) {

                return Result.failure(
                    "Email already exists for this tenant.",
                );

            }

        }

        user.updateProfile(

            command.organisationId,

            command.email,

            command.firstName,

            command.lastName,

        );

        if (command.password) {

            const passwordHash =
                await passwordSecurity.hash(
                    command.password,
                );

            user.changePassword(
                passwordHash,
            );

        }

        const updatedUser =
            await this.userRepository.update(
                user,
            );

        await this.auditLogService.log(

            updatedUser.tenantId,

            updatedUser.id,

            AuditAction.USER_UPDATE,

            "USER",

            updatedUser.id,

            AuditLogStatus.SUCCESS,

        );

        return Result.success(

            UserApplicationMapper.toDto(
                updatedUser,
            ),

        );

    }

}


