import { Sport } from "../entities/sport.entity";
import { PaginationInput } from "../../application/common/pagination";

export interface SportRepository {

    findById(
        id: string,
        tenantId: string,
    ): Promise<Sport | null>;

    findBySlug(
        slug: string,
        tenantId: string,
    ): Promise<Sport | null>;

    findAll(
        tenantId: string,
        pagination: PaginationInput,
    ): Promise<{
        items: Sport[];
        total: number;
    }>;

    create(
        sport: Sport,
    ): Promise<Sport>;

    update(
        sport: Sport,
        tenantId: string,
    ): Promise<Sport>;

    delete(
        id: string,
        tenantId: string,
    ): Promise<void>;
}
