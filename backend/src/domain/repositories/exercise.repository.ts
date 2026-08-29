import { Exercise } from "../entities/exercise.entity";
import { PaginationInput } from "../../application/common/pagination";

export interface ExerciseListResult {
    items: Exercise[];
    total: number;
}

export interface ExerciseRepository {

    findById(
        id: string,
        tenantId: string,
    ): Promise<Exercise | null>;

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

    delete(
        id: string,
        tenantId: string,
    ): Promise<void>;
}
