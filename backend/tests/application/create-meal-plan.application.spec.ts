import { describe, expect, it, vi } from "vitest";

import { CreateMealPlanCommand } from "../../src/application/commands/create-meal-plan.command";
import { CreateMealPlanUseCase } from "../../src/application/use-cases/create-meal-plan.use-case";
import { MealPlan } from "../../src/domain/entities/meal-plan/meal-plan.entity";

function command(
    tenantId = "tenant-1",
    athleteId = "athlete-1",
) {
    return new CreateMealPlanCommand(
        tenantId,
        "user-1",
        athleteId,
        "Performance Meal Plan",
        "Structured weekly nutrition plan.",
        [
            {
                ordinal: 1,
                name: "Breakfast",
                caloriesKcal: 600,
                proteinGrams: 40,
                carbohydrateGrams: 70,
                fatGrams: 15,
            },
        ],
    );
}

describe("CreateMealPlanUseCase", () => {
    it("creates a meal plan for a tenant-scoped athlete", async () => {
        const athleteRepository = {
            findById: vi.fn().mockResolvedValue({
                id: "athlete-1",
                tenantId: "tenant-1",
            }),
        };

        const created = MealPlan.create(
            "tenant-1",
            "athlete-1",
            "Performance Meal Plan",
            "Structured weekly nutrition plan.",
            {
                planType: "MEAL_PLAN",
                meals: [
                    {
                        ordinal: 1,
                        name: "Breakfast",
                    },
                ],
            },
        );

        const mealPlanRepository = {
            create: vi.fn().mockResolvedValue(created),
        };

        const useCase = new CreateMealPlanUseCase(
            mealPlanRepository,
            athleteRepository,
        );

        const result = await useCase.execute(command());

        expect(
            athleteRepository.findById,
        ).toHaveBeenCalledWith("athlete-1", "tenant-1");

        expect(
            mealPlanRepository.create,
        ).toHaveBeenCalledTimes(1);

        expect(result.tenantId).toBe("tenant-1");
        expect(result.athleteId).toBe("athlete-1");
        expect(result.name).toBe("Performance Meal Plan");
        expect(result.version).toBe(1);
        expect(result.status).toBe("DRAFT");
        expect(result.planSnapshot.planType).toBe("MEAL_PLAN");
    });

    it("rejects an athlete outside the command tenant", async () => {
        const athleteRepository = {
            findById: vi.fn().mockResolvedValue(null),
        };

        const mealPlanRepository = {
            create: vi.fn(),
        };

        const useCase = new CreateMealPlanUseCase(
            mealPlanRepository,
            athleteRepository,
        );

        await expect(
            useCase.execute(command("tenant-2", "athlete-1")),
        ).rejects.toThrow("Athlete not found.");

        expect(mealPlanRepository.create).not.toHaveBeenCalled();
        expect(
            athleteRepository.findById,
        ).toHaveBeenCalledWith("athlete-1", "tenant-2");
    });

    it("rejects an invalid application command", async () => {
        const useCase = new CreateMealPlanUseCase(
            { create: vi.fn() },
            { findById: vi.fn() },
        );

        await expect(
            useCase.execute({} as CreateMealPlanCommand),
        ).rejects.toThrow(
            "Meal plan creation command is required.",
        );
    });

    it("preserves structured meal data at the application boundary", async () => {
        const athleteRepository = {
            findById: vi.fn().mockResolvedValue({
                id: "athlete-1",
                tenantId: "tenant-1",
            }),
        };

        const mealPlanRepository = {
            create: vi.fn().mockImplementation(
                async (plan: MealPlan) => plan,
            ),
        };

        const useCase = new CreateMealPlanUseCase(
            mealPlanRepository,
            athleteRepository,
        );

        const result = await useCase.execute(command());

        expect(result.planSnapshot.meals).toEqual([
            {
                ordinal: 1,
                name: "Breakfast",
                caloriesKcal: 600,
                proteinGrams: 40,
                carbohydrateGrams: 70,
                fatGrams: 15,
            },
        ]);
    });
});
