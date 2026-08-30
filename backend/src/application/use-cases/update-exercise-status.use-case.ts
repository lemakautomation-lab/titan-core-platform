import { ExerciseRepository } from "../../domain/repositories/exercise.repository";
import { Result } from "../common/result";
import { UseCase } from "../common/use-case.interface";
import { UpdateExerciseStatusCommand } from "../commands/update-exercise-status.command";

export class UpdateExerciseStatusUseCase
implements UseCase<UpdateExerciseStatusCommand, Result<void>> {

    constructor(
        private readonly exerciseRepository: ExerciseRepository,
    ) {}

    async execute(
        command: UpdateExerciseStatusCommand,
    ): Promise<Result<void>> {

        const exercise =
            await this.exerciseRepository.findById(
                command.id,
                command.tenantId,
            );

        if (!exercise) {
            return Result.failure("Exercise not found.");
        }

        switch (command.status) {
            case "ACTIVE":
                exercise.activate();
                break;
            case "INACTIVE":
                exercise.deactivate();
                break;
            case "SUSPENDED":
                exercise.suspend();
                break;
            default:
                return Result.failure("Invalid exercise status.");
        }

        await this.exerciseRepository.update(
            exercise,
            command.tenantId,
        );

        return Result.success(undefined);
    }
}
