import { MacroTargets } from "../../domain/entities/nutrition-plan/macro-targets";

export interface NutritionPlanGenerationInput {
    readonly athleteId: string;
    readonly macroTargets: MacroTargets;
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

export interface NutritionPlanSnapshot {
    readonly planType: "AUTOMATED_NUTRITION_PLAN";
    readonly macroTargets: MacroTargets;
    readonly guidance: readonly string[];
}

export interface NutritionPlanGenerator {
    generate(
        input: NutritionPlanGenerationInput,
    ): Promise<NutritionPlanGenerationResult>;
}
