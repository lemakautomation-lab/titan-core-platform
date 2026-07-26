import { UseCase } from "../common/use-case.interface";
import { Result } from "../common/result";

import { PermissionRepository } from "../../domain/repositories/permission.repository";

import { DeletePermissionCommand } from "../commands/delete-permission.command";

export class DeletePermissionUseCase
    implements UseCase<DeletePermissionCommand, Result<void>>
{

    constructor(

        private readonly permissionRepository: PermissionRepository,

    ) {}

    async execute(

        command: DeletePermissionCommand,

    ): Promise<Result<void>> {

        const permission =
            await this.permissionRepository.findById(
                command.id,
            );

        if (!permission) {

            return Result.failure(
                "Permission not found.",
            );

        }

        await this.permissionRepository.delete(
            command.id,
        );

        return Result.success(
            undefined,
        );

    }

}
