import { MealPlan } from "../../domain/entities/meal-plan/meal-plan.entity";

export class MealPlanMapper {
    static toPersistence(plan: MealPlan) {
        return {
            id: plan.id,
            tenantId: plan.tenantId,
            athleteId: plan.athleteId,
            name: plan.name,
            description: plan.description,
            version: plan.version,
            status: plan.status,
            planSnapshot: plan.planSnapshot as unknown as Record<string, unknown>,
            createdAt: plan.createdAt,
            updatedAt: plan.updatedAt,
        };
    }

    static toDomain(row: any): MealPlan {
        return new MealPlan(
            row.id,
            row.tenantId,
            row.athleteId,
            row.name,
            row.description,
            row.version,
            row.status,
            row.planSnapshot,
            row.createdAt,
            row.updatedAt,
        );
    }
}

