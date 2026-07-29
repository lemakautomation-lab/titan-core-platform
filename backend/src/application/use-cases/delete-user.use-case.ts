import { UseCase } from "../common/use-case.interface";
import { Result } from "../common/result";

import { UserRepository } from "../../domain/repositories/user.repository";

import { DeleteUserCommand } from "../commands/delete-user.command";

import { AuditLogService } from "../services/audit-log.service";
import { AuditLogStatus } from "../../domain/entities/audit-log.entity";


export class DeleteUserUseCase
    implements UseCase<DeleteUserCommand, Result<void>>
{

    constructor(
        private readonly userRepository: UserRepository,
        private readonly auditLogService: AuditLogService,
    ) {}

    async execute(
        command: DeleteUserCommand,
    ): Promise<Result<void>> {

        const user =
            await this.userRepository.findById(
                command.id,
            );

        if (!user) {

            return Result.failure(
                "User not found.",
            );

        }

        user.deactivate();

        await this.userRepository.update(
            user,
        );

        await this.auditLogService.log(

            user.tenantId,

            user.id,

            "USER_DELETE",

            "USER",

            user.id,

            AuditLogStatus.SUCCESS,

        );

        return Result.success(
            undefined,
        );

    }

}



