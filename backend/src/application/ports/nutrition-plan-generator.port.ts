import { NutritionPlanSnapshot } from "../../domain/entities/nutrition-plan/nutrition-plan.entity";

export interface NutritionPlanGenerationInput {
    readonly athleteId: string;
    readonly goal?: string;
    readonly dietaryPreferences?: readonly string[];
    readonly dietaryRestrictions?: readonly string[];
    readonly notes?: string;
}

export interface NutritionPlanGenerationResult {
    readonly generatorId: string;
    readonly generatorVersion: string;
    readonly planSnapshot: NutritionPlanSnapshot;
}

export interface NutritionPlanGenerator {
    generate(
        input: NutritionPlanGenerationInput,
    ): Promise<NutritionPlanGenerationResult>;
}
