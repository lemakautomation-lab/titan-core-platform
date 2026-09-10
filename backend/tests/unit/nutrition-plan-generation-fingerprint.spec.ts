import { describe, expect, it } from "vitest";

import { GenerateNutritionPlanCommand } from "../../src/application/commands/generate-nutrition-plan.command";
import { NutritionPlanGenerationFingerprintService } from "../../src/application/services/nutrition-plan-generation-fingerprint.service";

function command(
    goal: string | undefined = "general fitness",
    actorUserId = "actor-1",
    includeGoal = true,
) {
    return new GenerateNutritionPlanCommand(
        "tenant-1",
        actorUserId,
        "nutrition-key-1",
        {
            athleteId: "athlete-1",
            macroTargets: {
                calories: 2200,
                proteinGrams: 150,
                carbohydratesGrams: 220,
                fatGrams: 70,
            },
            hydrationGuidance: {
                dailyWaterLitres: 2.5,
                unit: "LITRES_PER_DAY",
            },            ...(includeGoal ? { goal } : {}),
            dietaryPreferences: ["vegetarian"],
            dietaryRestrictions: ["peanuts"],
            notes: "Fingerprint contract test",
        },
    );
}

describe("Nutrition plan generation fingerprints", () => {
    it("canonicalizes recognized general-fitness goal aliases", () => {
        const canonical = NutritionPlanGenerationFingerprintService.request(
            command("GENERAL_FITNESS"),
        );
        const spaced = NutritionPlanGenerationFingerprintService.request(
            command("general fitness"),
        );
        const hyphenated = NutritionPlanGenerationFingerprintService.request(
            command("general-fitness"),
        );

        expect(canonical.snapshot).toEqual(
            expect.objectContaining({
                goalClassification: "GENERAL_FITNESS",
            }),
        );
        expect(canonical.snapshot).not.toHaveProperty("goal");

        expect(spaced.fingerprint).toBe(canonical.fingerprint);
        expect(hyphenated.fingerprint).toBe(canonical.fingerprint);
        expect(spaced.canonicalJson).toBe(canonical.canonicalJson);
        expect(hyphenated.canonicalJson).toBe(canonical.canonicalJson);
    });

    it("canonicalizes recognized sport-performance goal aliases", () => {
        const canonical = NutritionPlanGenerationFingerprintService.request(
            command("SPORT_PERFORMANCE"),
        );
        const spaced = NutritionPlanGenerationFingerprintService.request(
            command("sport performance"),
        );
        const hyphenated = NutritionPlanGenerationFingerprintService.request(
            command("sport-performance"),
        );

        expect(canonical.snapshot).toEqual(
            expect.objectContaining({
                goalClassification: "SPORT_PERFORMANCE",
            }),
        );
        expect(canonical.snapshot).not.toHaveProperty("goal");

        expect(spaced.fingerprint).toBe(canonical.fingerprint);
        expect(hyphenated.fingerprint).toBe(canonical.fingerprint);
        expect(spaced.canonicalJson).toBe(canonical.canonicalJson);
        expect(hyphenated.canonicalJson).toBe(canonical.canonicalJson);
    });

    it("keeps recognized goals distinct", () => {
        const fitness =
            NutritionPlanGenerationFingerprintService.request(
                command("GENERAL_FITNESS"),
            );
        const performance =
            NutritionPlanGenerationFingerprintService.request(
                command("SPORT_PERFORMANCE"),
            );

        expect(fitness.fingerprint).not.toBe(performance.fingerprint);
        expect(fitness.canonicalJson).not.toBe(performance.canonicalJson);
    });

    it("preserves unsupported goal text as request identity", () => {
        const first =
            NutritionPlanGenerationFingerprintService.request(
                command("weight management"),
            );
        const second =
            NutritionPlanGenerationFingerprintService.request(
                command("fat loss"),
            );

        expect(first.snapshot).toEqual(
            expect.objectContaining({
                goal: "weight management",
            }),
        );
        expect(first.snapshot).not.toHaveProperty("goalClassification");
        expect(first.fingerprint).not.toBe(second.fingerprint);
    });

    it("preserves absent goal identity", () => {
        const result =
            NutritionPlanGenerationFingerprintService.request(command("general fitness", "actor-1", false));

        expect(result.snapshot).toEqual(
            expect.objectContaining({
                goal: null,
            }),
        );
    });

    it("includes actor authority in the canonical fingerprint", () => {
        const first =
            NutritionPlanGenerationFingerprintService.request(
                command("GENERAL_FITNESS", "actor-1"),
            );
        const second =
            NutritionPlanGenerationFingerprintService.request(
                command("GENERAL_FITNESS", "actor-2"),
            );

        expect(first.fingerprint).not.toBe(second.fingerprint);
        expect(first.canonicalJson).toContain(
            '"actorUserId":"actor-1"',
        );
        expect(second.canonicalJson).toContain(
            '"actorUserId":"actor-2"',
        );
    });

    it("returns immutable fingerprint state", () => {
        const result =
            NutritionPlanGenerationFingerprintService.request(command("general fitness", "actor-1", false));

        expect(Object.isFrozen(result)).toBe(true);
        expect(Object.isFrozen(result.snapshot)).toBe(true);
    });

    it("uses fingerprint version 1", () => {
        const result =
            NutritionPlanGenerationFingerprintService.request(command("general fitness", "actor-1", false));

        expect(result.fingerprintVersion).toBe("1");
        expect(result.canonicalJson).toContain(
            '"fingerprintVersion":"1"',
        );
    });
});
