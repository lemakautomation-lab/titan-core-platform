import { describe, expect, it, vi } from "vitest";
import { GetMyAiAthleteGuidanceUseCase } from "../../src/application/use-cases/get-my-ai-athlete-guidance.use-case";
import { ProgrammeGoalClassification } from "../../src/domain/enums/programme-goal-classification.enum";
import type { AthleteIntelligenceAggregate } from "../../src/application/intelligence/athlete-aggregation";
import type { GuidanceFacts } from "../../src/application/ai-athlete/performance-guidance";
const empty: AthleteIntelligenceAggregate = { athleteId: "private", goals: null, training: null,
    nutrition: null, recovery: null, wearables: null, performanceTests: null, sportRequirements: null };
const advice = { summary: "Review your goals with your coach.", actions: ["Track attendance."] };
const input = { tenantId: "tenant", userId: "user" };
function sources(goals: boolean, training: boolean): AthleteIntelligenceAggregate {
    return { ...empty,
        goals: goals ? { athleteId: "private", primaryGoal: ProgrammeGoalClassification.STRENGTH, secondaryGoals: [] } : null,
        training: training ? { athleteId: "private", programmes: [{ id: "private", name: "Private",
            status: "ACTIVE", trainingFrequency: 3, updatedAt: new Date() }] } : null,
    };
}
describe("Mission 074.5 guidance limitations", () => {
    it.each([
        [false, false, "NONE"], [true, false, "GOALS_ONLY"],
        [false, true, "TRAINING_ONLY"], [true, true, "GOALS_AND_TRAINING"],
    ] as const)("classifies usable facts without implying calibrated confidence (%s, %s)", async (goals, training, coverage) => {
        const generate = vi.fn().mockResolvedValue(advice);
        const result = await new GetMyAiAthleteGuidanceUseCase({ execute: vi.fn().mockResolvedValue({
            sources: sources(goals, training), generatedAt: new Date().toISOString(),
        }) }, { generate }).execute(input);
        expect(result?.limitations.coverage).toBe(coverage);
        expect(result?.limitations.confidence).toBe("NOT_ASSESSED");
        expect(result?.limitations.notices).toHaveLength(5);
        expect(result?.limitations.notices.join(" ")).toContain("not proof");
        expect(result?.status).toBe(coverage === "NONE" ? "INSUFFICIENT_DATA" : "GENERATED");
        expect(generate).toHaveBeenCalledTimes(coverage === "NONE" ? 0 : 1);
    });
    it("does not upgrade coverage for authorised empty or invalid records", async () => {
        const generate = vi.fn();
        const result = await new GetMyAiAthleteGuidanceUseCase({ execute: vi.fn().mockResolvedValue({
            sources: { ...sources(false, true), goals: { athleteId: "private", primaryGoal: null, secondaryGoals: [] },
                training: { ...sources(false, true).training, programmes: [{ trainingFrequency: 100 }] } },
            generatedAt: new Date().toISOString(),
        }) }, { generate }).execute(input);
        expect(result?.limitations.coverage).toBe("NONE");
        expect(generate).not.toHaveBeenCalled();
    });
    it("does not let provider mutation upgrade coverage", async () => {
        const generate = vi.fn(async (facts: GuidanceFacts) => { facts.trainingFrequencies.push(3); return advice; });
        const result = await new GetMyAiAthleteGuidanceUseCase({ execute: vi.fn().mockResolvedValue({
            sources: sources(true, false), generatedAt: new Date().toISOString(),
        }) }, { generate }).execute(input);
        expect(result?.limitations.coverage).toBe("GOALS_ONLY");
        expect(result?.limitations.confidence).toBe("NOT_ASSESSED");
    });
});
