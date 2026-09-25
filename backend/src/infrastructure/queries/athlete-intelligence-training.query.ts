import { AthleteTrainingReader } from "../../application/intelligence/athlete-training";
import { DatabaseService } from "../database/database.service";

/** Return only active programmes, newest first, with a fixed upper bound. */
export class PrismaAthleteTrainingReader implements AthleteTrainingReader {
    constructor(private readonly database: DatabaseService) {}

    async read(tenantId: string, athleteId: string) {
        const programmes = await this.database.prisma.workoutProgramme.findMany({
            where: { tenantId, athleteId, status: "ACTIVE" },
            orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
            take: 20,
            select: { id: true, name: true, status: true, trainingFrequency: true, updatedAt: true },
        });
        return {
            athleteId,
            programmes: programmes.map(({ id, name, trainingFrequency, updatedAt }) => ({
                id, name, trainingFrequency, updatedAt, status: "ACTIVE" as const,
            })),
        };
    }
}
