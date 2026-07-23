import { DatabaseService } from "../database/database.service";

import { PrismaOrganisationRepository } from "../repositories/organisation.repository";

import { CreateOrganisationUseCase } from "../../application/use-cases/create-organisation.use-case";
import { GetOrganisationByIdUseCase } from "../../application/use-cases/get-organisation-by-id.use-case";
import { ListOrganisationsUseCase } from "../../application/use-cases/list-organisations.use-case";
import { UpdateOrganisationUseCase } from "../../application/use-cases/update-organisation.use-case";


const databaseService = new DatabaseService();


const organisationRepository =
    new PrismaOrganisationRepository(databaseService);



export const organisationModule = {


    createOrganisationUseCase:

        new CreateOrganisationUseCase(
            organisationRepository,
        ),


    getOrganisationByIdUseCase:

        new GetOrganisationByIdUseCase(
            organisationRepository,
        ),


    listOrganisationsUseCase:

        new ListOrganisationsUseCase(
            organisationRepository,
        ),


    updateOrganisationUseCase:

        new UpdateOrganisationUseCase(
            organisationRepository,
        ),

};
