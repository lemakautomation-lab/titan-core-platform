import { ExercisePrescriptionProfile } from "../entities/exercise-prescription-profile.entity";
import { ProgrammeGoalClassification } from "../enums/programme-goal-classification.enum";
import { TrainingExperienceLevel } from "../enums/training-experience-level.enum";

export interface ExercisePrescriptionProfileRepository {
    create(
        profile: ExercisePrescriptionProfile,
    ): Promise<ExercisePrescriptionProfile>;

    findById(
        id: string,
        tenantId: string,
    ): Promise<ExercisePrescriptionProfile | null>;

    findActiveExact(
        tenantId: string,
        exerciseId: string,
        goalClassification: ProgrammeGoalClassification,
        trainingExperience: TrainingExperienceLevel,
    ): Promise<ExercisePrescriptionProfile | null>;
}
