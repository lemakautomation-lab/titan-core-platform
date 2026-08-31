import { WorkoutProgramme } from "../entities/workout-programme.entity";
import { RecordStatus } from "../enums/record-status.enum";
import { PaginationInput } from "../../application/common/pagination";

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
        pagination: PaginationInput,
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

    updateStatus(
        id: string,
        tenantId: string,
        status: RecordStatus,
    ): Promise<WorkoutProgramme>;

    delete(
        id: string,
        tenantId: string,
    ): Promise<void>;
}
