import { UseCase } from "../common/use-case.interface";
import { Result } from "../common/result";

import { UserRepository } from "../../domain/repositories/user.repository";

import { DeleteUserCommand } from "../commands/delete-user.command";


export class DeleteUserUseCase
    implements UseCase<DeleteUserCommand, Result<void>>
{

    constructor(
        private readonly userRepository: UserRepository,
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

        return Result.success(
            undefined,
        );

    }

}
