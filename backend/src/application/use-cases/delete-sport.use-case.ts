import { SportRepository } from "../../domain/repositories/sport.repository";

import { DeleteSportCommand } from "../commands/delete-sport.command";

import { Result } from "../common/result";

import { UseCase } from "../common/use-case.interface";

export class DeleteSportUseCase
implements UseCase<DeleteSportCommand, Result<void>>
{

    constructor(

        private readonly sportRepository: SportRepository,

    ) {}

    async execute(
        command: DeleteSportCommand,
    ): Promise<Result<void>> {

        const sport =
            await this.sportRepository.findById(
                command.id,
                command.tenantId,
            );

        if (!sport) {

            return Result.failure(
                "Sport not found.",
            );

        }

        await this.sportRepository.delete(
            command.id,
            command.tenantId,
        );

        return Result.success(
            undefined,
        );

    }

}
