import { Result } from "../common/result";
import { AssignTrainerWorkoutProgrammeCommand } from "../commands/assign-trainer-workout-programme.command";
import { WorkoutProgrammeDto } from "../dto/workout-programme/workout-programme.dto";
import { WorkoutProgrammeApplicationMapper } from "../mappers/workout-programme.mapper";

import { AthleteRepository } from "../../domain/repositories/athlete.repository";
import { AthleteRelationshipRepository } from "../../domain/repositories/athlete-relationship.repository";
import { WorkoutProgrammeRepository } from "../../domain/repositories/workout-programme.repository";
import { AthleteRelationshipType } from "../../domain/enums/athlete-relationship-type.enum";

import { GetMyTrainerAccessUseCase } from "./get-my-trainer-access.use-case";

export class AssignTrainerWorkoutProgrammeUseCase {
    constructor(
        private readonly workoutProgrammeRepository:
            WorkoutProgrammeRepository,
        private readonly athleteRepository:
            AthleteRepository,
        private readonly relationshipRepository:
            AthleteRelationshipRepository,
        private readonly trainerAccess:
            GetMyTrainerAccessUseCase,
    ) {}

    async execute(
        command: Readonly<AssignTrainerWorkoutProgrammeCommand>,
    ): Promise<Result<WorkoutProgrammeDto>> {
        const access = await this.trainerAccess.execute({
            userId: command.userId,
            tenantId: command.tenantId,
        });

        if (!access.isSuccess || !access.value?.accessGranted) {
            return Result.failure(
                "Active Trainer access is required.",
            );
        }

        const programme =
            await this.workoutProgrammeRepository.findById(
                command.programmeId,
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

        const relationship =
            await this.relationshipRepository.findByAthleteAndRelatedEntity(
                command.athleteId,
                command.userId,
                AthleteRelationshipType.TRAINER,
                command.tenantId,
            );

        if (!relationship || !relationship.isActive()) {
            return Result.failure(
                "Active Trainer client relationship is required.",
            );
        }

        programme.assignToAthlete(
            command.athleteId,
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
