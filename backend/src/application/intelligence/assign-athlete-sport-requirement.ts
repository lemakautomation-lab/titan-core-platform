import { AthleteIntelligenceContextReader } from "./athlete-context";
import { SportRequirementPermissionChecker } from "./athlete-sport-requirements";

export interface AssignSportRequirementInput {
    tenantId: string;
    actorId: string;
    athleteId: string;
    sportId: string;
    code: string;
    targetValue: string;
    unit: string;
}

export interface SportRequirementWriter {
    assign(input: AssignSportRequirementInput): Promise<{ id: string; version: number }>;
}

/** Rejects incomplete scope and grants before any write. */
export class AssignAthleteSportRequirement {
    constructor(
        private readonly context: AthleteIntelligenceContextReader,
        private readonly permissions: SportRequirementPermissionChecker,
        private readonly writer: SportRequirementWriter,
    ) {}

    async execute(input: AssignSportRequirementInput): Promise<{ id: string; version: number } | null> {
        const scope = await this.context.read(input.tenantId, input.actorId, input.athleteId);
        if (!scope) return null;
        if (!(await this.permissions.hasPermission(input.actorId, input.tenantId, "sport-requirements.write"))) return null;
        return this.writer.assign({ ...input, athleteId: scope.athleteId });
    }
}
