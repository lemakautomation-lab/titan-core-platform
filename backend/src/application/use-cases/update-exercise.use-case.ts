import { ExerciseRepository } from "../../domain/repositories/exercise.repository";
import { UpdateExerciseCommand } from "../commands/update-exercise.command";
import { ExerciseDto } from "../dto/exercise/exercise.dto";
import { Result } from "../common/result";
import { UseCase } from "../common/use-case.interface";
import { ExerciseApplicationMapper } from "../mappers/exercise.mapper";

export class UpdateExerciseUseCase
implements UseCase<UpdateExerciseCommand, Result<ExerciseDto>> {

    constructor(
        private readonly exerciseRepository: ExerciseRepository,
    ) {}

    async execute(
        command: UpdateExerciseCommand,
    ): Promise<Result<ExerciseDto>> {

        const exercise =
            await this.exerciseRepository.findById(
                command.id,
                command.tenantId,
            );

        if (!exercise) {
            return Result.failure("Exercise not found.");
        }

        const existing =
            await this.exerciseRepository.findBySlug(
                command.slug,
                command.tenantId,
            );

        if (existing && existing.id !== exercise.id) {
            return Result.failure("Exercise already exists.");
        }

        exercise.updateDetails(
            command.name,
            command.slug,
            command.description,
            command.movement,
            command.muscleGroups,
            command.equipment,
            command.trainingObjective,
            command.difficulty,
            command.trainingPhase,
            command.sportId,
        );

        const updated =
            await this.exerciseRepository.update(
                exercise,
                command.tenantId,
            );

        return Result.success(
            ExerciseApplicationMapper.toDto(updated),
        );
    }
}
