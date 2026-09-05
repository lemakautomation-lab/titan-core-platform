import {
    GeneratedWorkoutProgrammeReadModel,
    GeneratedWorkoutProgrammeReadRepository,
} from "../../application/ports/generated-workout-programme-read.repository";
import { DatabaseService } from "../database/database.service";
import { WorkoutProgrammeMapper } from "../mappers/workout-programme.mapper";
import { WorkoutProgrammeStructureMapper } from "../mappers/workout-programme-structure.mapper";

export class PrismaGeneratedWorkoutProgrammeReadRepository
implements GeneratedWorkoutProgrammeReadRepository {
    constructor(
        private readonly database: DatabaseService,
    ) {}

    async findCompleteByGenerationId(
        generationId: string,
        tenantId: string,
    ): Promise<GeneratedWorkoutProgrammeReadModel | null> {
        const generation =
            await this.database.prisma.workoutProgrammeGeneration.findFirst({
                where: {
                    id: generationId,
                    tenantId,
                    programme: {
                        tenantId,
                        status: "ACTIVE",
                    },
                },
                select: {
                    id: true,
                    tenantId: true,
                    programme: {
                        select: {
                            id: true,
                            tenantId: true,
                            athleteId: true,
                            name: true,
                            description: true,
                            goal: true,
                            experience: true,
                            trainingFrequency: true,
                            sessionDurationMinutes: true,
                            sportId: true,
                            status: true,
                            createdAt: true,
                            updatedAt: true,
                            sessions: {
                                where: { tenantId },
                                orderBy: { ordinal: "asc" },
                                select: {
                                    id: true,
                                    tenantId: true,
                                    programmeId: true,
                                    ordinal: true,
                                    name: true,
                                    createdAt: true,
                                    updatedAt: true,
                                    prescriptions: {
                                        where: { tenantId },
                                        orderBy: { ordinal: "asc" },
                                        select: {
                                            id: true,
                                            tenantId: true,
                                            sessionId: true,
                                            exerciseId: true,
                                            ordinal: true,
                                            sets: true,
                                            repetitions: true,
                                            durationSeconds: true,
                                            restSeconds: true,
                                            createdAt: true,
                                            updatedAt: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });

        if (!generation) {
            return null;
        }
        if (
            generation.tenantId !== tenantId ||
            generation.programme.tenantId !== tenantId ||
            generation.programme.sessions.length === 0 ||
            generation.programme.sessions.some(
                session => session.prescriptions.length === 0,
            )
        ) {
            throw new Error("Generated Workout Programme invariant failure.");
        }

        const programme = WorkoutProgrammeMapper.toDomain(generation.programme);
        const structure = WorkoutProgrammeStructureMapper.toDomain(
            tenantId,
            programme.id,
            generation.programme.sessions,
        );

        return Object.freeze({
            generationId: generation.id,
            programme,
            structure,
        });
    }
}
