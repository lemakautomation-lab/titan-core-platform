import { TrainerSessionSchedule } from "../entities/trainer-session-schedule.entity";

export interface TrainerSessionScheduleRepository {

    findById(
        id: string,
        tenantId: string,
    ): Promise<TrainerSessionSchedule | null>;

    findConflicting(
        tenantId: string,
        trainerUserId: string,
        athleteId: string,
        startsAt: Date,
        endsAt: Date,
        excludeId?: string,
    ): Promise<TrainerSessionSchedule | null>;

    listForTrainer(
        tenantId: string,
        trainerUserId: string,
        startsFrom: Date,
        startsBefore: Date,
        athleteId?: string,
    ): Promise<TrainerSessionSchedule[]>;
    create(
        schedule: TrainerSessionSchedule,
    ): Promise<TrainerSessionSchedule>;

    update(
        schedule: TrainerSessionSchedule,
    ): Promise<TrainerSessionSchedule>;

}


