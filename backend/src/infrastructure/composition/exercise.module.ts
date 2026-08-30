import { DatabaseService } from "../database/database.service";

import { PrismaExerciseRepository } from "../repositories/exercise.repository";
import { PrismaSportRepository } from "../repositories/sport.repository";

import { CreateExerciseUseCase } from "../../application/use-cases/create-exercise.use-case";
import { GetExerciseByIdUseCase } from "../../application/use-cases/get-exercise-by-id.use-case";
import { ListExercisesUseCase } from "../../application/use-cases/list-exercises.use-case";
import { UpdateExerciseUseCase } from "../../application/use-cases/update-exercise.use-case";
import { DeleteExerciseUseCase } from "../../application/use-cases/delete-exercise.use-case";
import { UpdateExerciseStatusUseCase } from "../../application/use-cases/update-exercise-status.use-case";

const databaseService = new DatabaseService();

const exerciseRepository =
    new PrismaExerciseRepository(databaseService);

const sportRepository =
    new PrismaSportRepository(databaseService);

export const exerciseModule = {

    createExerciseUseCase:
        new CreateExerciseUseCase(
            exerciseRepository,
            sportRepository,
        ),

    getExerciseByIdUseCase:
        new GetExerciseByIdUseCase(
            exerciseRepository,
        ),

    listExercisesUseCase:
        new ListExercisesUseCase(
            exerciseRepository,
        ),

    updateExerciseUseCase:
        new UpdateExerciseUseCase(
            exerciseRepository,
            sportRepository,
        ),

    deleteExerciseUseCase:
        new DeleteExerciseUseCase(
            exerciseRepository,
        ),
    updateExerciseStatusUseCase:
        new UpdateExerciseStatusUseCase(
            exerciseRepository,
        ),
};
