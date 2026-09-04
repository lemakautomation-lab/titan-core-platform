import { ProgrammeExerciseEligibilityCriteria } from "../value-objects/programme-exercise-eligibility-criteria.value-object";
import { ProgrammeExercisePrescriptionCandidate } from "../value-objects/programme-exercise-prescription-candidate.value-object";

export interface ProgrammeExercisePrescriptionCandidateRepository {
    findReadyForProgramme(
        criteria: ProgrammeExerciseEligibilityCriteria,
    ): Promise<readonly ProgrammeExercisePrescriptionCandidate[]>;
}
