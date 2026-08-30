import { AthleteRepository } from "../../domain/repositories/athlete.repository";
import { SportRepository } from "../../domain/repositories/sport.repository";
import { WorkoutProgrammeRepository } from "../../domain/repositories/workout-programme.repository";

import { CreateWorkoutProgrammeCommand } from "../commands/create-workout-programme.command";
import { WorkoutProgrammeDto } from "../dto/workout-programme/workout-programme.dto";
import { WorkoutProgrammeApplicationMapper } from "../mappers/workout-programme.mapper";

import { Result } from "../common/result";
import { UseCase } from "../common/use-case.interface";

import { WorkoutProgramme } from "../../domain/entities/workout-programme.entity";

export class CreateWorkoutProgrammeUseCase
implements UseCase<
    CreateWorkoutProgrammeCommand,
    Result<WorkoutProgrammeDto>
> {

    constructor(

        private readonly workoutProgrammeRepository:
            WorkoutProgrammeRepository,

        private readonly athleteRepository:
            AthleteRepository,

        private readonly sportRepository:
            SportRepository,

    ) {}

    async execute(
        command: CreateWorkoutProgrammeCommand,
    ): Promise<Result<WorkoutProgrammeDto>> {

        if (
            !Number.isInteger(command.trainingFrequency) ||
            command.trainingFrequency <= 0
        ) {

            return Result.failure(
                "Training frequency must be a positive integer.",
            );

        }

        const athlete =
            await this.athleteRepository.findById(
                command.athleteId,
                command.tenantId,
            );

        if (!athlete) {

            return Result.failure(
                "Athlete not found.",
            );

        }

        if (command.sportId !== null) {

            const sport =
                await this.sportRepository.findById(
                    command.sportId,
                    command.tenantId,
                );

            if (!sport) {

                return Result.failure(
                    "Sport not found.",
                );

            }

        }

        const programme =
            WorkoutProgramme.create(

                command.tenantId,

                command.athleteId,

                command.name,

                command.description,

                command.goal,

                command.experience,

                command.trainingFrequency,

                command.sessionDurationMinutes,

                command.sportId,

            );

        const created =
            await this.workoutProgrammeRepository.create(
                programme,
            );

        return Result.success(
            WorkoutProgrammeApplicationMapper.toDto(
                created,
            ),
        );

    }

}
