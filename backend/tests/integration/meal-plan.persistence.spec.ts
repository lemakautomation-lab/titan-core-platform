import { describe, expect, it } from "vitest";

import { MealPlan } from "../../src/domain/entities/meal-plan/meal-plan.entity";
import { DatabaseService } from "../../src/infrastructure/database/database.service";
import { PrismaMealPlanRepository } from "../../src/infrastructure/repositories/meal-plan/meal-plan.repository";
import { createTestUser } from "../factories/user.factory";
import { testPrisma } from "../helpers/prisma-test.client";

async function context() {
    const owner = await createTestUser();
    const other = await createTestUser();

    const athlete = await testPrisma.athlete.create({
        data: {
            tenantId: owner.tenant.id,
            firstName: "Meal",
            lastName: "Athlete",
        },
    });

    return { owner, other, athlete };
}

function mealPlan(tenantId: string, athleteId: string) {
    return MealPlan.create(
        tenantId,
        athleteId,
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
}

describe("Meal Plan persistence", () => {
    it("persists and retrieves a meal plan", async () => {
        const data = await context();
        const repository = new PrismaMealPlanRepository(
            new DatabaseService(),
        );

        const created = await repository.create(
            mealPlan(data.owner.tenant.id, data.athlete.id),
        );

        expect(created.tenantId).toBe(data.owner.tenant.id);
        expect(created.athleteId).toBe(data.athlete.id);
        expect(created.name).toBe("Performance Meal Plan");
        expect(created.version).toBe(1);
        expect(created.status).toBe("DRAFT");

        const retrieved = await repository.findById(
            created.id,
            data.owner.tenant.id,
        );

        expect(retrieved?.id).toBe(created.id);
        expect(retrieved?.planSnapshot.planType).toBe("MEAL_PLAN");
    });

    it("lists only meal plans for the specified tenant and athlete", async () => {
        const data = await context();
        const repository = new PrismaMealPlanRepository(
            new DatabaseService(),
        );

        await repository.create(
            mealPlan(data.owner.tenant.id, data.athlete.id),
        );

        expect(
            await repository.findByAthlete(
                data.athlete.id,
                data.owner.tenant.id,
            ),
        ).toHaveLength(1);

        expect(
            await repository.findByAthlete(
                data.athlete.id,
                data.other.tenant.id,
            ),
        ).toHaveLength(0);
    });

    it("does not expose a meal plan across tenants", async () => {
        const data = await context();
        const repository = new PrismaMealPlanRepository(
            new DatabaseService(),
        );

        const created = await repository.create(
            mealPlan(data.owner.tenant.id, data.athlete.id),
        );

        expect(
            await repository.findById(
                created.id,
                data.other.tenant.id,
            ),
        ).toBeNull();
    });

    it("enforces the tenant-safe athlete relationship", async () => {
        const data = await context();
        const otherAthlete = await testPrisma.athlete.create({
            data: {
                tenantId: data.other.tenant.id,
                firstName: "Other",
                lastName: "Athlete",
            },
        });

        await expect(
            testPrisma.mealPlan.create({
                data: {
                    tenantId: data.owner.tenant.id,
                    athleteId: otherAthlete.id,
                    name: "Invalid Tenant Plan",
                    version: 1,
                    status: "DRAFT",
                    planSnapshot: {
                        planType: "MEAL_PLAN",
                        meals: [],
                    },
                },
            }),
        ).rejects.toBeDefined();
    });
});
