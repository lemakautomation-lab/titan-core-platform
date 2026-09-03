import { randomUUID } from "crypto";

import { ExercisePrescriptionMode } from "../enums/exercise-prescription-mode.enum";
import { ProgrammeGoalClassification } from "../enums/programme-goal-classification.enum";
import { RecordStatus } from "../enums/record-status.enum";
import { TrainingExperienceLevel } from "../enums/training-experience-level.enum";

export interface ExercisePrescriptionProfileProperties {
    tenantId: unknown;
    exerciseId: unknown;
    goalClassification: unknown;
    trainingExperience: unknown;
    version: unknown;
    prescriptionMode: unknown;
    defaultSets: unknown;
    defaultRepetitions: unknown;
    defaultDurationSeconds: unknown;
    defaultRestSeconds: unknown;
    estimatedSetDurationSeconds: unknown;
    status?: unknown;
}

export class ExercisePrescriptionProfile {
    private constructor(
        public readonly id: string,
        public readonly tenantId: string,
        public readonly exerciseId: string,
        public readonly goalClassification: ProgrammeGoalClassification,
        public readonly trainingExperience: TrainingExperienceLevel,
        public readonly version: number,
        public readonly prescriptionMode: ExercisePrescriptionMode,
        public readonly defaultSets: number,
        public readonly defaultRepetitions: number | null,
        public readonly defaultDurationSeconds: number | null,
        public readonly defaultRestSeconds: number,
        public readonly estimatedSetDurationSeconds: number | null,
        public readonly status: RecordStatus,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) {
        Object.freeze(this);
    }

    static create(
        properties: ExercisePrescriptionProfileProperties,
    ): ExercisePrescriptionProfile {
        const now = new Date();

        return this.restore(
            randomUUID(),
            properties.tenantId,
            properties.exerciseId,
            properties.goalClassification,
            properties.trainingExperience,
            properties.version,
            properties.prescriptionMode,
            properties.defaultSets,
            properties.defaultRepetitions,
            properties.defaultDurationSeconds,
            properties.defaultRestSeconds,
            properties.estimatedSetDurationSeconds,
            properties.status ?? RecordStatus.INACTIVE,
            now,
            now,
        );
    }

    static restore(
        id: unknown,
        tenantId: unknown,
        exerciseId: unknown,
        goalClassification: unknown,
        trainingExperience: unknown,
        version: unknown,
        prescriptionMode: unknown,
        defaultSets: unknown,
        defaultRepetitions: unknown,
        defaultDurationSeconds: unknown,
        defaultRestSeconds: unknown,
        estimatedSetDurationSeconds: unknown,
        status: unknown,
        createdAt: Date,
        updatedAt: Date,
    ): ExercisePrescriptionProfile {
        const normalizedId = this.requireIdentifier(id, "Profile ID");
        const normalizedTenantId = this.requireIdentifier(
            tenantId,
            "Tenant ID",
        );
        const normalizedExerciseId = this.requireIdentifier(
            exerciseId,
            "Exercise ID",
        );
        const goal = this.requireEnum(
            goalClassification,
            ProgrammeGoalClassification,
            "Goal classification",
        );
        const experience = this.requireEnum(
            trainingExperience,
            TrainingExperienceLevel,
            "Training experience",
        );
        const mode = this.requireEnum(
            prescriptionMode,
            ExercisePrescriptionMode,
            "Prescription mode",
        );
        const normalizedVersion = this.requirePositiveInteger(
            version,
            "Profile version",
        );
        const sets = this.requirePositiveInteger(
            defaultSets,
            "Default sets",
        );
        const rest = this.requireNonNegativeInteger(
            defaultRestSeconds,
            "Default rest",
        );
        const lifecycle = this.requireEnum(
            status,
            RecordStatus,
            "Profile status",
        );

        let repetitions: number | null;
        let duration: number | null;
        let estimatedSetDuration: number | null;

        if (mode === ExercisePrescriptionMode.REPETITIONS) {
            repetitions = this.requirePositiveInteger(
                defaultRepetitions,
                "Default repetitions",
            );
            estimatedSetDuration = this.requirePositiveInteger(
                estimatedSetDurationSeconds,
                "Estimated set duration",
            );
            this.requireAbsent(
                defaultDurationSeconds,
                "Default duration",
            );
            duration = null;
        } else {
            duration = this.requirePositiveInteger(
                defaultDurationSeconds,
                "Default duration",
            );
            this.requireAbsent(
                defaultRepetitions,
                "Default repetitions",
            );
            this.requireAbsent(
                estimatedSetDurationSeconds,
                "Estimated set duration",
            );
            repetitions = null;
            estimatedSetDuration = null;
        }

        const workSeconds = mode === ExercisePrescriptionMode.REPETITIONS
            ? sets * estimatedSetDuration!
            : sets * duration!;
        const approximateSeconds = workSeconds + (sets - 1) * rest;

        if (
            !Number.isSafeInteger(approximateSeconds) ||
            approximateSeconds <= 0
        ) {
            throw new Error(
                "Approximate prescription time must be a finite positive integer.",
            );
        }

        return new ExercisePrescriptionProfile(
            normalizedId,
            normalizedTenantId,
            normalizedExerciseId,
            goal,
            experience,
            normalizedVersion,
            mode,
            sets,
            repetitions,
            duration,
            rest,
            estimatedSetDuration,
            lifecycle,
            createdAt,
            updatedAt,
        );
    }

    get approximatePrescriptionSeconds(): number {
        const workSeconds = this.prescriptionMode ===
            ExercisePrescriptionMode.REPETITIONS
            ? this.defaultSets * this.estimatedSetDurationSeconds!
            : this.defaultSets * this.defaultDurationSeconds!;

        return workSeconds +
            (this.defaultSets - 1) * this.defaultRestSeconds;
    }

    isActive(): boolean {
        return this.status === RecordStatus.ACTIVE;
    }

    private static requireIdentifier(value: unknown, field: string): string {
        if (typeof value !== "string" || !value.trim()) {
            throw new Error(`${field} is required.`);
        }

        const normalized = value.trim();
        const semantic = normalized.toLocaleLowerCase("en-US");

        if (semantic === "null" || semantic === "undefined") {
            throw new Error(`${field} is required.`);
        }

        return normalized;
    }

    private static requirePositiveInteger(value: unknown, field: string): number {
        if (
            typeof value !== "number" ||
            !Number.isSafeInteger(value) ||
            value < 1
        ) {
            throw new Error(`${field} must be a positive integer.`);
        }

        return value;
    }

    private static requireNonNegativeInteger(
        value: unknown,
        field: string,
    ): number {
        if (
            typeof value !== "number" ||
            !Number.isSafeInteger(value) ||
            value < 0
        ) {
            throw new Error(`${field} must be a non-negative integer.`);
        }

        return value;
    }

    private static requireAbsent(value: unknown, field: string): void {
        if (value !== null && value !== undefined) {
            throw new Error(`${field} must be absent for this mode.`);
        }
    }

    private static requireEnum<T extends string>(
        value: unknown,
        values: Record<string, T>,
        field: string,
    ): T {
        if (
            typeof value !== "string" ||
            !Object.values(values).includes(value as T)
        ) {
            throw new Error(`${field} is invalid.`);
        }

        return value as T;
    }
}
