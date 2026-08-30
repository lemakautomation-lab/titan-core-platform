import { AthleteRepository } from "../../domain/repositories/athlete.repository";
import { SportRepository } from "../../domain/repositories/sport.repository";
import { WorkoutProgrammeRepository } from "../../domain/repositories/workout-programme.repository";

import { UpdateWorkoutProgrammeCommand } from "../commands/update-workout-programme.command";
import { WorkoutProgrammeDto } from "../dto/workout-programme/workout-programme.dto";

import { Result } from "../common/result";
import { UseCase } from "../common/use-case.interface";

import { WorkoutProgrammeApplicationMapper } from "../mappers/workout-programme.mapper";

export class UpdateWorkoutProgrammeUseCase
implements UseCase<
    UpdateWorkoutProgrammeCommand,
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
        command: UpdateWorkoutProgrammeCommand,
    ): Promise<Result<WorkoutProgrammeDto>> {

        if (
            !Number.isInteger(command.trainingFrequency) ||
            command.trainingFrequency <= 0
        ) {

            return Result.failure(
                "Training frequency must be a positive integer.",
            );

        }

        const programme =
            await this.workoutProgrammeRepository.findById(
                command.id,
                command.tenantId,
            );

        if (!programme) {

            return Result.failure(
                "Workout Programme not found.",
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

        programme.updateDetails(

            command.name,

            command.description,

            command.goal,

            command.experience,

            command.trainingFrequency,

            command.sessionDurationMinutes,

            command.sportId,

        );

        const updated =
            await this.workoutProgrammeRepository.update(
                programme,
                command.tenantId,
            );

        return Result.success(
            WorkoutProgrammeApplicationMapper.toDto(
                updated,
            ),
        );

    }

}
