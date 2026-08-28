import { ExerciseRepository } from "../../domain/repositories/exercise.repository";
import { DeleteExerciseCommand } from "../commands/delete-exercise.command";
import { Result } from "../common/result";
import { UseCase } from "../common/use-case.interface";

export class DeleteExerciseUseCase
implements UseCase<DeleteExerciseCommand, Result<void>> {

    constructor(
        private readonly exerciseRepository: ExerciseRepository,
    ) {}

    async execute(
        command: DeleteExerciseCommand,
    ): Promise<Result<void>> {

        const exercise =
            await this.exerciseRepository.findById(
                command.id,
                command.tenantId,
            );

        if (!exercise) {
            return Result.failure("Exercise not found.");
        }

        await this.exerciseRepository.delete(
            command.id,
            command.tenantId,
        );

        return Result.success(undefined);
    }
}
