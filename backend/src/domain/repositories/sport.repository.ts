import { Sport } from "../entities/sport.entity";

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
    ): Promise<Sport[]>;

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
