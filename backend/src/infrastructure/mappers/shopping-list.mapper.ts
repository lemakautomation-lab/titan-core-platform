import { ShoppingList } from "../../domain/entities/shopping-list/shopping-list.entity";

export class ShoppingListMapper {
    static toPersistence(list: ShoppingList) {
        return {
            id: list.id,
            tenantId: list.tenantId,
            athleteId: list.athleteId,
            mealPlanId: list.mealPlanId,
            name: list.name,
            items: list.items as unknown as Record<string, unknown>,
            createdAt: list.createdAt,
            updatedAt: list.updatedAt,
        };
    }

    static toDomain(row: any): ShoppingList {
        return new ShoppingList(
            row.id,
            row.tenantId,
            row.athleteId,
            row.mealPlanId,
            row.name,
            row.items,
            row.createdAt,
            row.updatedAt,
        );
    }
}
