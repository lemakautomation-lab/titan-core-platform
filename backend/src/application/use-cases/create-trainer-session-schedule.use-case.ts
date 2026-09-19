import { Result } from "../common/result";
import { CreateTrainerSessionScheduleCommand } from "../commands/create-trainer-session-schedule.command";
import { TrainerSessionScheduleDto } from "../dto/trainer/trainer-session-schedule.dto";
import { TrainerSessionScheduleApplicationMapper } from "../mappers/trainer-session-schedule.mapper";

import { TrainerSessionSchedule } from "../../domain/entities/trainer-session-schedule.entity";
import { AthleteRelationshipType } from "../../domain/enums/athlete-relationship-type.enum";
import { AthleteRepository } from "../../domain/repositories/athlete.repository";
import { AthleteRelationshipRepository } from "../../domain/repositories/athlete-relationship.repository";
import { TrainerSessionScheduleRepository } from "../../domain/repositories/trainer-session-schedule.repository";

import { GetMyTrainerAccessUseCase } from "./get-my-trainer-access.use-case";

export class CreateTrainerSessionScheduleUseCase {

    constructor(
        private readonly scheduleRepository:
            TrainerSessionScheduleRepository,
        private readonly athleteRepository:
            AthleteRepository,
        private readonly relationshipRepository:
            AthleteRelationshipRepository,
        private readonly trainerAccess:
            GetMyTrainerAccessUseCase,
    ) {}

    async execute(
        command: Readonly<CreateTrainerSessionScheduleCommand>,
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
                command.athleteId,
                command.startsAt,
                command.endsAt,
            );

        if (conflict) {
            return Result.failure(
                "Session conflicts with an existing Trainer or Athlete session.",
            );
        }

        let schedule: TrainerSessionSchedule;

        try {
            schedule = TrainerSessionSchedule.create(
                command.tenantId,
                command.userId,
                command.athleteId,
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

        const created =
            await this.scheduleRepository.create(
                schedule,
            );

        return Result.success(
            TrainerSessionScheduleApplicationMapper.toDto(
                created,
            ),
        );
    }

}
