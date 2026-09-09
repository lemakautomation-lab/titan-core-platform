export type NutritionGoalClassification =
    | "GENERAL_FITNESS"
    | "SPORT_PERFORMANCE";

export function classifyNutritionGoal(
    goal: string | undefined,
): NutritionGoalClassification | undefined {
    if (!goal?.trim()) {
        return undefined;
    }

    const normalized = goal.trim().toUpperCase().replace(/[\s-]+/g, "_");

    if (normalized === "GENERAL_FITNESS") {
        return "GENERAL_FITNESS";
    }

    if (normalized === "SPORT_PERFORMANCE") {
        return "SPORT_PERFORMANCE";
    }

    return undefined;
}

export function goalSpecificNutritionGuidance(
    goal: string | undefined,
): string | undefined {
    switch (classifyNutritionGoal(goal)) {
        case "GENERAL_FITNESS":
            return "Nutrition guidance is aligned to general fitness and balanced daily energy needs.";

        case "SPORT_PERFORMANCE":
            return "Nutrition guidance is aligned to sport performance and supporting training demands.";

        default:
            return undefined;
    }
}
