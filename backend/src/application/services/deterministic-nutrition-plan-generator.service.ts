import {
    NutritionPlanGenerationInput,
    NutritionPlanGenerationResult,
    NutritionPlanGenerator,
} from "../ports/nutrition-plan-generator.port";

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

        const guidance: string[] = [
            "Automated nutrition plan generated from the supplied athlete context.",
        ];

        if (input.goal?.trim()) {
            guidance.push(
                `Plan context includes the stated goal: ${input.goal.trim()}.`,
            );
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

        return {
            generatorId:
                DeterministicNutritionPlanGenerator.GENERATOR_ID,
            generatorVersion:
                DeterministicNutritionPlanGenerator.GENERATOR_VERSION,
            planSnapshot: Object.freeze({
                planType: "AUTOMATED_NUTRITION_PLAN",
                guidance: Object.freeze(guidance),
            }),
        };
    }
}
