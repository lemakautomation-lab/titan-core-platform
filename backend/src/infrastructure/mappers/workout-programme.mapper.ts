import { WorkoutProgramme as PrismaWorkoutProgramme } from "../../generated/prisma/client";

import { WorkoutProgramme } from "../../domain/entities/workout-programme.entity";
import { RecordStatus } from "../../domain/enums/record-status.enum";

export class WorkoutProgrammeMapper {

    static toDomain(
        prisma: PrismaWorkoutProgramme,
    ): WorkoutProgramme {

        return new WorkoutProgramme(
            prisma.id,
            prisma.tenantId,
            prisma.athleteId,
            prisma.name,
            prisma.description,
            prisma.goal,
            prisma.experience,
            prisma.trainingFrequency,
            prisma.sessionDurationMinutes,
            prisma.sportId,
            prisma.status as RecordStatus,
            prisma.createdAt,
            prisma.updatedAt,
        );
    }

    static toPersistence(
        programme: WorkoutProgramme,
    ) {

        return {
            id: programme.id,
            tenantId: programme.tenantId,
            athleteId: programme.athleteId,
            name: programme.name,
            description: programme.description,
            goal: programme.goal,
            experience: programme.experience,
            trainingFrequency: programme.trainingFrequency,
            sessionDurationMinutes: programme.sessionDurationMinutes,
            sportId: programme.sportId,
            status: programme.status,
        };
    }
}
