import { DatabaseService } from "../database/database.service";

import { PrismaOrganisationRepository } from "../repositories/organisation.repository";

import { CreateOrganisationUseCase } from "../../application/use-cases/create-organisation.use-case";


const databaseService = new DatabaseService();


const organisationRepository =
    new PrismaOrganisationRepository(databaseService);


export const organisationModule = {

    createOrganisationUseCase:
        new CreateOrganisationUseCase(
            organisationRepository,
        ),

};
