import { AthleteNutritionReader } from "../../application/intelligence/athlete-nutrition";
import { DatabaseService } from "../database/database.service";

/** Metadata only: never read generator inputs, plan contents, meals or shopping lists. */
export class PrismaAthleteNutritionReader implements AthleteNutritionReader {
    constructor(private readonly database: DatabaseService) {}

    async read(tenantId: string, athleteId: string) {
        const [generated, meals] = await Promise.all([
            this.database.prisma.nutritionPlan.findFirst({
                where: { tenantId, athleteId },
                orderBy: [{ createdAt: "desc" }, { id: "desc" }],
                select: { id: true, createdAt: true },
            }),
            this.database.prisma.mealPlan.findMany({
                where: { tenantId, athleteId, status: "ACTIVE" },
                orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
                take: 20,
                select: { id: true, name: true, updatedAt: true },
            }),
        ]);
        return { athleteId, latestGeneratedPlan: generated, activeMealPlans: meals };
    }
}
