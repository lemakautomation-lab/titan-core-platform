import { WorkoutProgrammeRepository } from "../../domain/repositories/workout-programme.repository";

import { GetWorkoutProgrammeByIdQuery } from "../queries/workout-programme/get-workout-programme-by-id.query";

import { WorkoutProgrammeDto } from "../dto/workout-programme/workout-programme.dto";

import { Result } from "../common/result";
import { UseCase } from "../common/use-case.interface";

import { WorkoutProgrammeApplicationMapper } from "../mappers/workout-programme.mapper";

export class GetWorkoutProgrammeByIdUseCase
implements UseCase<
    GetWorkoutProgrammeByIdQuery,
    Result<WorkoutProgrammeDto>
> {

    constructor(

        private readonly workoutProgrammeRepository:
            WorkoutProgrammeRepository,

    ) {}

    async execute(
        query: GetWorkoutProgrammeByIdQuery,
    ): Promise<Result<WorkoutProgrammeDto>> {

        const programme =
            await this.workoutProgrammeRepository.findById(
                query.id,
                query.tenantId,
            );

        if (!programme) {

            return Result.failure(
                "Workout Programme not found.",
            );

        }

        return Result.success(
            WorkoutProgrammeApplicationMapper.toDto(
                programme,
            ),
        );

    }

}
