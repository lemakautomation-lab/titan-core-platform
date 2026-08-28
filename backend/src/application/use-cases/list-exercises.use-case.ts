import { ExerciseRepository } from "../../domain/repositories/exercise.repository";
import { ListExercisesQuery } from "../queries/exercise/list-exercises.query";
import { ExerciseDto } from "../dto/exercise/exercise.dto";

import {
    PaginatedResult,
    createPaginationMeta,
} from "../common/pagination";

import { Result } from "../common/result";
import { UseCase } from "../common/use-case.interface";
import { ExerciseApplicationMapper } from "../mappers/exercise.mapper";

export class ListExercisesUseCase
implements UseCase<ListExercisesQuery, Result<PaginatedResult<ExerciseDto>>>
{
    constructor(
        private readonly exerciseRepository: ExerciseRepository,
    ) {}

    async execute(
        query: ListExercisesQuery,
    ): Promise<Result<PaginatedResult<ExerciseDto>>> {

        const result =
            await this.exerciseRepository.findAll(
                query.tenantId,
                {
                    page: query.page,
                    pageSize: query.pageSize,
                },
            );

        return Result.success({
            data:
                result.items.map(
                    ExerciseApplicationMapper.toDto,
                ),

            pagination:
                createPaginationMeta(
                    query.page,
                    query.pageSize,
                    result.total,
                ),
        });
    }
}
