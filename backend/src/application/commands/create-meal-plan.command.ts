export interface MealPlanMealInput {
    readonly ordinal: number;
    readonly name: string;
    readonly caloriesKcal?: number;
    readonly proteinGrams?: number;
    readonly carbohydrateGrams?: number;
    readonly fatGrams?: number;
}

export class CreateMealPlanCommand {
    public readonly tenantId: string;
    public readonly actorUserId: string;
    public readonly athleteId: string;
    public readonly name: string;
    public readonly description: string | null;
    public readonly meals: readonly MealPlanMealInput[];

    constructor(
        tenantId: string,
        actorUserId: string,
        athleteId: string,
        name: string,
        description: string | null,
        meals: readonly MealPlanMealInput[],
    ) {
        if (!tenantId?.trim()) {
            throw new Error("Tenant ID is required.");
        }

        if (!actorUserId?.trim()) {
            throw new Error("Actor user ID is required.");
        }

        if (!athleteId?.trim()) {
            throw new Error("Athlete ID is required.");
        }

        if (!name?.trim()) {
            throw new Error("Meal plan name is required.");
        }

        if (!Array.isArray(meals)) {
            throw new Error("Meal plan meals are required.");
        }

        this.tenantId = tenantId.trim();
        this.actorUserId = actorUserId.trim();
        this.athleteId = athleteId.trim();
        this.name = name.trim();
        this.description = description?.trim() || null;
        this.meals = Object.freeze(
            meals.map((meal) => Object.freeze({ ...meal })),
        );

        Object.freeze(this);
    }
}
