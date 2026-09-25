import { AthleteGoalsReader } from "../../application/intelligence/athlete-goals";
import { ProgrammeGoalClassification } from "../../domain/enums/programme-goal-classification.enum";
import { DatabaseService } from "../database/database.service";

/** Database constraints limit classifications to the governed set and one primary. */
export class PrismaAthleteGoalsReader implements AthleteGoalsReader {
    constructor(private readonly database: DatabaseService) {}

    async read(tenantId: string, athleteId: string) {
        const rows = await this.database.prisma.athleteGoal.findMany({
            where: { tenantId, athleteId },
            orderBy: [{ isPrimary: "desc" }, { classification: "asc" }],
            take: 9,
            select: { classification: true, isPrimary: true },
        });
        return {
            athleteId,
            primaryGoal: (rows.find((goal) => goal.isPrimary)?.classification ?? null) as ProgrammeGoalClassification | null,
            secondaryGoals: rows.filter((goal) => !goal.isPrimary)
                .map((goal) => goal.classification as ProgrammeGoalClassification),
        };
    }
}
