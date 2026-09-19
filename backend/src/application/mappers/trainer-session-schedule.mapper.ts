import { TrainerSessionSchedule } from "../../domain/entities/trainer-session-schedule.entity";
import { TrainerSessionScheduleDto } from "../dto/trainer/trainer-session-schedule.dto";

export class TrainerSessionScheduleApplicationMapper {

    static toDto(
        schedule: TrainerSessionSchedule,
    ): TrainerSessionScheduleDto {

        return new TrainerSessionScheduleDto(
            schedule.id,
            schedule.tenantId,
            schedule.trainerUserId,
            schedule.athleteId,
            schedule.title,
            schedule.notes,
            schedule.startsAt,
            schedule.endsAt,
            schedule.status,
            schedule.createdAt,
            schedule.updatedAt,
        );
    }

}
