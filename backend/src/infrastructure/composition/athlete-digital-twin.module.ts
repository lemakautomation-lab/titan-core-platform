import { DatabaseService } from "../database/database.service";

import { PrismaAthleteRepository } from "../repositories/athlete.repository";
import { PrismaAthleteDigitalTwinRepository } from "../repositories/athlete-digital-twin.repository";

import { CreateAthleteDigitalTwinUseCase } from "../../application/use-cases/create-athlete-digital-twin.use-case";
import { GetAthleteDigitalTwinByIdUseCase } from "../../application/use-cases/get-athlete-digital-twin-by-id.use-case";
import { GetAthleteDigitalTwinByAthleteIdUseCase } from "../../application/use-cases/get-athlete-digital-twin-by-athlete-id.use-case";
import { UpdateAthleteDigitalTwinLifecycleUseCase } from "../../application/use-cases/update-athlete-digital-twin-lifecycle.use-case";


const databaseService =
    new DatabaseService();


const athleteRepository =
    new PrismaAthleteRepository(
        databaseService,
    );


const athleteDigitalTwinRepository =
    new PrismaAthleteDigitalTwinRepository(
        databaseService,
    );


export const athleteDigitalTwinModule = {

    createAthleteDigitalTwinUseCase:
        new CreateAthleteDigitalTwinUseCase(
            athleteDigitalTwinRepository,
            athleteRepository,
        ),

    getAthleteDigitalTwinByIdUseCase:
        new GetAthleteDigitalTwinByIdUseCase(
            athleteDigitalTwinRepository,
        ),

    getAthleteDigitalTwinByAthleteIdUseCase:
        new GetAthleteDigitalTwinByAthleteIdUseCase(
            athleteDigitalTwinRepository,
        ),

    updateAthleteDigitalTwinLifecycleUseCase:
        new UpdateAthleteDigitalTwinLifecycleUseCase(
            athleteDigitalTwinRepository,
        ),

};
