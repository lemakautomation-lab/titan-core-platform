import { describe, expect, it, vi } from "vitest";

import { CreateShoppingListCommand } from "../../src/application/commands/create-shopping-list.command";
import { CreateShoppingListUseCase } from "../../src/application/use-cases/create-shopping-list.use-case";
import { ShoppingList } from "../../src/domain/entities/shopping-list/shopping-list.entity";

function command(
    tenantId = "tenant-1",
    athleteId = "athlete-1",
    mealPlanId = "meal-plan-1",
) {
    return new CreateShoppingListCommand(
        tenantId,
        "user-1",
        athleteId,
        mealPlanId,
        "Performance Shopping List",
        [
            {
                name: "Chicken Breast",
                quantity: 2,
                unit: "kg",
            },
            {
                name: "Rice",
                quantity: 1,
                unit: "kg",
            },
        ],
    );
}

function mealPlan(
    tenantId = "tenant-1",
    athleteId = "athlete-1",
) {
    return {
        id: "meal-plan-1",
        tenantId,
        athleteId,
        name: "Performance Meal Plan",
    } as never;
}

describe("CreateShoppingListUseCase", () => {
    it("creates a shopping list for a tenant-scoped meal plan", async () => {
        const mealPlanRepository = {
            findById: vi.fn().mockResolvedValue(mealPlan()),
        };

        const created = ShoppingList.create(
            "tenant-1",
            "athlete-1",
            "meal-plan-1",
            "Performance Shopping List",
            command().items,
        );

        const shoppingListRepository = {
            create: vi.fn().mockResolvedValue(created),
        };

        const useCase = new CreateShoppingListUseCase(
            shoppingListRepository,
            mealPlanRepository,
        );

        const result = await useCase.execute(command());

        expect(
            mealPlanRepository.findById,
        ).toHaveBeenCalledWith(
            "meal-plan-1",
            "tenant-1",
        );

        expect(
            shoppingListRepository.create,
        ).toHaveBeenCalledTimes(1);

        expect(result.tenantId).toBe("tenant-1");
        expect(result.athleteId).toBe("athlete-1");
        expect(result.mealPlanId).toBe("meal-plan-1");
        expect(result.name).toBe("Performance Shopping List");
        expect(result.items).toHaveLength(2);
    });

    it("rejects a meal plan outside the command tenant", async () => {
        const mealPlanRepository = {
            findById: vi.fn().mockResolvedValue(null),
        };

        const shoppingListRepository = {
            create: vi.fn(),
        };

        const useCase = new CreateShoppingListUseCase(
            shoppingListRepository,
            mealPlanRepository,
        );

        await expect(
            useCase.execute(
                command("tenant-2", "athlete-1", "meal-plan-1"),
            ),
        ).rejects.toThrow("Meal plan not found.");

        expect(
            shoppingListRepository.create,
        ).not.toHaveBeenCalled();

        expect(
            mealPlanRepository.findById,
        ).toHaveBeenCalledWith(
            "meal-plan-1",
            "tenant-2",
        );
    });

    it("rejects a meal plan belonging to another athlete", async () => {
        const mealPlanRepository = {
            findById: vi.fn().mockResolvedValue(
                mealPlan("tenant-1", "athlete-2"),
            ),
        };

        const shoppingListRepository = {
            create: vi.fn(),
        };

        const useCase = new CreateShoppingListUseCase(
            shoppingListRepository,
            mealPlanRepository,
        );

        await expect(
            useCase.execute(command()),
        ).rejects.toThrow("Meal plan not found.");

        expect(
            shoppingListRepository.create,
        ).not.toHaveBeenCalled();
    });

    it("rejects an invalid application command", async () => {
        const useCase = new CreateShoppingListUseCase(
            { create: vi.fn() },
            { findById: vi.fn() },
        );

        await expect(
            useCase.execute({} as CreateShoppingListCommand),
        ).rejects.toThrow(
            "Shopping list creation command is required.",
        );
    });

    it("preserves structured shopping items at the application boundary", async () => {
        const mealPlanRepository = {
            findById: vi.fn().mockResolvedValue(mealPlan()),
        };

        const shoppingListRepository = {
            create: vi.fn().mockImplementation(
                async (list: ShoppingList) => list,
            ),
        };

        const useCase = new CreateShoppingListUseCase(
            shoppingListRepository,
            mealPlanRepository,
        );

        const result = await useCase.execute(command());

        expect(result.items).toEqual([
            {
                name: "Chicken Breast",
                quantity: 2,
                unit: "kg",
            },
            {
                name: "Rice",
                quantity: 1,
                unit: "kg",
            },
        ]);
    });
});
