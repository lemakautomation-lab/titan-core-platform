import {
    NutritionPlanGenerationInput,
    NutritionPlanGenerationResult,
    NutritionPlanGenerator,
    NutritionPlanSnapshot,
} from "../ports/nutrition-plan-generator.port";
import { createMacroTargets } from "../../domain/entities/nutrition-plan/macro-targets";
import { createHydrationGuidance } from "../../domain/entities/nutrition-plan/hydration-guidance";
import { goalSpecificNutritionGuidance } from "./nutrition-goal-policy.service";

export class DeterministicNutritionPlanGenerator
implements NutritionPlanGenerator {
    static readonly GENERATOR_ID = "TITAN_DETERMINISTIC_NUTRITION";
    static readonly GENERATOR_VERSION = "1.0.0";

    async generate(
        input: NutritionPlanGenerationInput,
    ): Promise<NutritionPlanGenerationResult> {
        if (!input || !input.athleteId?.trim()) {
            throw new Error("Nutrition generation input is required.");
        }

        const macroTargets = createMacroTargets(
            input.macroTargets?.caloriesKcal,
            input.macroTargets?.proteinGrams,
            input.macroTargets?.carbohydrateGrams,
            input.macroTargets?.fatGrams,
        );

        const hydrationGuidance = createHydrationGuidance(
            input.hydrationGuidance?.dailyWaterLitres,
        );

        const guidance: string[] = [
            "Automated nutrition plan generated from the supplied athlete context.",
            `Daily hydration guidance is ${hydrationGuidance.dailyWaterLitres} litres per day.`,
        ];

        if (input.goal?.trim()) {
            guidance.push(
                `Plan context includes the stated goal: ${input.goal.trim()}.`,
            );

            const goalGuidance = goalSpecificNutritionGuidance(input.goal);

            if (goalGuidance) {
                guidance.push(goalGuidance);
            }
        }

        if (input.dietaryPreferences?.length) {
            guidance.push(
                "Plan context includes the supplied dietary preferences.",
            );
        }

        if (input.dietaryRestrictions?.length) {
            guidance.push(
                "Plan context includes the supplied dietary restrictions.",
            );
        }

        const planSnapshot: NutritionPlanSnapshot = Object.freeze({
            planType: "AUTOMATED_NUTRITION_PLAN",
            macroTargets,
            hydrationGuidance,
            guidance: Object.freeze(guidance),
        });

        return {
            generatorId:
                DeterministicNutritionPlanGenerator.GENERATOR_ID,
            generatorVersion:
                DeterministicNutritionPlanGenerator.GENERATOR_VERSION,
            planSnapshot,
        };
    }
}
