import { ExercisePrescriptionProfile } from "../entities/exercise-prescription-profile.entity";
import { ExercisePrescriptionMode } from "../enums/exercise-prescription-mode.enum";
import { ProgrammeGoalClassification } from "../enums/programme-goal-classification.enum";
import { TrainingExperienceLevel } from "../enums/training-experience-level.enum";

export class ProgrammeExercisePrescriptionCandidate {
    private constructor(
        public readonly exerciseId: string,
        public readonly profileId: string,
        public readonly profileVersion: number,
        public readonly goalClassification: ProgrammeGoalClassification,
        public readonly trainingExperience: TrainingExperienceLevel,
        public readonly prescriptionMode: ExercisePrescriptionMode,
        public readonly sets: number,
        public readonly repetitions: number | null,
        public readonly durationSeconds: number | null,
        public readonly restSeconds: number,
        public readonly estimatedSetDurationSeconds: number | null,
        public readonly approximatePrescriptionSeconds: number,
    ) {
        Object.freeze(this);
    }

    static fromProfile(
        exerciseId: unknown,
        profile: ExercisePrescriptionProfile,
    ): ProgrammeExercisePrescriptionCandidate {
        const normalizedExerciseId = this.requireIdentifier(
            exerciseId,
            "Exercise ID",
        );

        if (!(profile instanceof ExercisePrescriptionProfile)) {
            throw new Error("Exercise prescription profile is required.");
        }

        if (profile.exerciseId !== normalizedExerciseId) {
            throw new Error("Prescription profile Exercise does not match.");
        }

        const approximatePrescriptionSeconds =
            profile.approximatePrescriptionSeconds;

        if (
            !Number.isSafeInteger(approximatePrescriptionSeconds) ||
            approximatePrescriptionSeconds < 1
        ) {
            throw new Error(
                "Approximate prescription time must be a positive safe integer.",
            );
        }

        return new ProgrammeExercisePrescriptionCandidate(
            normalizedExerciseId,
            this.requireIdentifier(profile.id, "Profile ID"),
            this.requirePositiveSafeInteger(
                profile.version,
                "Profile version",
            ),
            profile.goalClassification,
            profile.trainingExperience,
            profile.prescriptionMode,
            this.requirePositiveSafeInteger(profile.defaultSets, "Sets"),
            profile.defaultRepetitions,
            profile.defaultDurationSeconds,
            this.requireNonNegativeSafeInteger(
                profile.defaultRestSeconds,
                "Rest seconds",
            ),
            profile.estimatedSetDurationSeconds,
            approximatePrescriptionSeconds,
        );
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

    private static requirePositiveSafeInteger(
        value: unknown,
        field: string,
    ): number {
        if (
            typeof value !== "number" ||
            !Number.isSafeInteger(value) ||
            value < 1
        ) {
            throw new Error(`${field} must be a positive safe integer.`);
        }

        return value;
    }

    private static requireNonNegativeSafeInteger(
        value: unknown,
        field: string,
    ): number {
        if (
            typeof value !== "number" ||
            !Number.isSafeInteger(value) ||
            value < 0
        ) {
            throw new Error(`${field} must be a non-negative safe integer.`);
        }

        return value;
    }
}
