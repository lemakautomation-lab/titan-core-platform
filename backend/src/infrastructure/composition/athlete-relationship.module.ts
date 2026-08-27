import { DatabaseService } from "../database/database.service";

import { PrismaAthleteRepository } from "../repositories/athlete.repository";
import { PrismaAthleteRelationshipRepository } from "../repositories/athlete-relationship.repository";

import { CreateAthleteRelationshipUseCase } from "../../application/use-cases/create-athlete-relationship.use-case";
import { GetAthleteRelationshipByIdUseCase } from "../../application/use-cases/get-athlete-relationship-by-id.use-case";
import { ListAthleteRelationshipsUseCase } from "../../application/use-cases/list-athlete-relationships.use-case";


const databaseService =
    new DatabaseService();


const athleteRepository =
    new PrismaAthleteRepository(
        databaseService,
    );


const athleteRelationshipRepository =
    new PrismaAthleteRelationshipRepository(
        databaseService,
    );


export const athleteRelationshipModule = {

    createAthleteRelationshipUseCase:
        new CreateAthleteRelationshipUseCase(
            athleteRelationshipRepository,
            athleteRepository,
        ),

    getAthleteRelationshipByIdUseCase:
        new GetAthleteRelationshipByIdUseCase(
            athleteRelationshipRepository,
        ),

    listAthleteRelationshipsUseCase:
        new ListAthleteRelationshipsUseCase(
            athleteRelationshipRepository,
        ),

};
