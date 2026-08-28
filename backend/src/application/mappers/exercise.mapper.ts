import { Exercise } from "../../domain/entities/exercise.entity";
import { ExerciseDto } from "../dto/exercise/exercise.dto";

export class ExerciseApplicationMapper {

    static toDto(
        exercise: Exercise,
    ): ExerciseDto {

        return new ExerciseDto(
            exercise.id,
            exercise.tenantId,
            exercise.name,
            exercise.slug,
            exercise.description,
            exercise.movement,
            exercise.muscleGroups,
            exercise.equipment,
            exercise.trainingObjective,
            exercise.difficulty,
            exercise.trainingPhase,
            exercise.sportId,
            exercise.status,
            exercise.createdAt,
            exercise.updatedAt,
        );
    }
}
