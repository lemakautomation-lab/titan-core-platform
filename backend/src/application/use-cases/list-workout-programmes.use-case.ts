import { WorkoutProgrammeRepository } from "../../domain/repositories/workout-programme.repository";

import { ListWorkoutProgrammesQuery } from "../queries/workout-programme/list-workout-programmes.query";

import { WorkoutProgrammeDto } from "../dto/workout-programme/workout-programme.dto";

import {
    PaginatedResult,
    createPaginationMeta,
} from "../common/pagination";

import { Result } from "../common/result";
import { UseCase } from "../common/use-case.interface";

import { WorkoutProgrammeApplicationMapper } from "../mappers/workout-programme.mapper";

export class ListWorkoutProgrammesUseCase
implements UseCase<
    ListWorkoutProgrammesQuery,
    Result<PaginatedResult<WorkoutProgrammeDto>>
> {

    constructor(

        private readonly workoutProgrammeRepository:
            WorkoutProgrammeRepository,

    ) {}

    async execute(
        query: ListWorkoutProgrammesQuery,
    ): Promise<Result<PaginatedResult<WorkoutProgrammeDto>>> {

        const result =
            await this.workoutProgrammeRepository.findAll(
                query.tenantId,
                {
                    page:
                        query.page,

                    pageSize:
                        query.pageSize,
                },
            );

        return Result.success({

            data:
                result.items.map(
                    WorkoutProgrammeApplicationMapper.toDto,
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
