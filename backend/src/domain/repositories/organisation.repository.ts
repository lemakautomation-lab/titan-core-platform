import { Organisation } from "../entities/organisation.entity";

export interface OrganisationRepository {

    findById(id: string): Promise<Organisation | null>;

    findAll(): Promise<Organisation[]>;

    create(organisation: Organisation): Promise<Organisation>;

    update(organisation: Organisation): Promise<Organisation>;

    delete(id: string): Promise<void>;

}