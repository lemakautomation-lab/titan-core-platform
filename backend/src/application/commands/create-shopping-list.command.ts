import { ShoppingListItem } from "../../domain/entities/shopping-list/shopping-list.entity";

export class CreateShoppingListCommand {
    public readonly tenantId: string;
    public readonly actorUserId: string;
    public readonly athleteId: string;
    public readonly mealPlanId: string;
    public readonly name: string;
    public readonly items: readonly ShoppingListItem[];

    constructor(
        tenantId: string,
        actorUserId: string,
        athleteId: string,
        mealPlanId: string,
        name: string,
        items: readonly ShoppingListItem[],
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

        if (!mealPlanId?.trim()) {
            throw new Error("Meal plan ID is required.");
        }

        if (!name?.trim()) {
            throw new Error("Shopping list name is required.");
        }

        if (!Array.isArray(items)) {
            throw new Error("Shopping list items are required.");
        }

        this.tenantId = tenantId.trim();
        this.actorUserId = actorUserId.trim();
        this.athleteId = athleteId.trim();
        this.mealPlanId = mealPlanId.trim();
        this.name = name.trim();
        this.items = Object.freeze(
            items.map((item) => Object.freeze({ ...item })),
        );

        Object.freeze(this);
    }
}
