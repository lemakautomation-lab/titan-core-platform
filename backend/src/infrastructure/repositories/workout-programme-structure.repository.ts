import { WorkoutProgrammeStructure } from "../../domain/entities/workout-programme-structure.entity";
import { WorkoutProgrammeStructureRepository } from "../../domain/repositories/workout-programme-structure.repository";
import { DatabaseService } from "../database/database.service";
import { WorkoutProgrammeStructureMapper } from "../mappers/workout-programme-structure.mapper";

export class PrismaWorkoutProgrammeStructureRepository
implements WorkoutProgrammeStructureRepository {
    constructor(
        private readonly database: DatabaseService,
    ) {}

    async persistInitialStructure(
        structure: WorkoutProgrammeStructure,
    ): Promise<WorkoutProgrammeStructure> {
        return this.database.transaction(async tx => {
            const programmes = await tx.$queryRaw<Array<{ id: string }>>`
                SELECT "id"
                FROM "WorkoutProgramme"
                WHERE "id" = ${structure.programmeId}
                  AND "tenantId" = ${structure.tenantId}
                  AND "status" <> 'DELETED'
                FOR UPDATE
            `;

            if (programmes.length !== 1) {
                throw new Error("Workout Programme not found.");
            }

            const existing = await tx.workoutProgrammeSession.count({
                where: {
                    programmeId: structure.programmeId,
                    tenantId: structure.tenantId,
                },
            });

            if (existing !== 0) {
                throw new Error(
                    "Workout Programme structure already exists.",
                );
            }

            for (const session of structure.sessions) {
                await tx.workoutProgrammeSession.create({
                    data: {
                        id: session.id,
                        tenantId: session.tenantId,
                        programmeId: session.programmeId,
                        ordinal: session.ordinal,
                        name: session.name,
                    },
                });

                if (session.prescriptions.length > 0) {
                    await tx.workoutProgrammeExercisePrescription.createMany({
                        data: session.prescriptions.map(prescription => ({
                            id: prescription.id,
                            tenantId: prescription.tenantId,
                            sessionId: prescription.sessionId,
                            exerciseId: prescription.exerciseId,
                            ordinal: prescription.ordinal,
                            sets: prescription.sets,
                            repetitions: prescription.repetitions,
                            durationSeconds: prescription.durationSeconds,
                            restSeconds: prescription.restSeconds,
                        })),
                    });
                }
            }

            return this.findWithClient(
                tx,
                structure.programmeId,
                structure.tenantId,
            );
        });
    }

    async findByProgrammeId(
        programmeId: string,
        tenantId: string,
    ): Promise<WorkoutProgrammeStructure | null> {
        const programme = await this.database.prisma.workoutProgramme.findFirst({
            where: { id: programmeId, tenantId },
            select: { id: true },
        });

        if (!programme) {
            return null;
        }

        return this.findWithClient(
            this.database.prisma,
            programmeId,
            tenantId,
        );
    }

    private async findWithClient(
        client: Pick<
            DatabaseService["prisma"],
            "workoutProgrammeSession"
        >,
        programmeId: string,
        tenantId: string,
    ): Promise<WorkoutProgrammeStructure> {
        const sessions = await client.workoutProgrammeSession.findMany({
            where: { programmeId, tenantId },
            orderBy: { ordinal: "asc" },
            include: {
                prescriptions: {
                    orderBy: { ordinal: "asc" },
                },
            },
        });

        return WorkoutProgrammeStructureMapper.toDomain(
            tenantId,
            programmeId,
            sessions,
        );
    }
}
