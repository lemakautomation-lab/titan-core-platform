import { Exercise as PrismaExercise } from "../../generated/prisma/client";

import { Exercise } from "../../domain/entities/exercise.entity";
import { RecordStatus } from "../../domain/enums/record-status.enum";

export class ExerciseMapper {

    static toDomain(
        prisma: PrismaExercise,
    ): Exercise {

        return new Exercise(
            prisma.id,
            prisma.tenantId,
            prisma.name,
            prisma.slug,
            prisma.description,
            prisma.movement,
            prisma.muscleGroups,
            prisma.equipment,
            prisma.trainingObjective,
            prisma.difficulty,
            prisma.trainingPhase,
            prisma.sportId,
            prisma.status as RecordStatus,
            prisma.createdAt,
            prisma.updatedAt,
        );
    }

    static toPersistence(
        exercise: Exercise,
    ) {

        return {

            id: exercise.id,

            tenantId: exercise.tenantId,

            name: exercise.name,

            slug: exercise.slug,

            description: exercise.description,

            movement: exercise.movement,

            muscleGroups: exercise.muscleGroups,

            equipment: exercise.equipment,

            trainingObjective: exercise.trainingObjective,

            difficulty: exercise.difficulty,

            trainingPhase: exercise.trainingPhase,

            sportId: exercise.sportId,

            status: exercise.status,

        };
    }
}
