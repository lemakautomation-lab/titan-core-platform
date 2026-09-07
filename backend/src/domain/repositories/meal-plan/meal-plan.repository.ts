import { MealPlan } from "../../entities/meal-plan/meal-plan.entity";

export interface MealPlanRepository {
    findById(
        id: string,
        tenantId: string,
    ): Promise<MealPlan | null>;

    findByAthlete(
        athleteId: string,
        tenantId: string,
    ): Promise<MealPlan[]>;

    create(
        mealPlan: MealPlan,
    ): Promise<MealPlan>;
}
