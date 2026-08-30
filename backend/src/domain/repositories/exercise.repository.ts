import { Exercise } from "../entities/exercise.entity";
import { PaginationInput } from "../../application/common/pagination";
import { RecordStatus } from "../enums/record-status.enum";

export interface ExerciseListResult {
    items: Exercise[];
    total: number;
}

export interface ExerciseRepository {

    findById(id: string, tenantId: string): Promise<Exercise | null>;

    findBySlug(
        slug: string,
        tenantId: string,
    ): Promise<Exercise | null>;

    findAll(
        tenantId: string,
        pagination: PaginationInput,
    ): Promise<ExerciseListResult>;

    create(
        exercise: Exercise,
    ): Promise<Exercise>;

    update(
        exercise: Exercise,
        tenantId: string,
    ): Promise<Exercise>;

    updateStatus(
        id: string,
        tenantId: string,
        status: RecordStatus,
    ): Promise<boolean>;

    delete(
        id: string,
        tenantId: string,
    ): Promise<void>;
}

