import { ShoppingList } from "../../../domain/entities/shopping-list/shopping-list.entity";

export interface ShoppingListDto {
    id: string;
    tenantId: string;
    athleteId: string;
    mealPlanId: string;
    name: string;
    items: readonly {
        name: string;
        quantity: number;
        unit: string;
    }[];
    createdAt: Date;
    updatedAt: Date;
}

export class ShoppingListApplicationMapper {
    static toDto(list: ShoppingList): ShoppingListDto {
        return {
            id: list.id,
            tenantId: list.tenantId,
            athleteId: list.athleteId,
            mealPlanId: list.mealPlanId,
            name: list.name,
            items: list.items,
            createdAt: list.createdAt,
            updatedAt: list.updatedAt,
        };
    }
}
