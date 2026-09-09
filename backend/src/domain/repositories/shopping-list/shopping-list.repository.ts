import { ShoppingList } from "../../entities/shopping-list/shopping-list.entity";

export interface ShoppingListRepository {
    findById(id: string, tenantId: string): Promise<ShoppingList | null>;
    create(shoppingList: ShoppingList): Promise<ShoppingList>;
}
