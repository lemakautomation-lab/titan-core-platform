import { NutritionPlan } from "../../entities/nutrition-plan/nutrition-plan.entity";

export interface NutritionPlanRepository {
    findById(
        id: string,
        tenantId: string,
    ): Promise<NutritionPlan | null>;

    findByIdempotencyKey(
        tenantId: string,
        idempotencyKey: string,
    ): Promise<NutritionPlan | null>;

    create(
        plan: NutritionPlan,
    ): Promise<NutritionPlan>;
}
