import { NutritionPlan } from "../../../domain/entities/nutrition-plan/nutrition-plan.entity";

export interface NutritionPlanDto {
    id: string;
    tenantId: string;
    athleteId: string;
    idempotencyKey: string;
    generatorId: string;
    generatorVersion: string;
    inputSnapshot: Record<string, unknown>;
    planSnapshot: {
        planType: "AUTOMATED_NUTRITION_PLAN";
        guidance: readonly string[];
    };
    createdAt: Date;
}

export class NutritionPlanMapper {
    static toDto(plan: NutritionPlan): NutritionPlanDto {
        return {
            id: plan.id,
            tenantId: plan.tenantId,
            athleteId: plan.athleteId,
            idempotencyKey: plan.idempotencyKey,
            generatorId: plan.generatorId,
            generatorVersion: plan.generatorVersion,
            inputSnapshot: plan.inputSnapshot,
            planSnapshot: plan.planSnapshot,
            createdAt: plan.createdAt,
        };
    }
}

