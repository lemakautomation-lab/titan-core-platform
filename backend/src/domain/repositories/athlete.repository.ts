import { Athlete } from "../entities/athlete.entity";

export interface AthleteRepository {

    findById(
        id: string,
        tenantId: string,
    ): Promise<Athlete | null>;

    findAll(
        tenantId: string,
    ): Promise<Athlete[]>;

    findAllByOrganisationId(
        organisationId: string,
        tenantId: string,
    ): Promise<Athlete[]>;

    findByUserId(
        userId: string,
        tenantId: string,
    ): Promise<Athlete | null>;

    create(
        athlete: Athlete,
    ): Promise<Athlete>;

    update(
        athlete: Athlete,
        tenantId: string,
    ): Promise<Athlete>;

    delete(
        id: string,
        tenantId: string,
    ): Promise<void>;

}
