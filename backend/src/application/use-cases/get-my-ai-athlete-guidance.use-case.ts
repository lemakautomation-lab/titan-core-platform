import { explainGuidance, guidanceFacts, validateGuidance, type PerformanceGuidanceProvider } from "../ai-athlete/performance-guidance";
import type { GetMyAiAthleteDataUseCase } from "./get-my-ai-athlete-data.use-case";

export class GetMyAiAthleteGuidanceUseCase {
    constructor(private readonly data: Pick<GetMyAiAthleteDataUseCase, "execute">,
        private readonly provider: PerformanceGuidanceProvider) {}

    async execute(input: Readonly<{ tenantId: string; userId: string }>) {
        const data = await this.data.execute(input);
        if (!data) return null;
        const facts = guidanceFacts(data.sources);
        const explanation = explainGuidance(data.sources, facts, data.generatedAt);
        if (!facts.goals.length && !facts.trainingFrequencies.length) {
            return { status: "INSUFFICIENT_DATA" as const, guidance: null, explanation, generatedAt: new Date().toISOString() };
        }
        const guidance = validateGuidance(await this.provider.generate(facts));
        return { status: "GENERATED" as const, guidance, explanation, generatedAt: new Date().toISOString() };
    }
}
