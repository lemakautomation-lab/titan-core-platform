import { describe, expect, it } from "vitest";
import { DeterministicNutritionPlanGenerator } from "../../src/application/services/deterministic-nutrition-plan-generator.service";

describe("DeterministicNutritionPlanGenerator", () => {
    const generator = new DeterministicNutritionPlanGenerator();

    it("generates an automated nutrition plan from valid athlete context", async () => {
        const result = await generator.generate({
            athleteId: "athlete-1",
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
        expect(result.planSnapshot.guidance).toContain(
            "Automated nutrition plan generated from the supplied athlete context.",
        );
        expect(result.planSnapshot.guidance).toContain(
            "Plan context includes the stated goal: general fitness.",
        );
    });

    it("does not require later nutrition-engine controls to generate the baseline plan", async () => {
        const result = await generator.generate({
            athleteId: "athlete-1",
        });

        expect(result.planSnapshot.planType).toBe(
            "AUTOMATED_NUTRITION_PLAN",
        );
        expect(result.planSnapshot.guidance).toHaveLength(1);
    });

    it("rejects missing athlete identity", async () => {
        await expect(
            generator.generate({
                athleteId: "",
            }),
        ).rejects.toThrow(
            "Nutrition generation input is required.",
        );
    });
});
