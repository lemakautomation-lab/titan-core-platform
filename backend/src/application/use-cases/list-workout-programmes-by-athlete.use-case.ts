import { AthleteRepository } from "../../domain/repositories/athlete.repository";
import { WorkoutProgrammeRepository } from "../../domain/repositories/workout-programme.repository";

import { ListWorkoutProgrammesByAthleteQuery } from "../queries/workout-programme/list-workout-programmes-by-athlete.query";

import { WorkoutProgrammeDto } from "../dto/workout-programme/workout-programme.dto";

import { Result } from "../common/result";
import { UseCase } from "../common/use-case.interface";

import { WorkoutProgrammeApplicationMapper } from "../mappers/workout-programme.mapper";

export class ListWorkoutProgrammesByAthleteUseCase
implements UseCase<
    ListWorkoutProgrammesByAthleteQuery,
    Result<WorkoutProgrammeDto[]>
> {

    constructor(

        private readonly workoutProgrammeRepository:
            WorkoutProgrammeRepository,

        private readonly athleteRepository:
            AthleteRepository,

    ) {}

    async execute(
        query: ListWorkoutProgrammesByAthleteQuery,
    ): Promise<Result<WorkoutProgrammeDto[]>> {

        const athlete =
            await this.athleteRepository.findById(
                query.athleteId,
                query.tenantId,
            );

        if (!athlete) {

            return Result.failure(
                "Athlete not found.",
            );

        }

        const programmes =
            await this.workoutProgrammeRepository.findAllByAthleteId(
                query.athleteId,
                query.tenantId,
            );

        return Result.success(

            programmes.map(
                WorkoutProgrammeApplicationMapper.toDto,
            ),

        );

    }

}
