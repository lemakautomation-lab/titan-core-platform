import { WorkoutProgrammeStructure } from "../entities/workout-programme-structure.entity";

export interface WorkoutProgrammeStructureRepository {
    persistInitialStructure(
        structure: WorkoutProgrammeStructure,
    ): Promise<WorkoutProgrammeStructure>;

    findByProgrammeId(
        programmeId: string,
        tenantId: string,
    ): Promise<WorkoutProgrammeStructure | null>;
}
