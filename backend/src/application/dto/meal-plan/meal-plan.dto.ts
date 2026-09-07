import { MealPlan } from "../../../domain/entities/meal-plan/meal-plan.entity";

export interface MealPlanDto {
    id: string;
    tenantId: string;
    athleteId: string;
    name: string;
    description: string | null;
    version: number;
    status: "DRAFT" | "ACTIVE" | "ARCHIVED";
    planSnapshot: {
        planType: "MEAL_PLAN";
        meals: readonly unknown[];
    };
    createdAt: Date;
    updatedAt: Date;
}

export class MealPlanApplicationMapper {
    static toDto(plan: MealPlan): MealPlanDto {
        return {
            id: plan.id,
            tenantId: plan.tenantId,
            athleteId: plan.athleteId,
            name: plan.name,
            description: plan.description,
            version: plan.version,
            status: plan.status,
            planSnapshot: plan.planSnapshot,
            createdAt: plan.createdAt,
            updatedAt: plan.updatedAt,
        };
    }
}
