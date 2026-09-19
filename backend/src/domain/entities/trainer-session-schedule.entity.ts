import { randomUUID } from "crypto";
import { TrainerSessionScheduleStatus } from "../enums/trainer-session-schedule-status.enum";

export class TrainerSessionSchedule {

    constructor(
        public readonly id: string,
        public readonly tenantId: string,
        public readonly trainerUserId: string,
        public readonly athleteId: string,
        public title: string,
        public notes: string | null,
        public startsAt: Date,
        public endsAt: Date,
        public status: TrainerSessionScheduleStatus,
        public readonly createdAt: Date,
        public updatedAt: Date,
    ) {}

    static create(
        tenantId: string,
        trainerUserId: string,
        athleteId: string,
        title: string,
        notes: string | null,
        startsAt: Date,
        endsAt: Date,
        now: Date = new Date(),
    ): TrainerSessionSchedule {

        const schedule = new TrainerSessionSchedule(
            randomUUID(),
            tenantId,
            trainerUserId,
            athleteId,
            "",
            null,
            new Date(startsAt),
            new Date(endsAt),
            TrainerSessionScheduleStatus.SCHEDULED,
            now,
            now,
        );

        schedule.updateDetails(
            title,
            notes,
            startsAt,
            endsAt,
            now,
        );

        return schedule;
    }

    updateDetails(
        title: string,
        notes: string | null,
        startsAt: Date,
        endsAt: Date,
        now: Date = new Date(),
    ): void {

        const cleanedTitle = title.trim();

        if (
            cleanedTitle.length === 0 ||
            cleanedTitle.length > 200
        ) {
            throw new Error(
                "Session title is invalid.",
            );
        }

        const cleanedNotes =
            notes === null ? null : notes.trim();

        if (
            cleanedNotes !== null &&
            cleanedNotes.length > 2000
        ) {
            throw new Error(
                "Session notes exceed maximum length.",
            );
        }

        if (
            Number.isNaN(startsAt.getTime()) ||
            Number.isNaN(endsAt.getTime()) ||
            startsAt >= endsAt
        ) {
            throw new Error(
                "Session time range is invalid.",
            );
        }

        this.title = cleanedTitle;
        this.notes =
            cleanedNotes === "" ? null : cleanedNotes;
        this.startsAt = new Date(startsAt);
        this.endsAt = new Date(endsAt);
        this.updatedAt = new Date(now);
    }

}
