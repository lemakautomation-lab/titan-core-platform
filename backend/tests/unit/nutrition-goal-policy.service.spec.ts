import { describe, expect, it } from "vitest";

import {
    classifyNutritionGoal,
    goalSpecificNutritionGuidance,
} from "../../src/application/services/nutrition-goal-policy.service";

describe("Nutrition goal classification policy", () => {
    it.each([
        ["GENERAL_FITNESS", "GENERAL_FITNESS"],
        ["general fitness", "GENERAL_FITNESS"],
        ["General Fitness", "GENERAL_FITNESS"],
        ["general-fitness", "GENERAL_FITNESS"],
        ["  general fitness  ", "GENERAL_FITNESS"],
        ["SPORT_PERFORMANCE", "SPORT_PERFORMANCE"],
        ["sport performance", "SPORT_PERFORMANCE"],
        ["Sport Performance", "SPORT_PERFORMANCE"],
        ["sport-performance", "SPORT_PERFORMANCE"],
        ["  sport performance  ", "SPORT_PERFORMANCE"],
    ] as const)(
        "classifies supported goal %j as %s",
        (goal, expected) => {
            expect(classifyNutritionGoal(goal)).toBe(expected);
        },
    );

    it.each([
        undefined,
        "",
        "  ",
        "weight management",
        "fat loss",
        "recovery",
        "UNKNOWN",
    ])("returns undefined for unclassified goal %j", (goal) => {
        expect(classifyNutritionGoal(goal)).toBeUndefined();
    });
});

describe("Nutrition goal-specific guidance policy", () => {
    it("returns general fitness guidance for the general fitness goal", () => {
        expect(
            goalSpecificNutritionGuidance("general fitness"),
        ).toBe(
            "Nutrition guidance is aligned to general fitness and balanced daily energy needs.",
        );
    });

    it("returns sport performance guidance for the sport performance goal", () => {
        expect(
            goalSpecificNutritionGuidance("sport-performance"),
        ).toBe(
            "Nutrition guidance is aligned to sport performance and supporting training demands.",
        );
    });

    it.each([
        undefined,
        "",
        "weight management",
        "unknown",
    ])("returns undefined guidance for an unclassified goal %j", (goal) => {
        expect(goalSpecificNutritionGuidance(goal)).toBeUndefined();
    });
});
