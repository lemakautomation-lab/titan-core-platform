import { WorkoutProgramme } from "../entities/workout-programme.entity";

export interface WorkoutProgrammeListResult {
    items: WorkoutProgramme[];
    total: number;
}

export interface WorkoutProgrammeRepository {

    findById(
        id: string,
        tenantId: string,
    ): Promise<WorkoutProgramme | null>;

    findAll(
        tenantId: string,
        pagination: {
            page: number;
            pageSize: number;
        },
    ): Promise<WorkoutProgrammeListResult>;

    findAllByAthleteId(
        athleteId: string,
        tenantId: string,
    ): Promise<WorkoutProgramme[]>;

    create(
        programme: WorkoutProgramme,
    ): Promise<WorkoutProgramme>;

    update(
        programme: WorkoutProgramme,
        tenantId: string,
    ): Promise<WorkoutProgramme>;

    delete(
        id: string,
        tenantId: string,
    ): Promise<void>;
}
