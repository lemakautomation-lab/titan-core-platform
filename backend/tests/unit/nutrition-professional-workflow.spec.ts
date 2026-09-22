import { describe, expect, it, vi } from "vitest";

import { GetNutritionProfessionalWorkflowUseCase } from "../../src/application/use-cases/get-nutrition-professional-workflow.use-case";
import { AthleteRepository } from "../../src/domain/repositories/athlete.repository";
import { AthleteRelationshipRepository } from "../../src/domain/repositories/athlete-relationship.repository";
import { NutritionPlanRepository } from "../../src/domain/repositories/nutrition-plan/nutrition-plan.repository";
import { NutritionPlan } from "../../src/domain/entities/nutrition-plan/nutrition-plan.entity";

function createHarness(options?: {
    athleteExists?: boolean;
    relationshipActive?: boolean;
    plan?: NutritionPlan | null;
}) {
    const athleteExists = options?.athleteExists ?? true;
    const relationshipActive =
        options?.relationshipActive ?? true;

    const athleteRepository = {
        findById: vi.fn(async () =>
            athleteExists ? ({} as never) : null),
    } as unknown as AthleteRepository;

    const relationshipRepository = {
        findByAthleteAndRelatedEntity: vi.fn(async () =>
            relationshipActive
                ? ({ isActive: () => true } as never)
                : null),
    } as unknown as AthleteRelationshipRepository;

    const nutritionPlanRepository = {
        findById: vi.fn(),
        findByIdempotencyKey: vi.fn(),
        findLatestForAthlete: vi.fn(
            async () => options?.plan ?? null,
        ),
        create: vi.fn(),
    } as unknown as NutritionPlanRepository;

    return {
        athleteRepository,
        relationshipRepository,
        nutritionPlanRepository,
        useCase:
            new GetNutritionProfessionalWorkflowUseCase(
                athleteRepository,
                relationshipRepository,
                nutritionPlanRepository,
            ),
    };
}

const query = {
    tenantId: "tenant-1",
    userId: "professional-1",
    athleteId: "athlete-1",
};

describe("Nutrition Professional workflow", () => {
    it("rejects an Athlete outside the authenticated tenant", async () => {
        const harness = createHarness({
            athleteExists: false,
        });

        const result =
            await harness.useCase.execute(query);

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe("Athlete not found.");
        expect(
            harness.athleteRepository.findById,
        ).toHaveBeenCalledWith(
            "athlete-1",
            "tenant-1",
        );
        expect(
            harness.nutritionPlanRepository
                .findLatestForAthlete,
        ).not.toHaveBeenCalled();
    });

    it("requires an active Performance Professional relationship", async () => {
        const harness = createHarness({
            relationshipActive: false,
        });

        const result =
            await harness.useCase.execute(query);

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Active Performance Professional athlete relationship is required.",
        );
        expect(
            harness.nutritionPlanRepository
                .findLatestForAthlete,
        ).not.toHaveBeenCalled();
    });

    it("returns a safe empty state when no plan exists", async () => {
        const harness = createHarness({
            plan: null,
        });

        const result =
            await harness.useCase.execute(query);

        expect(result.isSuccess).toBe(true);
        expect(result.value).toEqual({
            athleteId: "athlete-1",
            latestNutritionPlan: null,
        });
        expect(
            harness.nutritionPlanRepository
                .findLatestForAthlete,
        ).toHaveBeenCalledWith(
            "tenant-1",
            "athlete-1",
        );
    });

    it("returns the latest authorised Nutrition Plan without sensitive generation input", async () => {
        const plan = {
            id: "plan-1",
            tenantId: "tenant-1",
            athleteId: "athlete-1",
            idempotencyKey: "secret-key",
            generatorId: "titan-nutrition",
            generatorVersion: "1",
            inputSnapshot: {
                privateInput: "not exposed",
            },
            planSnapshot: {
                planType: "AUTOMATED_NUTRITION_PLAN",
                goalClassification: "SPORT_PERFORMANCE",
                macroTargets: {
                    caloriesKcal: 2800,
                    proteinGrams: 180,
                    carbohydrateGrams: 340,
                    fatGrams: 80,
                },
                hydrationGuidance: {
                    dailyWaterLitres: 3,
                    unit: "LITRES_PER_DAY",
                },
                guidance: [
                    "Performance nutrition guidance.",
                ],
            },
            createdAt:
                new Date("2026-09-22T12:00:00.000Z"),
        } as NutritionPlan;

        const harness = createHarness({ plan });

        const result =
            await harness.useCase.execute(query);

        expect(result.isSuccess).toBe(true);
        expect(result.value?.latestNutritionPlan).toEqual({
            id: "plan-1",
            athleteId: "athlete-1",
            generatorId: "titan-nutrition",
            generatorVersion: "1",
            planSnapshot: plan.planSnapshot,
            createdAt:
                "2026-09-22T12:00:00.000Z",
        });

        expect(
            result.value?.latestNutritionPlan,
        ).not.toHaveProperty("idempotencyKey");
        expect(
            result.value?.latestNutritionPlan,
        ).not.toHaveProperty("inputSnapshot");
        expect(
            result.value?.latestNutritionPlan,
        ).not.toHaveProperty("tenantId");
    });
});
