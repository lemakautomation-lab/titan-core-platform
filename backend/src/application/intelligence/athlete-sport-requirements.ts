import { AthleteIntelligenceContextReader } from "./athlete-context";

export interface SportRequirementPermissionChecker {
    hasPermission(userId: string, tenantId: string, code: string): Promise<boolean>;
}

export interface AthleteSportRequirementsSnapshot {
    athleteId: string;
    requirements: Array<{
        id: string;
        sportId: string;
        sportName: string;
        code: string;
        targetValue: string;
        unit: string;
        version: number;
    }>;
}

export interface AthleteSportRequirementsReader {
    read(tenantId: string, athleteId: string): Promise<AthleteSportRequirementsSnapshot>;
}

export class ReadAthleteIntelligenceSportRequirements {
    constructor(
        private readonly context: AthleteIntelligenceContextReader,
        private readonly permissions: SportRequirementPermissionChecker,
        private readonly requirements: AthleteSportRequirementsReader,
    ) {}

    async execute(tenantId: string, actorId: string, athleteId: string): Promise<AthleteSportRequirementsSnapshot | null> {
        const scope = await this.context.read(tenantId, actorId, athleteId);
        if (!scope) return null;
        if (!(await this.permissions.hasPermission(actorId, tenantId, "sport-requirements.read"))) return null;
        return this.requirements.read(tenantId, scope.athleteId);
    }
}
