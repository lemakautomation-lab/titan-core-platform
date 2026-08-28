import { ExerciseRepository } from "../../domain/repositories/exercise.repository";
import { CreateExerciseCommand } from "../commands/create-exercise.command";
import { ExerciseDto } from "../dto/exercise/exercise.dto";
import { Result } from "../common/result";
import { UseCase } from "../common/use-case.interface";
import { Exercise } from "../../domain/entities/exercise.entity";
import { ExerciseApplicationMapper } from "../mappers/exercise.mapper";

export class CreateExerciseUseCase
implements UseCase<CreateExerciseCommand, Result<ExerciseDto>> {

    constructor(
        private readonly exerciseRepository: ExerciseRepository,
    ) {}

    async execute(
        command: CreateExerciseCommand,
    ): Promise<Result<ExerciseDto>> {

        const existing =
            await this.exerciseRepository.findBySlug(
                command.slug,
                command.tenantId,
            );

        if (existing) {
            return Result.failure("Exercise already exists.");
        }

        const exercise =
            Exercise.create(
                command.tenantId,
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

        const created =
            await this.exerciseRepository.create(exercise);

        return Result.success(
            ExerciseApplicationMapper.toDto(created),
        );
    }
}
