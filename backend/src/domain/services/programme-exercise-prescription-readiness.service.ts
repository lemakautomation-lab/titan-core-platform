import { Exercise } from "../entities/exercise.entity";
import { ExercisePrescriptionProfile } from "../entities/exercise-prescription-profile.entity";
import { RecordStatus } from "../enums/record-status.enum";
import { ProgrammeExerciseEligibilityCriteria } from "../value-objects/programme-exercise-eligibility-criteria.value-object";
import { ProgrammeExercisePrescriptionCandidate } from "../value-objects/programme-exercise-prescription-candidate.value-object";

export class ProgrammeExercisePrescriptionReadinessService {
    static createCandidates(
        criteria: ProgrammeExerciseEligibilityCriteria,
        eligibleExercises: readonly Exercise[],
        profiles: readonly ExercisePrescriptionProfile[],
    ): readonly ProgrammeExercisePrescriptionCandidate[] {
        if (!(criteria instanceof ProgrammeExerciseEligibilityCriteria)) {
            throw new Error("Programme Exercise eligibility criteria are required.");
        }

        if (!Array.isArray(eligibleExercises) || !Array.isArray(profiles)) {
            throw new Error("Prescription readiness inputs are invalid.");
        }

        const exerciseIds = new Set<string>();
        for (const exercise of eligibleExercises) {
            if (!(exercise instanceof Exercise)) {
                throw new Error("Eligible Exercise data are invalid.");
            }
            if (
                exercise.tenantId !== criteria.tenantId ||
                exercise.status !== RecordStatus.ACTIVE
            ) {
                throw new Error("Eligible Exercise snapshot is invalid.");
            }
            if (exerciseIds.has(exercise.id)) {
                throw new Error("Duplicate eligible Exercise identity.");
            }
            exerciseIds.add(exercise.id);
        }

        const candidateExerciseIds = new Set<string>();
        const profileIds = new Set<string>();
        const candidates: ProgrammeExercisePrescriptionCandidate[] = [];

        for (const profile of profiles) {
            if (!(profile instanceof ExercisePrescriptionProfile)) {
                throw new Error("Exercise prescription profile data are invalid.");
            }
            if (
                profile.tenantId !== criteria.tenantId ||
                profile.status !== RecordStatus.ACTIVE ||
                profile.goalClassification !== criteria.goal.classification ||
                profile.trainingExperience !== criteria.trainingExperience ||
                !exerciseIds.has(profile.exerciseId)
            ) {
                throw new Error("Prescription profile is outside the readiness scope.");
            }
            if (profileIds.has(profile.id)) {
                throw new Error("Duplicate prescription profile identity.");
            }
            if (candidateExerciseIds.has(profile.exerciseId)) {
                throw new Error("Ambiguous active prescription profiles.");
            }

            profileIds.add(profile.id);
            candidateExerciseIds.add(profile.exerciseId);
            candidates.push(
                ProgrammeExercisePrescriptionCandidate.fromProfile(
                    profile.exerciseId,
                    profile,
                ),
            );
        }

        candidates.sort((left, right) =>
            left.exerciseId < right.exerciseId
                ? -1
                : left.exerciseId > right.exerciseId
                    ? 1
                    : 0,
        );

        return Object.freeze([...candidates]);
    }
}
