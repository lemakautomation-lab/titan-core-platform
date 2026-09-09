import { Prisma } from "../../../generated/prisma/client";
import { DatabaseService } from "../../database/database.service";
import { ShoppingList } from "../../../domain/entities/shopping-list/shopping-list.entity";
import { ShoppingListRepository } from "../../../domain/repositories/shopping-list/shopping-list.repository";
import { ShoppingListMapper } from "../../mappers/shopping-list.mapper";

export class PrismaShoppingListRepository implements ShoppingListRepository {
    constructor(private readonly database: DatabaseService) {}

    async findById(id: string, tenantId: string): Promise<ShoppingList | null> {
        const row = await this.database.prisma.shoppingList.findFirst({
            where: { id, tenantId },
        });

        return row ? ShoppingListMapper.toDomain(row) : null;
    }

    async create(shoppingList: ShoppingList): Promise<ShoppingList> {
        const row = await this.database.prisma.shoppingList.create({
            data: ShoppingListMapper.toPersistence(
                shoppingList,
            ) as Prisma.ShoppingListUncheckedCreateInput,
        });

        return ShoppingListMapper.toDomain(row);
    }
}
