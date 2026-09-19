import { TrainerSessionSchedule as PrismaTrainerSessionSchedule } from "../../generated/prisma/client";
import { TrainerSessionSchedule } from "../../domain/entities/trainer-session-schedule.entity";
import { TrainerSessionScheduleStatus } from "../../domain/enums/trainer-session-schedule-status.enum";

export class TrainerSessionScheduleMapper {

    static toDomain(
        record: PrismaTrainerSessionSchedule,
    ): TrainerSessionSchedule {

        return new TrainerSessionSchedule(
            record.id,
            record.tenantId,
            record.trainerUserId,
            record.athleteId,
            record.title,
            record.notes,
            record.startsAt,
            record.endsAt,
            record.status as TrainerSessionScheduleStatus,
            record.createdAt,
            record.updatedAt,
        );
    }

    static toPersistence(
        schedule: TrainerSessionSchedule,
    ) {
        return {
            id: schedule.id,
            tenantId: schedule.tenantId,
            trainerUserId: schedule.trainerUserId,
            athleteId: schedule.athleteId,
            title: schedule.title,
            notes: schedule.notes,
            startsAt: schedule.startsAt,
            endsAt: schedule.endsAt,
            status: schedule.status,
            createdAt: schedule.createdAt,
            updatedAt: schedule.updatedAt,
        };
    }

}
