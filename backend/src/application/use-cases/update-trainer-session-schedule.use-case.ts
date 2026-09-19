import { Result } from "../common/result";
import { UpdateTrainerSessionScheduleCommand } from "../commands/update-trainer-session-schedule.command";
import { TrainerSessionScheduleDto } from "../dto/trainer/trainer-session-schedule.dto";
import { TrainerSessionScheduleApplicationMapper } from "../mappers/trainer-session-schedule.mapper";

import { AthleteRelationshipType } from "../../domain/enums/athlete-relationship-type.enum";
import { AthleteRelationshipRepository } from "../../domain/repositories/athlete-relationship.repository";
import { TrainerSessionScheduleRepository } from "../../domain/repositories/trainer-session-schedule.repository";

import { GetMyTrainerAccessUseCase } from "./get-my-trainer-access.use-case";

export class UpdateTrainerSessionScheduleUseCase {

    constructor(
        private readonly scheduleRepository:
            TrainerSessionScheduleRepository,
        private readonly relationshipRepository:
            AthleteRelationshipRepository,
        private readonly trainerAccess:
            GetMyTrainerAccessUseCase,
    ) {}

    async execute(
        command: Readonly<UpdateTrainerSessionScheduleCommand>,
        now: Date = new Date(),
    ): Promise<Result<TrainerSessionScheduleDto>> {

        const access = await this.trainerAccess.execute({
            userId: command.userId,
            tenantId: command.tenantId,
        });

        if (!access.isSuccess || !access.value?.accessGranted) {
            return Result.failure(
                "Active Trainer access is required.",
            );
        }

        const schedule =
            await this.scheduleRepository.findById(
                command.id,
                command.tenantId,
            );

        if (
            !schedule ||
            schedule.trainerUserId !== command.userId
        ) {
            return Result.failure(
                "Trainer session schedule not found.",
            );
        }

        const relationship =
            await this.relationshipRepository
                .findByAthleteAndRelatedEntity(
                    schedule.athleteId,
                    command.userId,
                    AthleteRelationshipType.TRAINER,
                    command.tenantId,
                );

        if (!relationship || !relationship.isActive()) {
            return Result.failure(
                "Active Trainer client relationship is required.",
            );
        }

        if (
            Number.isNaN(command.startsAt.getTime()) ||
            Number.isNaN(command.endsAt.getTime()) ||
            command.startsAt >= command.endsAt
        ) {
            return Result.failure(
                "Session time range is invalid.",
            );
        }

        if (command.startsAt <= now) {
            return Result.failure(
                "Session start time must be in the future.",
            );
        }

        const conflict =
            await this.scheduleRepository.findConflicting(
                command.tenantId,
                command.userId,
                schedule.athleteId,
                command.startsAt,
                command.endsAt,
                schedule.id,
            );

        if (conflict) {
            return Result.failure(
                "Session conflicts with an existing Trainer or Athlete session.",
            );
        }

        try {
            schedule.updateDetails(
                command.title,
                command.notes,
                command.startsAt,
                command.endsAt,
                now,
            );
        }
        catch (error) {
            return Result.failure(
                error instanceof Error
                    ? error.message
                    : "Session details are invalid.",
            );
        }

        const updated =
            await this.scheduleRepository.update(
                schedule,
            );

        return Result.success(
            TrainerSessionScheduleApplicationMapper.toDto(
                updated,
            ),
        );
    }
}
