import { ExercisePrescriptionProfile as PrismaExercisePrescriptionProfile } from "../../generated/prisma/client";

import { ExercisePrescriptionProfile } from "../../domain/entities/exercise-prescription-profile.entity";
import { ExercisePrescriptionMode } from "../../domain/enums/exercise-prescription-mode.enum";
import { ProgrammeGoalClassification } from "../../domain/enums/programme-goal-classification.enum";
import { RecordStatus } from "../../domain/enums/record-status.enum";
import { TrainingExperienceLevel } from "../../domain/enums/training-experience-level.enum";

export class ExercisePrescriptionProfileMapper {
    static toDomain(
        profile: PrismaExercisePrescriptionProfile,
    ): ExercisePrescriptionProfile {
        return ExercisePrescriptionProfile.restore(
            profile.id,
            profile.tenantId,
            profile.exerciseId,
            profile.goalClassification as ProgrammeGoalClassification,
            profile.trainingExperience as TrainingExperienceLevel,
            profile.version,
            profile.prescriptionMode as ExercisePrescriptionMode,
            profile.defaultSets,
            profile.defaultRepetitions,
            profile.defaultDurationSeconds,
            profile.defaultRestSeconds,
            profile.estimatedSetDurationSeconds,
            profile.status as RecordStatus,
            profile.createdAt,
            profile.updatedAt,
        );
    }

    static toPersistence(profile: ExercisePrescriptionProfile) {
        return {
            id: profile.id,
            tenantId: profile.tenantId,
            exerciseId: profile.exerciseId,
            goalClassification: profile.goalClassification,
            trainingExperience: profile.trainingExperience,
            version: profile.version,
            prescriptionMode: profile.prescriptionMode,
            defaultSets: profile.defaultSets,
            defaultRepetitions: profile.defaultRepetitions,
            defaultDurationSeconds: profile.defaultDurationSeconds,
            defaultRestSeconds: profile.defaultRestSeconds,
            estimatedSetDurationSeconds:
                profile.estimatedSetDurationSeconds,
            status: profile.status,
        };
    }
}
