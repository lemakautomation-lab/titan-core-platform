import { WorkoutProgramme } from "../../domain/entities/workout-programme.entity";
import { WorkoutProgrammeStructure } from "../../domain/entities/workout-programme-structure.entity";

export interface GeneratedWorkoutProgrammeReadModel {
    readonly generationId: string;
    readonly programme: WorkoutProgramme;
    readonly structure: WorkoutProgrammeStructure;
}

export interface GeneratedWorkoutProgrammeReadRepository {
    findCompleteByGenerationId(
        generationId: string,
        tenantId: string,
    ): Promise<GeneratedWorkoutProgrammeReadModel | null>;
}
