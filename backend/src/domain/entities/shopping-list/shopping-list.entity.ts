import { randomUUID } from "crypto";

export interface ShoppingListItem {
    readonly name: string;
    readonly quantity: number;
    readonly unit: string;
}

export class ShoppingList {
    constructor(
        public readonly id: string,
        public readonly tenantId: string,
        public readonly athleteId: string,
        public readonly mealPlanId: string,
        public readonly name: string,
        public readonly items: readonly ShoppingListItem[],
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) {}

    static create(
        tenantId: string,
        athleteId: string,
        mealPlanId: string,
        name: string,
        items: readonly ShoppingListItem[],
    ): ShoppingList {
        if (!tenantId?.trim()) throw new Error("Tenant ID is required.");
        if (!athleteId?.trim()) throw new Error("Athlete ID is required.");
        if (!mealPlanId?.trim()) throw new Error("Meal plan ID is required.");
        if (!name?.trim()) throw new Error("Shopping list name is required.");
        if (!Array.isArray(items)) throw new Error("Shopping list items are required.");

        return new ShoppingList(
            randomUUID(),
            tenantId.trim(),
            athleteId.trim(),
            mealPlanId.trim(),
            name.trim(),
            Object.freeze(items.map((item) => Object.freeze({ ...item }))),
            new Date(),
            new Date(),
        );
    }
}
