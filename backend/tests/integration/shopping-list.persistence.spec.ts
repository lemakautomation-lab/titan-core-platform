import { describe, expect, it } from "vitest";
import { DatabaseService } from "../../src/infrastructure/database/database.service";
import { PrismaShoppingListRepository } from "../../src/infrastructure/repositories/shopping-list/shopping-list.repository";
import { ShoppingList } from "../../src/domain/entities/shopping-list/shopping-list.entity";

describe("Shopping List persistence", () => {
    const database = new DatabaseService();
    const repository = new PrismaShoppingListRepository(database);

    it("persists and retrieves a tenant-scoped shopping list", async () => {
        const tenant = await database.prisma.tenant.create({
            data: { name: `Shopping Tenant ${Date.now()}`, slug: `shopping-${Date.now()}` },
        });

        const athlete = await database.prisma.athlete.create({
            data: {
                tenantId: tenant.id,
                firstName: "Shopping",
                lastName: "Athlete",
            },
        });

        const mealPlan = await database.prisma.mealPlan.create({
            data: {
                tenantId: tenant.id,
                athleteId: athlete.id,
                name: "Meal Plan",
                planSnapshot: { planType: "MEAL_PLAN", meals: [] },
            },
        });

        const list = ShoppingList.create(
            tenant.id,
            athlete.id,
            mealPlan.id,
            "Weekly Shopping",
            [
                { name: "Chicken", quantity: 2, unit: "kg" },
                { name: "Rice", quantity: 1, unit: "kg" },
            ],
        );

        const created = await repository.create(list);
        const found = await repository.findById(created.id, tenant.id);

        expect(found?.athleteId).toBe(athlete.id);
        expect(found?.mealPlanId).toBe(mealPlan.id);
        expect(found?.items).toHaveLength(2);
    });
});
