export interface NutritionProfessionalWorkflowDto {
    athleteId: string;
    latestNutritionPlan: {
        id: string;
        athleteId: string;
        generatorId: string;
        generatorVersion: string;
        planSnapshot: {
            planType: "AUTOMATED_NUTRITION_PLAN";
            goalClassification?: "GENERAL_FITNESS" | "SPORT_PERFORMANCE";
            macroTargets: {
                caloriesKcal: number;
                proteinGrams: number;
                carbohydrateGrams: number;
                fatGrams: number;
            };
            hydrationGuidance: {
                dailyWaterLitres: number;
                unit: "LITRES_PER_DAY";
            };
            guidance: readonly string[];
        };
        createdAt: string;
    } | null;
}
