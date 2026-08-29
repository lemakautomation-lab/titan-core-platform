import { randomUUID } from "crypto";

import { RecordStatus } from "../enums/record-status.enum";

export class WorkoutProgramme {

    constructor(

        public readonly id: string,

        public readonly tenantId: string,

        public readonly athleteId: string,

        public name: string,

        public description: string | null,

        public goal: string,

        public experience: string,

        public trainingFrequency: number,

        public sessionDurationMinutes: number,

        public sportId: string | null,

        public status: RecordStatus,

        public readonly createdAt: Date,

        public updatedAt: Date,

    ) {}

    static create(
        tenantId: string,
        athleteId: string,
        name: string,
        description: string | null,
        goal: string,
        experience: string,
        trainingFrequency: number,
        sessionDurationMinutes: number,
        sportId: string | null,
    ): WorkoutProgramme {

        const now = new Date();

        return new WorkoutProgramme(
            randomUUID(),
            tenantId,
            athleteId,
            name,
            description,
            goal,
            experience,
            trainingFrequency,
            sessionDurationMinutes,
            sportId,
            RecordStatus.ACTIVE,
            now,
            now,
        );
    }

    updateDetails(
        name: string,
        description: string | null,
        goal: string,
        experience: string,
        trainingFrequency: number,
        sessionDurationMinutes: number,
        sportId: string | null,
    ): void {

        this.name = name;
        this.description = description;
        this.goal = goal;
        this.experience = experience;
        this.trainingFrequency = trainingFrequency;
        this.sessionDurationMinutes = sessionDurationMinutes;
        this.sportId = sportId;
        this.updatedAt = new Date();
    }

    activate(): void {

        this.status = RecordStatus.ACTIVE;
        this.updatedAt = new Date();
    }

    deactivate(): void {

        this.status = RecordStatus.INACTIVE;
        this.updatedAt = new Date();
    }

    suspend(): void {

        this.status = RecordStatus.SUSPENDED;
        this.updatedAt = new Date();
    }

    delete(): void {

        this.status = RecordStatus.DELETED;
        this.updatedAt = new Date();
    }

    isActive(): boolean {

        return this.status === RecordStatus.ACTIVE;
    }
}
