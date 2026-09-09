import { MealPlanRepository } from "../../domain/repositories/meal-plan/meal-plan.repository";
import { ShoppingList } from "../../domain/entities/shopping-list/shopping-list.entity";
import { ShoppingListRepository } from "../../domain/repositories/shopping-list/shopping-list.repository";
import { CreateShoppingListCommand } from "../commands/create-shopping-list.command";
import {
    ShoppingListApplicationMapper,
    ShoppingListDto,
} from "../dto/shopping-list/shopping-list.dto";

export class CreateShoppingListUseCase {
    constructor(
        private readonly shoppingListRepository: ShoppingListRepository,
        private readonly mealPlanRepository: MealPlanRepository,
    ) {}

    async execute(
        command: CreateShoppingListCommand,
    ): Promise<ShoppingListDto> {
        if (!(command instanceof CreateShoppingListCommand)) {
            throw new Error(
                "Shopping list creation command is required.",
            );
        }

        const mealPlan = await this.mealPlanRepository.findById(
            command.mealPlanId,
            command.tenantId,
        );

        if (!mealPlan || mealPlan.athleteId !== command.athleteId) {
            throw new Error("Meal plan not found.");
        }

        const shoppingList = ShoppingList.create(
            command.tenantId,
            command.athleteId,
            command.mealPlanId,
            command.name,
            command.items,
        );

        const created =
            await this.shoppingListRepository.create(shoppingList);

        return ShoppingListApplicationMapper.toDto(created);
    }
}
