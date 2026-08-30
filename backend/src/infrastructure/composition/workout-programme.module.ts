import { DatabaseService } from "../database/database.service";

import { PrismaAthleteRepository } from "../repositories/athlete.repository";
import { PrismaSportRepository } from "../repositories/sport.repository";
import { PrismaWorkoutProgrammeRepository } from "../repositories/workout-programme.repository";

import { CreateWorkoutProgrammeUseCase } from "../../application/use-cases/create-workout-programme.use-case";
import { GetWorkoutProgrammeByIdUseCase } from "../../application/use-cases/get-workout-programme-by-id.use-case";
import { ListWorkoutProgrammesUseCase } from "../../application/use-cases/list-workout-programmes.use-case";
import { ListWorkoutProgrammesByAthleteUseCase } from "../../application/use-cases/list-workout-programmes-by-athlete.use-case";
import { UpdateWorkoutProgrammeUseCase } from "../../application/use-cases/update-workout-programme.use-case";
import { DeleteWorkoutProgrammeUseCase } from "../../application/use-cases/delete-workout-programme.use-case";

const databaseService =
    new DatabaseService();

const workoutProgrammeRepository =
    new PrismaWorkoutProgrammeRepository(
        databaseService,
    );

const athleteRepository =
    new PrismaAthleteRepository(
        databaseService,
    );

const sportRepository =
    new PrismaSportRepository(
        databaseService,
    );

export const workoutProgrammeModule = {

    createWorkoutProgrammeUseCase:
        new CreateWorkoutProgrammeUseCase(
            workoutProgrammeRepository,
            athleteRepository,
            sportRepository,
        ),

    getWorkoutProgrammeByIdUseCase:
        new GetWorkoutProgrammeByIdUseCase(
            workoutProgrammeRepository,
        ),

    listWorkoutProgrammesUseCase:
        new ListWorkoutProgrammesUseCase(
            workoutProgrammeRepository,
        ),

    listWorkoutProgrammesByAthleteUseCase:
        new ListWorkoutProgrammesByAthleteUseCase(
            workoutProgrammeRepository,
            athleteRepository,
        ),

    updateWorkoutProgrammeUseCase:
        new UpdateWorkoutProgrammeUseCase(
            workoutProgrammeRepository,
            athleteRepository,
            sportRepository,
        ),

    deleteWorkoutProgrammeUseCase:
        new DeleteWorkoutProgrammeUseCase(
            workoutProgrammeRepository,
        ),

};
