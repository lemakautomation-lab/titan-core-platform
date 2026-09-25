import { AthleteIntelligenceContextReader } from "./athlete-context";
import { ProgrammeGoalClassification } from "../../domain/enums/programme-goal-classification.enum";

export interface GoalsPermissionChecker {
    hasPermission(userId: string, tenantId: string, code: string): Promise<boolean>;
}

export interface AthleteGoalsSnapshot {
    athleteId: string;
    primaryGoal: ProgrammeGoalClassification | null;
    secondaryGoals: ProgrammeGoalClassification[];
}

export interface AthleteGoalsReader {
    read(tenantId: string, athleteId: string): Promise<AthleteGoalsSnapshot>;
}

export class ReadAthleteIntelligenceGoals {
    constructor(
        private readonly context: AthleteIntelligenceContextReader,
        private readonly permissions: GoalsPermissionChecker,
        private readonly goals: AthleteGoalsReader,
    ) {}

    async execute(tenantId: string, actorId: string, athleteId: string): Promise<AthleteGoalsSnapshot | null> {
        const scope = await this.context.read(tenantId, actorId, athleteId);
        if (!scope) return null;
        if (!(await this.permissions.hasPermission(actorId, tenantId, "athlete-goals.read"))) return null;
        return this.goals.read(tenantId, scope.athleteId);
    }
}
