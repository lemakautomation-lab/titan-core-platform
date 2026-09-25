import { AthleteIntelligenceContextReader } from "./athlete-context";

export interface NutritionPermissionChecker {
    hasPermission(userId: string, tenantId: string, code: string): Promise<boolean>;
}

export interface AthleteNutritionSnapshot {
    athleteId: string;
    latestGeneratedPlan: { id: string; createdAt: Date } | null;
    activeMealPlans: Array<{ id: string; name: string; updatedAt: Date }>;
}

export interface AthleteNutritionReader {
    read(tenantId: string, athleteId: string): Promise<AthleteNutritionSnapshot>;
}

export class ReadAthleteIntelligenceNutrition {
    constructor(
        private readonly context: AthleteIntelligenceContextReader,
        private readonly permissions: NutritionPermissionChecker,
        private readonly nutrition: AthleteNutritionReader,
    ) {}

    async execute(tenantId: string, actorId: string, athleteId: string): Promise<AthleteNutritionSnapshot | null> {
        const scope = await this.context.read(tenantId, actorId, athleteId);
        if (!scope) return null;
        if (!(await this.permissions.hasPermission(actorId, tenantId, "nutrition-plans.read"))) return null;
        return this.nutrition.read(tenantId, scope.athleteId);
    }
}
