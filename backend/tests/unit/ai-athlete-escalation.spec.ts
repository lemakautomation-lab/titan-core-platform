import { describe, expect, it, vi } from "vitest";
import { GetMyAiAthleteGuidanceUseCase } from "../../src/application/use-cases/get-my-ai-athlete-guidance.use-case";
import { ProgrammeGoalClassification } from "../../src/domain/enums/programme-goal-classification.enum";
import { guidanceEscalation, type GuidanceFacts } from "../../src/application/ai-athlete/performance-guidance";
const input = { tenantId: "tenant", userId: "user" };
function reader(usable: boolean) {
    return { execute: vi.fn().mockResolvedValue({ generatedAt: new Date().toISOString(), sources: {
        goals: usable ? { primaryGoal: ProgrammeGoalClassification.STRENGTH, secondaryGoals: [] } : null,
        training: null, nutrition: null, recovery: null, wearables: null,
        performanceTests: null, sportRequirements: null,
    } }) };
}
describe("Mission 074.6 professional review boundary", () => {
    it.each([false, true])("requires human review with and without usable facts (%s)", async usable => {
        const generate = vi.fn().mockResolvedValue({ summary: "Track consistency.", actions: ["Review goals."] });
        const result = await new GetMyAiAthleteGuidanceUseCase(reader(usable), { generate }).execute(input);
        expect(result?.escalation).toEqual(guidanceEscalation());
        expect(result?.escalation.professionalReviewRequired).toBe(true);
        expect(result?.escalation.automaticContact).toBe(false);
        expect(generate).toHaveBeenCalledTimes(usable ? 1 : 0);
    });
    it("keeps escalation server-owned and out of the provider facts", async () => {
        const generate = vi.fn(async (facts: GuidanceFacts) => {
            expect(Object.keys(facts).sort()).toEqual(["goals", "trainingFrequencies"]);
            facts.goals.length = 0;
            return { summary: "Track consistency.", actions: ["Review goals."] };
        });
        const result = await new GetMyAiAthleteGuidanceUseCase(reader(true), { generate }).execute(input);
        expect(result?.escalation).toEqual(guidanceEscalation());
    });
    it("does not share mutable review notices between requests", () => {
        const first = guidanceEscalation();
        first.notices.length = 0;
        expect(guidanceEscalation().notices).toHaveLength(3);
    });
});
