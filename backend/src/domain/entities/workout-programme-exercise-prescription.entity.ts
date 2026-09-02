import { randomUUID } from "crypto";

export class WorkoutProgrammeExercisePrescription {
    private constructor(
        public readonly id: string,
        public readonly tenantId: string,
        public readonly sessionId: string,
        public readonly exerciseId: string,
        public readonly ordinal: number,
        public readonly sets: number,
        public readonly repetitions: number | null,
        public readonly durationSeconds: number | null,
        public readonly restSeconds: number | null,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) {
        Object.freeze(this);
    }

    static create(
        tenantId: string,
        sessionId: string,
        exerciseId: string,
        ordinal: number,
        sets: number,
        repetitions: number | null,
        durationSeconds: number | null,
        restSeconds: number | null,
    ): WorkoutProgrammeExercisePrescription {
        const now = new Date();

        return this.restore(
            randomUUID(),
            tenantId,
            sessionId,
            exerciseId,
            ordinal,
            sets,
            repetitions,
            durationSeconds,
            restSeconds,
            now,
            now,
        );
    }

    static restore(
        id: string,
        tenantId: string,
        sessionId: string,
        exerciseId: string,
        ordinal: number,
        sets: number,
        repetitions: number | null,
        durationSeconds: number | null,
        restSeconds: number | null,
        createdAt: Date,
        updatedAt: Date,
    ): WorkoutProgrammeExercisePrescription {
        this.requireIdentifier(id, "Prescription ID");
        this.requireIdentifier(tenantId, "Tenant ID");
        this.requireIdentifier(sessionId, "Session ID");
        this.requireIdentifier(exerciseId, "Exercise ID");
        this.requirePositiveInteger(ordinal, "Prescription ordinal");
        this.requirePositiveInteger(sets, "Prescription sets");

        const hasRepetitions = repetitions !== null;
        const hasDuration = durationSeconds !== null;

        if (hasRepetitions === hasDuration) {
            throw new Error(
                "Prescription requires exactly one repetitions or duration mode.",
            );
        }

        if (repetitions !== null) {
            this.requirePositiveInteger(
                repetitions,
                "Prescription repetitions",
            );
        }

        if (durationSeconds !== null) {
            this.requirePositiveInteger(
                durationSeconds,
                "Prescription duration",
            );
        }

        if (
            restSeconds !== null &&
            (!Number.isInteger(restSeconds) || restSeconds < 0)
        ) {
            throw new Error(
                "Prescription rest must be a non-negative integer.",
            );
        }

        return new WorkoutProgrammeExercisePrescription(
            id.trim(),
            tenantId.trim(),
            sessionId.trim(),
            exerciseId.trim(),
            ordinal,
            sets,
            repetitions,
            durationSeconds,
            restSeconds,
            createdAt,
            updatedAt,
        );
    }

    private static requireIdentifier(value: string, field: string): void {
        if (typeof value !== "string" || !value.trim()) {
            throw new Error(`${field} is required.`);
        }
    }

    private static requirePositiveInteger(value: number, field: string): void {
        if (!Number.isInteger(value) || value < 1) {
            throw new Error(`${field} must be a positive integer.`);
        }
    }
}
