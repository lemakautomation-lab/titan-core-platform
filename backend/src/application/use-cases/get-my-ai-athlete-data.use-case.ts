import { GetMyAiAthleteContextUseCase } from "./get-my-ai-athlete-context.use-case";
import { ReadAthleteIntelligenceAggregate } from "../intelligence/athlete-aggregation";

/** Source readers retain their own grants; denied sources remain null. */
export class GetMyAiAthleteDataUseCase {
    constructor(
        private readonly context: GetMyAiAthleteContextUseCase,
        private readonly aggregate: ReadAthleteIntelligenceAggregate,
    ) {}

    async execute(input: Readonly<{ tenantId: string; userId: string }>) {
        const context = await this.context.execute(input);
        if (!context) return null;
        const sources = await this.aggregate.execute(input.tenantId, input.userId, context.athleteId);
        if (!sources) return null;
        return { context, sources, generatedAt: new Date().toISOString() };
    }
}
