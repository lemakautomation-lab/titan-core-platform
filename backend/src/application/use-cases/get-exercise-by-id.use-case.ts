import { ExerciseRepository } from "../../domain/repositories/exercise.repository";
import { GetExerciseByIdQuery } from "../queries/exercise/get-exercise-by-id.query";
import { ExerciseDto } from "../dto/exercise/exercise.dto";
import { Result } from "../common/result";
import { UseCase } from "../common/use-case.interface";
import { ExerciseApplicationMapper } from "../mappers/exercise.mapper";

export class GetExerciseByIdUseCase
implements UseCase<GetExerciseByIdQuery, Result<ExerciseDto>> {

    constructor(
        private readonly exerciseRepository: ExerciseRepository,
    ) {}

    async execute(
        query: GetExerciseByIdQuery,
    ): Promise<Result<ExerciseDto>> {

        const exercise =
            await this.exerciseRepository.findById(
                query.id,
                query.tenantId,
            );

        if (!exercise) {
            return Result.failure("Exercise not found.");
        }

        return Result.success(
            ExerciseApplicationMapper.toDto(exercise),
        );
    }
}
