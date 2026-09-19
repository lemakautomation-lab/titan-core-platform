import { Result } from "../common/result";
import { TrainerSessionScheduleDto } from "../dto/trainer/trainer-session-schedule.dto";
import { TrainerSessionScheduleApplicationMapper } from "../mappers/trainer-session-schedule.mapper";
import { ListTrainerSessionSchedulesQuery } from "../queries/trainer/list-trainer-session-schedules.query";

import { AthleteRelationshipType } from "../../domain/enums/athlete-relationship-type.enum";
import { AthleteRepository } from "../../domain/repositories/athlete.repository";
import { AthleteRelationshipRepository } from "../../domain/repositories/athlete-relationship.repository";
import { TrainerSessionScheduleRepository } from "../../domain/repositories/trainer-session-schedule.repository";

import { GetMyTrainerAccessUseCase } from "./get-my-trainer-access.use-case";

export class ListTrainerSessionSchedulesUseCase {

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
        query: Readonly<ListTrainerSessionSchedulesQuery>,
    ): Promise<Result<TrainerSessionScheduleDto[]>> {

        if (
            Number.isNaN(query.startsFrom.getTime()) ||
            Number.isNaN(query.startsBefore.getTime()) ||
            query.startsFrom >= query.startsBefore
        ) {
            return Result.failure(
                "Session schedule date range is invalid.",
            );
        }

        const access = await this.trainerAccess.execute({
            userId: query.userId,
            tenantId: query.tenantId,
        });

        if (!access.isSuccess || !access.value?.accessGranted) {
            return Result.failure(
                "Active Trainer access is required.",
            );
        }

        if (query.athleteId) {
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

            const relationship =
                await this.relationshipRepository
                    .findByAthleteAndRelatedEntity(
                        query.athleteId,
                        query.userId,
                        AthleteRelationshipType.TRAINER,
                        query.tenantId,
                    );

            if (!relationship || !relationship.isActive()) {
                return Result.failure(
                    "Active Trainer client relationship is required.",
                );
            }
        }

        const schedules =
            await this.scheduleRepository.listForTrainer(
                query.tenantId,
                query.userId,
                query.startsFrom,
                query.startsBefore,
                query.athleteId,
            );

        return Result.success(
            schedules.map(
                TrainerSessionScheduleApplicationMapper.toDto,
            ),
        );
    }
}
