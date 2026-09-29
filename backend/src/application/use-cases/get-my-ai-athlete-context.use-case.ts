import { AthleteRepository } from "../../domain/repositories/athlete.repository";
import { AthleteIntelligenceContextReader } from "../intelligence/athlete-context";

/** Identity boundary only: no provider call, prompt, or source-data retrieval. */
export class GetMyAiAthleteContextUseCase {
    constructor(
        private readonly athletes: AthleteRepository,
        private readonly context: AthleteIntelligenceContextReader,
    ) {}

    async execute(input: Readonly<{ tenantId: string; userId: string }>) {
        const athlete = await this.athletes.findByUserId(input.userId, input.tenantId);
        if (!athlete) return null;
        const scope = await this.context.read(input.tenantId, input.userId, athlete.id);
        if (!scope) return null;
        return {
            athleteId: scope.athleteId,
            contextVersion: 1,
            purpose: "PERFORMANCE_SUPPORT" as const,
            accessMode: "SELF" as const,
            generationAvailable: false,
        };
    }
}
