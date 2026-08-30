import { WorkoutProgrammeRepository } from "../../domain/repositories/workout-programme.repository";

import { DeleteWorkoutProgrammeCommand } from "../commands/delete-workout-programme.command";

import { Result } from "../common/result";
import { UseCase } from "../common/use-case.interface";

export class DeleteWorkoutProgrammeUseCase
implements UseCase<
    DeleteWorkoutProgrammeCommand,
    Result<void>
> {

    constructor(

        private readonly workoutProgrammeRepository:
            WorkoutProgrammeRepository,

    ) {}

    async execute(
        command: DeleteWorkoutProgrammeCommand,
    ): Promise<Result<void>> {

        const programme =
            await this.workoutProgrammeRepository.findById(
                command.id,
                command.tenantId,
            );

        if (!programme) {

            return Result.failure(
                "Workout Programme not found.",
            );

        }

        await this.workoutProgrammeRepository.delete(
            command.id,
            command.tenantId,
        );

        return Result.success(
            undefined,
        );

    }

}
