import { UseCase } from "../common/use-case.interface";
import { Result } from "../common/result";

import { UserRepository } from "../../domain/repositories/user.repository";
import { RoleRepository } from "../../domain/repositories/role.repository";

import { AssignRoleToUserCommand } from "../commands/assign-role-to-user.command";

export class AssignRoleToUserUseCase
    implements UseCase<AssignRoleToUserCommand, Result<void>>
{

    constructor(

        private readonly userRepository: UserRepository,

        private readonly roleRepository: RoleRepository,

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

        const role =
            await this.roleRepository.findById(
                command.roleId,
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

            );

        if (alreadyAssigned) {

            return Result.failure(
                "Role already assigned.",
            );

        }

        await this.userRepository.assignRole(

            command.userId,

            command.roleId,

        );

        return Result.success(
            undefined,
        );

    }

}
