import { describe, expect, it } from "vitest";
import {
    NON_CLINICAL_NUTRITION_GUIDANCE,
    nonClinicalNutritionGuidance,
} from "../../src/application/services/nutrition-guidance-policy.service";

describe("Nutrition guidance policy", () => {
    it("provides the canonical non-clinical boundary statement", () => {
        expect(nonClinicalNutritionGuidance()).toBe(
            NON_CLINICAL_NUTRITION_GUIDANCE,
        );
    });

    it("explicitly excludes diagnosis, treatment and prescription", () => {
        const guidance = nonClinicalNutritionGuidance();

        expect(guidance).toContain("general, non-clinical information");
        expect(guidance).toContain("does not diagnose");
        expect(guidance).toContain("treat");
        expect(guidance).toContain("prescribe");
        expect(guidance).toContain(
            "Seek qualified professional advice",
        );
    });
});
