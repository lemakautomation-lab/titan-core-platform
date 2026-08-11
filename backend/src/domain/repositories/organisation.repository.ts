import { Organisation } from "../entities/organisation.entity";

export interface OrganisationRepository {

    findById(
        id: string,
        tenantId: string,
    ): Promise<Organisation | null>;

    findAll(
        tenantId: string,
    ): Promise<Organisation[]>;

    create(
        organisation: Organisation,
    ): Promise<Organisation>;

    update(
        organisation: Organisation,
        tenantId: string,
    ): Promise<Organisation>;

    delete(
        id: string,
        tenantId: string,
    ): Promise<void>;

}
