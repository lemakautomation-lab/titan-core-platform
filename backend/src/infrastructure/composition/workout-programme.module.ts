import { DatabaseService } from "../database/database.service";

import { PrismaAthleteRepository } from "../repositories/athlete.repository";
import { PrismaSportRepository } from "../repositories/sport.repository";
import { PrismaWorkoutProgrammeRepository } from "../repositories/workout-programme.repository";
import { PrismaPerformanceMetricRepository } from "../repositories/performance-metric.repository";
import { PrismaPerformanceMeasurementRepository } from "../repositories/performance-measurement/performance-measurement.repository";

import { CreateWorkoutProgrammeUseCase } from "../../application/use-cases/create-workout-programme.use-case";
import { GetWorkoutProgrammeByIdUseCase } from "../../application/use-cases/get-workout-programme-by-id.use-case";
import { ListWorkoutProgrammesUseCase } from "../../application/use-cases/list-workout-programmes.use-case";
import { ListWorkoutProgrammesByAthleteUseCase } from "../../application/use-cases/list-workout-programmes-by-athlete.use-case";
import { UpdateWorkoutProgrammeUseCase } from "../../application/use-cases/update-workout-programme.use-case";
import { DeleteWorkoutProgrammeUseCase } from "../../application/use-cases/delete-workout-programme.use-case";
import { UpdateWorkoutProgrammeStatusUseCase } from "../../application/use-cases/update-workout-programme-status.use-case";
import { AdaptWorkoutProgrammeFromPerformanceUseCase } from "../../application/use-cases/adapt-workout-programme-from-performance.use-case";
import { PrismaWorkoutProgrammePerformanceAdaptationTransaction } from "../transactions/workout-programme-performance-adaptation.transaction";

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

const performanceMetricRepository =
    new PrismaPerformanceMetricRepository(
        databaseService,
    );

const performanceMeasurementRepository =
    new PrismaPerformanceMeasurementRepository(
        databaseService,
    );

const performanceAdaptationTransaction =
    new PrismaWorkoutProgrammePerformanceAdaptationTransaction(
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

    updateWorkoutProgrammeStatusUseCase:
        new UpdateWorkoutProgrammeStatusUseCase(
            workoutProgrammeRepository,
        ),

    adaptWorkoutProgrammeFromPerformanceUseCase:
        new AdaptWorkoutProgrammeFromPerformanceUseCase(
            workoutProgrammeRepository,
            athleteRepository,
            performanceMetricRepository,
            performanceMeasurementRepository,
            performanceAdaptationTransaction,
        ),

};
