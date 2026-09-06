export interface MacroTargets {
    readonly caloriesKcal: number;
    readonly proteinGrams: number;
    readonly carbohydrateGrams: number;
    readonly fatGrams: number;
}

export function createMacroTargets(
    caloriesKcal: number,
    proteinGrams: number,
    carbohydrateGrams: number,
    fatGrams: number,
): MacroTargets {
    const values = {
        caloriesKcal,
        proteinGrams,
        carbohydrateGrams,
        fatGrams,
    };

    for (const [name, value] of Object.entries(values)) {
        if (
            typeof value !== "number" ||
            !Number.isFinite(value) ||
            value <= 0
        ) {
            throw new Error(
                `Macro target ${name} must be a finite positive number.`,
            );
        }
    }

    return Object.freeze(values);
}
