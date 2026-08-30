import { ExerciseRepository } from "../../domain/repositories/exercise.repository";
import { Result } from "../common/result";
import { UseCase } from "../common/use-case.interface";
import { UpdateExerciseStatusCommand } from "../commands/update-exercise-status.command";
import { RecordStatus } from "../../domain/enums/record-status.enum";

export class UpdateExerciseStatusUseCase
implements UseCase<UpdateExerciseStatusCommand, Result<void>> {

    constructor(
        private readonly exerciseRepository: ExerciseRepository,
    ) {}

    async execute(
        command: UpdateExerciseStatusCommand,
    ): Promise<Result<void>> {

        let status: RecordStatus;

        switch (command.status) {
            case "ACTIVE":
                status = RecordStatus.ACTIVE;
                break;

            case "INACTIVE":
                status = RecordStatus.INACTIVE;
                break;

            case "SUSPENDED":
                status = RecordStatus.SUSPENDED;
                break;

            default:
                return Result.failure("Invalid exercise status.");
        }

        const updated =
            await this.exerciseRepository.updateStatus(
                command.id,
                command.tenantId,
                status,
            );

        if (!updated) {
            return Result.failure("Exercise not found.");
        }

        return Result.success(undefined);
    }
}
