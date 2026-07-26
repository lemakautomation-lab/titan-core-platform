import { UseCase } from "../common/use-case.interface";
import { Result } from "../common/result";

import { RoleRepository } from "../../domain/repositories/role.repository";

import { DeleteRoleCommand } from "../commands/delete-role.command";

export class DeleteRoleUseCase
    implements UseCase<DeleteRoleCommand, Result<void>>
{

    constructor(

        private readonly roleRepository: RoleRepository,

    ) {}

    async execute(

        command: DeleteRoleCommand,

    ): Promise<Result<void>> {

        const role =
            await this.roleRepository.findById(
                command.id,
            );

        if (!role) {

            return Result.failure(
                "Role not found.",
            );

        }

        await this.roleRepository.delete(
            command.id,
        );

        return Result.success(
            undefined,
        );

    }

}