import { Result } from "../common/result";
import { UpdateTrainerSessionWorkflowCommand } from "../commands/update-trainer-session-workflow.command";
import { TrainerSessionScheduleDto } from "../dto/trainer/trainer-session-schedule.dto";
import { TrainerSessionScheduleApplicationMapper } from "../mappers/trainer-session-schedule.mapper";

import { AthleteRelationshipType } from "../../domain/enums/athlete-relationship-type.enum";
import { TrainerSessionScheduleStatus } from "../../domain/enums/trainer-session-schedule-status.enum";
import { AthleteRelationshipRepository } from "../../domain/repositories/athlete-relationship.repository";
import { TrainerSessionScheduleRepository } from "../../domain/repositories/trainer-session-schedule.repository";

import { GetMyTrainerAccessUseCase } from "./get-my-trainer-access.use-case";

export class UpdateTrainerSessionWorkflowUseCase {
    constructor(
        private readonly scheduleRepository:
            TrainerSessionScheduleRepository,
        private readonly relationshipRepository:
            AthleteRelationshipRepository,
        private readonly trainerAccess:
            GetMyTrainerAccessUseCase,
    ) {}

    async execute(
        command: Readonly<UpdateTrainerSessionWorkflowCommand>,
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

        try {
            if (
                command.status ===
                TrainerSessionScheduleStatus.COMPLETED
            ) {
                schedule.complete(now);
            }
            else if (
                command.status ===
                TrainerSessionScheduleStatus.CANCELLED
            ) {
                schedule.cancel(now);
            }
            else {
                return Result.failure(
                    "Trainer session workflow status is invalid.",
                );
            }
        }
        catch (error) {
            return Result.failure(
                error instanceof Error
                    ? error.message
                    : "Trainer session workflow transition is invalid.",
            );
        }

        const updated =
            await this.scheduleRepository.update(schedule);

        return Result.success(
            TrainerSessionScheduleApplicationMapper.toDto(
                updated,
            ),
        );
    }
}
