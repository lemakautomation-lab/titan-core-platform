import { describe, expect, it } from "vitest";
import { DeterministicNutritionPlanGenerator } from "../../src/application/services/deterministic-nutrition-plan-generator.service";

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

describe("DeterministicNutritionPlanGenerator", () => {
    const generator = new DeterministicNutritionPlanGenerator();

    it("generates an automated nutrition plan from valid athlete context", async () => {
        const result = await generator.generate({
            athleteId: "athlete-1",
            macroTargets,
            hydrationGuidance,
            goal: "general fitness",
            dietaryPreferences: ["vegetarian"],
            dietaryRestrictions: ["peanuts"],
        });

        expect(result.generatorId).toBe(
            "TITAN_DETERMINISTIC_NUTRITION",
        );
        expect(result.generatorVersion).toBe("1.0.0");
        expect(result.planSnapshot.planType).toBe(
            "AUTOMATED_NUTRITION_PLAN",
        );
        expect(result.planSnapshot.goalClassification).toBe(
            "GENERAL_FITNESS",
        );
        expect(result.planSnapshot.macroTargets).toEqual(macroTargets);
        expect(result.planSnapshot.hydrationGuidance)
            .toEqual(hydrationGuidance);
        expect(result.planSnapshot.guidance).toContain(
            "Automated nutrition plan generated from the supplied athlete context.",
        );
        expect(result.planSnapshot.guidance).toContain(
            "This automated nutrition guidance is general, non-clinical information and does not diagnose, treat, or prescribe for medical conditions. Seek qualified professional advice for medical or condition-specific needs.",
        );
        expect(result.planSnapshot.guidance).toContain(
            "Daily hydration guidance is 2.5 litres per day.",
        );
        expect(result.planSnapshot.guidance).toContain(
            "Plan context includes the stated goal: general fitness.",
        );
        expect(result.planSnapshot.guidance).toContain(
            "Nutrition guidance is aligned to general fitness and balanced daily energy needs.",
        );
    });

    it("generates distinct goal-specific guidance for sport performance", async () => {
        const result = await generator.generate({
            athleteId: "athlete-1",
            macroTargets,
            hydrationGuidance,
            goal: "SPORT_PERFORMANCE",
        });

        expect(result.planSnapshot.goalClassification).toBe(
            "SPORT_PERFORMANCE",
        );
        expect(result.planSnapshot.guidance).toContain(
            "Plan context includes the stated goal: SPORT_PERFORMANCE.",
        );
        expect(result.planSnapshot.guidance).toContain(
            "Nutrition guidance is aligned to sport performance and supporting training demands.",
        );
        expect(result.planSnapshot.guidance).not.toContain(
            "Nutrition guidance is aligned to general fitness and balanced daily energy needs.",
        );
        expect(result.planSnapshot.macroTargets).toEqual(macroTargets);
        expect(result.planSnapshot.hydrationGuidance)
            .toEqual(hydrationGuidance);
    });

    it("preserves generic goal context for an unclassified goal", async () => {
        const result = await generator.generate({
            athleteId: "athlete-1",
            macroTargets,
            hydrationGuidance,
            goal: "weight management",
        });

        expect(result.planSnapshot.goalClassification).toBeUndefined();
        expect(result.planSnapshot.guidance).toContain(
            "Plan context includes the stated goal: weight management.",
        );
        expect(result.planSnapshot.guidance).not.toContain(
            "Nutrition guidance is aligned to general fitness and balanced daily energy needs.",
        );
        expect(result.planSnapshot.guidance).not.toContain(
            "Nutrition guidance is aligned to sport performance and supporting training demands.",
        );
    });

    it("generates the baseline plan without requiring later nutrition-engine controls", async () => {
        const result = await generator.generate({
            athleteId: "athlete-1",
            macroTargets,
            hydrationGuidance,
        });

        expect(result.planSnapshot.planType).toBe(
            "AUTOMATED_NUTRITION_PLAN",
        );
        expect(result.planSnapshot.goalClassification).toBeUndefined();
        expect(result.planSnapshot.macroTargets).toEqual(macroTargets);
        expect(result.planSnapshot.hydrationGuidance)
            .toEqual(hydrationGuidance);
        expect(result.planSnapshot.guidance).toHaveLength(3);
    });

    it("rejects missing athlete identity", async () => {
        await expect(
            generator.generate({
                athleteId: "",
                macroTargets,
                hydrationGuidance,
            }),
        ).rejects.toThrow(
            "Nutrition generation input is required.",
        );
    });

    it("rejects invalid macro targets", async () => {
        await expect(
            generator.generate({
                athleteId: "athlete-1",
                macroTargets: {
                    ...macroTargets,
                    caloriesKcal: 0,
                },
                hydrationGuidance,
            }),
        ).rejects.toThrow(
            "Macro target caloriesKcal must be a finite positive number.",
        );
    });

    it("rejects invalid hydration guidance", async () => {
        await expect(
            generator.generate({
                athleteId: "athlete-1",
                macroTargets,
                hydrationGuidance: {
                    dailyWaterLitres: 0,
                    unit: "LITRES_PER_DAY",
                },
            }),
        ).rejects.toThrow(
            "Hydration dailyWaterLitres must be a finite positive number.",
        );
    });
});
