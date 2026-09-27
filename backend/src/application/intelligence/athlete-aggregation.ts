import type { AthleteIntelligenceContextReader } from "./athlete-context";
import type { ReadAthleteIntelligenceGoals } from "./athlete-goals";
import type { ReadAthleteIntelligenceNutrition } from "./athlete-nutrition";
import type { ReadAthleteIntelligencePerformanceTests } from "./athlete-performance-tests";
import type { ReadAthleteIntelligenceRecovery } from "./athlete-recovery";
import type { ReadAthleteIntelligenceSportRequirements } from "./athlete-sport-requirements";
import type { ReadAthleteIntelligenceTraining } from "./athlete-training";
import type { ReadAthleteIntelligenceWearables } from "./athlete-wearables";

/** Null means the actor lacks this source's grant; an empty snapshot remains visible. */
export interface AthleteIntelligenceAggregate {
    athleteId: string;
    training: Awaited<ReturnType<ReadAthleteIntelligenceTraining["execute"]>>;
    nutrition: Awaited<ReturnType<ReadAthleteIntelligenceNutrition["execute"]>>;
    recovery: Awaited<ReturnType<ReadAthleteIntelligenceRecovery["execute"]>>;
    wearables: Awaited<ReturnType<ReadAthleteIntelligenceWearables["execute"]>>;
    performanceTests: Awaited<ReturnType<ReadAthleteIntelligencePerformanceTests["execute"]>>;
    goals: Awaited<ReturnType<ReadAthleteIntelligenceGoals["execute"]>>;
    sportRequirements: Awaited<ReturnType<ReadAthleteIntelligenceSportRequirements["execute"]>>;
}

/** Internal composition only. Each source retains its independent permission gate. */
export class ReadAthleteIntelligenceAggregate {
    constructor(
        private readonly context: AthleteIntelligenceContextReader,
        private readonly training: Pick<ReadAthleteIntelligenceTraining, "execute">,
        private readonly nutrition: Pick<ReadAthleteIntelligenceNutrition, "execute">,
        private readonly recovery: Pick<ReadAthleteIntelligenceRecovery, "execute">,
        private readonly wearables: Pick<ReadAthleteIntelligenceWearables, "execute">,
        private readonly performanceTests: Pick<ReadAthleteIntelligencePerformanceTests, "execute">,
        private readonly goals: Pick<ReadAthleteIntelligenceGoals, "execute">,
        private readonly sportRequirements: Pick<ReadAthleteIntelligenceSportRequirements, "execute">,
    ) {}

    async execute(tenantId: string, actorId: string, athleteId: string): Promise<AthleteIntelligenceAggregate | null> {
        const scope = await this.context.read(tenantId, actorId, athleteId);
        if (!scope) return null;

        const args = [tenantId, actorId, scope.athleteId] as const;
        const [training, nutrition, recovery, wearables, performanceTests, goals, sportRequirements] = await Promise.all([
            this.training.execute(...args),
            this.nutrition.execute(...args),
            this.recovery.execute(...args),
            this.wearables.execute(...args),
            this.performanceTests.execute(...args),
            this.goals.execute(...args),
            this.sportRequirements.execute(...args),
        ]);

        return { athleteId: scope.athleteId, training, nutrition, recovery, wearables,
            performanceTests, goals, sportRequirements };
    }
}
