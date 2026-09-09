import { describe, expect, it, vi } from "vitest";

import { GenerateNutritionPlanCommand } from "../../src/application/commands/generate-nutrition-plan.command";
import { GenerateNutritionPlanUseCase } from "../../src/application/use-cases/generate-nutrition-plan.use-case";
import {
    NutritionPlanGenerationInput,
    NutritionPlanGenerationResult,
    NutritionPlanGenerator,
} from "../../src/application/ports/nutrition-plan-generator.port";
import {
    NutritionPlanGenerationTransaction,
    NutritionPlanGenerationTransactionInput,
} from "../../src/application/ports/nutrition-plan-generation.transaction";
import { NutritionPlan } from "../../src/domain/entities/nutrition-plan/nutrition-plan.entity";

const tenantId = "tenant-1";
const actorUserId = "actor-1";
const athleteId = "athlete-1";

const macroTargets = {
    caloriesKcal: 2400,
    proteinGrams: 180,
    carbohydrateGrams: 240,
    fatGrams: 80,
};

const hydrationGuidance = {
    dailyWaterLitres: 2.5,
    unit: "LITRES_PER_DAY" as const,
};

function command(
    idempotencyKey = "nutrition-key-1",
    actor = actorUserId,
): GenerateNutritionPlanCommand {
    return new GenerateNutritionPlanCommand(
        tenantId,
        actor,
        idempotencyKey,
        {
            athleteId,
            macroTargets,
            hydrationGuidance,
            goal: "general fitness",
            dietaryPreferences: ["vegetarian"],
            dietaryRestrictions: ["peanuts"],
            notes: "Application boundary test",
        },
    );
}

function generatedResult(): NutritionPlanGenerationResult {
    return {
        generatorId: "TITAN_DETERMINISTIC_NUTRITION",
        generatorVersion: "1.0.0",
        planSnapshot: {
            planType: "AUTOMATED_NUTRITION_PLAN",
            goalClassification: "GENERAL_FITNESS",
            macroTargets,
            hydrationGuidance,
            guidance: [
                "Automated nutrition plan generated from the supplied athlete context.",
                "Daily hydration guidance is 2.5 litres per day.",
            ],
        },
    };
}

function harness(
    transactionOutcome:
        | { status: "created"; plan: NutritionPlan }
        | { status: "replayed"; plan: NutritionPlan } = {
        status: "created",
        plan: NutritionPlan.create(
            tenantId,
            athleteId,
            "nutrition-key-1",
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            "1",
            "TITAN_DETERMINISTIC_NUTRITION",
            "1.0.0",
            {
                fingerprintVersion: "1",
                tenantId,
                actorUserId,
                athleteId,
                macroTargets,
                hydrationGuidance,
                goal: "general fitness",
                dietaryPreferences: ["vegetarian"],
                dietaryRestrictions: ["peanuts"],
                notes: "Application boundary test",
            },
            generatedResult().planSnapshot,
        ),
    },
) {
    const generator: NutritionPlanGenerator = {
        generate: vi.fn(
            async (
                input: NutritionPlanGenerationInput,
            ): Promise<NutritionPlanGenerationResult> => {
                expect(input).toEqual({
                    athleteId,
                    macroTargets,
                    hydrationGuidance,
                    goal: "general fitness",
                    dietaryPreferences: ["vegetarian"],
                    dietaryRestrictions: ["peanuts"],
                    notes: "Application boundary test",
                });

                return generatedResult();
            },
        ),
    };

    const transaction: NutritionPlanGenerationTransaction = {
        execute: vi.fn(
            async (
                input: NutritionPlanGenerationTransactionInput,
            ) => transactionOutcome,
        ),
    };

    return {
        useCase: new GenerateNutritionPlanUseCase(
            generator,
            transaction,
        ),
        generator,
        transaction,
    };
}

describe("Generate Nutrition Plan application boundary", () => {
    it.each(["", "bad key", "a".repeat(201), "*"])(
        "rejects invalid idempotency key %j",
        key => {
            expect(() => command(key))
                .toThrow("Idempotency key is invalid.");
        },
    );

    it("normalizes an approved idempotency key", () => {
        const result = new GenerateNutritionPlanCommand(
            tenantId,
            actorUserId,
            " nutrition-key-1 ",
            {
                athleteId,
                macroTargets,
                hydrationGuidance,
            },
        );

        expect(result.idempotencyKey).toBe("nutrition-key-1");
        expect(result.tenantId).toBe(tenantId);
        expect(result.actorUserId).toBe(actorUserId);
        expect(result.input.athleteId).toBe(athleteId);
        expect(result.input.hydrationGuidance)
            .toEqual(hydrationGuidance);
    });

    it("generates a plan and passes tenant, actor and idempotency authority to one transaction", async () => {
        const { useCase, generator, transaction } = harness();

        const result = await useCase.execute(command());

        expect(result.status).toBe("created");
        expect(result.plan.tenantId).toBe(tenantId);
        expect(result.plan.athleteId).toBe(athleteId);
        expect(result.plan.idempotencyKey).toBe("nutrition-key-1");
        expect(result.plan.generatorId).toBe(
            "TITAN_DETERMINISTIC_NUTRITION",
        );
        expect(result.plan.generatorVersion).toBe("1.0.0");
        expect(result.plan.planSnapshot.goalClassification)
            .toBe("GENERAL_FITNESS");
        expect(result.plan.planSnapshot.macroTargets)
            .toEqual(macroTargets);
        expect(result.plan.planSnapshot.hydrationGuidance)
            .toEqual(hydrationGuidance);

        expect(generator.generate).toHaveBeenCalledOnce();
        expect(transaction.execute).toHaveBeenCalledOnce();

        const input =
            vi.mocked(transaction.execute).mock.calls[0][0];

        expect(input).toEqual(
            expect.objectContaining({
                tenantId,
                actorUserId,
                idempotencyKey: "nutrition-key-1",
                requestFingerprintVersion: "1",
                plan: expect.objectContaining({
                    tenantId,
                    athleteId,
                    idempotencyKey: "nutrition-key-1",
                }),
            }),
        );

        expect(input.requestFingerprint)
            .toMatch(/^[0-9a-f]{64}$/u);

        expect(Object.isFrozen(input)).toBe(true);
    });

    it("includes actor authority in the generation fingerprint", async () => {
        const first = harness();
        const second = harness();

        await first.useCase.execute(
            command("same-key", "actor-1"),
        );

        await second.useCase.execute(
            command("same-key", "actor-2"),
        );

        const firstInput =
            vi.mocked(first.transaction.execute).mock.calls[0][0];

        const secondInput =
            vi.mocked(second.transaction.execute).mock.calls[0][0];

        expect(firstInput.requestFingerprint)
            .not.toBe(secondInput.requestFingerprint);
    });

    it("returns replayed when the transaction identifies an idempotent retry", async () => {
        const replayPlan = NutritionPlan.create(
            tenantId,
            athleteId,
            "nutrition-key-1",
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            "1",
            "TITAN_DETERMINISTIC_NUTRITION",
            "1.0.0",
            {
                fingerprintVersion: "1",
                tenantId,
                actorUserId,
                athleteId,
                macroTargets,
                hydrationGuidance,
            },
            generatedResult().planSnapshot,
        );

        const { useCase } = harness({
            status: "replayed",
            plan: replayPlan,
        });

        const result = await useCase.execute(command());

        expect(result.status).toBe("replayed");
        expect(result.plan.id).toBe(replayPlan.id);
    });

    it("propagates generator infrastructure failure", async () => {
        const { useCase, generator, transaction } = harness();

        vi.mocked(generator.generate).mockRejectedValueOnce(
            new Error("generator unavailable"),
        );

        await expect(
            useCase.execute(command()),
        ).rejects.toThrow("generator unavailable");

        expect(transaction.execute).not.toHaveBeenCalled();
    });

    it("propagates transaction failure", async () => {
        const { useCase, transaction } = harness();

        vi.mocked(transaction.execute).mockRejectedValueOnce(
            new Error("database unavailable"),
        );

        await expect(
            useCase.execute(command()),
        ).rejects.toThrow("database unavailable");
    });
});
