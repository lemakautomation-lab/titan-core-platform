import { RecordStatus } from "../../domain/enums/record-status.enum";
import { WorkoutProgrammeRepository } from "../../domain/repositories/workout-programme.repository";
import { Result } from "../common/result";
import { UseCase } from "../common/use-case.interface";
import { UpdateWorkoutProgrammeStatusCommand } from "../commands/update-workout-programme-status.command";

export class UpdateWorkoutProgrammeStatusUseCase
implements UseCase<UpdateWorkoutProgrammeStatusCommand, Result<void>> {

    constructor(
        private readonly workoutProgrammeRepository: WorkoutProgrammeRepository,
    ) {}

    async execute(
        command: UpdateWorkoutProgrammeStatusCommand,
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
                return Result.failure(
                    "Invalid workout programme status.",
                );
        }

        try {
            await this.workoutProgrammeRepository.updateStatus(
                command.id,
                command.tenantId,
                status,
            );
        } catch (error) {
            if (
                error instanceof Error &&
                error.message === "Workout Programme not found."
            ) {
                return Result.failure(
                    "Workout Programme not found.",
                );
            }

            throw error;
        }

        return Result.success(undefined);
    }
}
