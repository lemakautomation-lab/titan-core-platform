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

        WorkoutProgramme.validateRequiredText(
            name,
            "Programme name",
        );

        WorkoutProgramme.validateRequiredText(
            goal,
            "Programme goal",
        );

        WorkoutProgramme.validateRequiredText(
            experience,
            "Programme experience",
        );

        WorkoutProgramme.validatePositiveInteger(
            trainingFrequency,
            "Training frequency",
        );

        WorkoutProgramme.validatePositiveInteger(
            sessionDurationMinutes,
            "Session duration",
        );

        const now = new Date();

        return new WorkoutProgramme(
            randomUUID(),
            tenantId,
            athleteId,
            name.trim(),
            description?.trim() || null,
            goal.trim(),
            experience.trim(),
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

        this.ensureMutable();

        WorkoutProgramme.validateRequiredText(
            name,
            "Programme name",
        );

        WorkoutProgramme.validateRequiredText(
            goal,
            "Programme goal",
        );

        WorkoutProgramme.validateRequiredText(
            experience,
            "Programme experience",
        );

        WorkoutProgramme.validatePositiveInteger(
            trainingFrequency,
            "Training frequency",
        );

        WorkoutProgramme.validatePositiveInteger(
            sessionDurationMinutes,
            "Session duration",
        );

        this.name = name.trim();
        this.description = description?.trim() || null;
        this.goal = goal.trim();
        this.experience = experience.trim();
        this.trainingFrequency = trainingFrequency;
        this.sessionDurationMinutes = sessionDurationMinutes;
        this.sportId = sportId;
        this.updatedAt = new Date();
    }

    activate(): void {

        if (this.status === RecordStatus.DELETED) {
            throw new Error(
                "Deleted workout programmes cannot be activated.",
            );
        }

        this.status = RecordStatus.ACTIVE;
        this.updatedAt = new Date();
    }

    deactivate(): void {

        if (this.status === RecordStatus.DELETED) {
            throw new Error(
                "Deleted workout programmes cannot be deactivated.",
            );
        }

        this.status = RecordStatus.INACTIVE;
        this.updatedAt = new Date();
    }

    suspend(): void {

        if (this.status === RecordStatus.DELETED) {
            throw new Error(
                "Deleted workout programmes cannot be suspended.",
            );
        }

        this.status = RecordStatus.SUSPENDED;
        this.updatedAt = new Date();
    }

    delete(): void {

        if (this.status === RecordStatus.DELETED) {
            throw new Error(
                "Workout Programme is already deleted.",
            );
        }

        this.status = RecordStatus.DELETED;
        this.updatedAt = new Date();
    }

    isActive(): boolean {

        return this.status === RecordStatus.ACTIVE;
    }

    private ensureMutable(): void {

        if (this.status === RecordStatus.DELETED) {
            throw new Error(
                "Deleted workout programmes cannot be modified.",
            );
        }
    }

    private static validateRequiredText(
        value: string,
        field: string,
    ): void {

        if (
            typeof value !== "string" ||
            value.trim().length === 0
        ) {
            throw new Error(
                `${field} is required.`,
            );
        }
    }

    private static validatePositiveInteger(
        value: number,
        field: string,
    ): void {

        if (
            !Number.isInteger(value) ||
            value <= 0
        ) {
            throw new Error(
                `${field} must be a positive integer.`,
            );
        }
    }
}
