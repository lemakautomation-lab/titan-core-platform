import { TrainerSessionScheduleStatus } from "../../../domain/enums/trainer-session-schedule-status.enum";

export class TrainerSessionScheduleDto {
    constructor(
        public readonly id: string,
        public readonly tenantId: string,
        public readonly trainerUserId: string,
        public readonly athleteId: string,
        public readonly title: string,
        public readonly notes: string | null,
        public readonly startsAt: Date,
        public readonly endsAt: Date,
        public readonly status: TrainerSessionScheduleStatus,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) {}
}
