import { ExercisePrescriptionMode } from "../enums/exercise-prescription-mode.enum";
import { ProgrammeExercisePrescriptionCandidate } from "./programme-exercise-prescription-candidate.value-object";

export class GeneratedProgrammePrescriptionPlan {
    private constructor(
        public readonly ordinal: number,
        public readonly exerciseId: string,
        public readonly profileId: string,
        public readonly profileVersion: number,
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

    static fromCandidate(
        ordinal: unknown,
        candidate: ProgrammeExercisePrescriptionCandidate,
    ): GeneratedProgrammePrescriptionPlan {
        if (!Number.isSafeInteger(ordinal) || (ordinal as number) < 1) {
            throw new Error("Prescription ordinal must be a positive safe integer.");
        }

        if (!(candidate instanceof ProgrammeExercisePrescriptionCandidate)) {
            throw new Error("Prescription-ready Exercise candidate is required.");
        }

        return new GeneratedProgrammePrescriptionPlan(
            ordinal as number,
            candidate.exerciseId,
            candidate.profileId,
            candidate.profileVersion,
            candidate.prescriptionMode,
            candidate.sets,
            candidate.repetitions,
            candidate.durationSeconds,
            candidate.restSeconds,
            candidate.estimatedSetDurationSeconds,
            candidate.approximatePrescriptionSeconds,
        );
    }
}
