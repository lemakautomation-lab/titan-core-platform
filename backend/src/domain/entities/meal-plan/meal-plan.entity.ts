import { randomUUID } from "crypto";

export type MealPlanStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export interface MealPlanSnapshot {
    readonly planType: "MEAL_PLAN";
    readonly meals: readonly unknown[];
}

export class MealPlan {
    constructor(
        public readonly id: string,
        public readonly tenantId: string,
        public readonly athleteId: string,
        public readonly name: string,
        public readonly description: string | null,
        public readonly version: number,
        public readonly status: MealPlanStatus,
        public readonly planSnapshot: MealPlanSnapshot,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) {}

    static create(
        tenantId: string,
        athleteId: string,
        name: string,
        description: string | null,
        planSnapshot: MealPlanSnapshot,
    ): MealPlan {
        if (!tenantId?.trim()) throw new Error("Tenant ID is required.");
        if (!athleteId?.trim()) throw new Error("Athlete ID is required.");
        if (!name?.trim()) throw new Error("Meal plan name is required.");
        if (!planSnapshot || planSnapshot.planType !== "MEAL_PLAN") {
            throw new Error("Meal plan snapshot is invalid.");
        }

        return new MealPlan(
            randomUUID(),
            tenantId.trim(),
            athleteId.trim(),
            name.trim(),
            description?.trim() || null,
            1,
            "DRAFT",
            Object.freeze({
                planType: "MEAL_PLAN",
                meals: Object.freeze([...planSnapshot.meals]),
            }),
            new Date(),
            new Date(),
        );
    }
}
