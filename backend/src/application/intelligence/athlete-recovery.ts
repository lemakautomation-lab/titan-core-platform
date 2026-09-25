import { AthleteIntelligenceContextReader } from "./athlete-context";

export interface RecoveryPermissionChecker {
    hasPermission(userId: string, tenantId: string, code: string): Promise<boolean>;
}

export interface AthleteRecoverySnapshot {
    athleteId: string;
    observations: Array<{ id: string; value: string; recordedAt: Date }>;
}

export interface AthleteRecoveryReader {
    read(tenantId: string, athleteId: string): Promise<AthleteRecoverySnapshot>;
}

export class ReadAthleteIntelligenceRecovery {
    constructor(
        private readonly context: AthleteIntelligenceContextReader,
        private readonly permissions: RecoveryPermissionChecker,
        private readonly recovery: AthleteRecoveryReader,
    ) {}

    async execute(tenantId: string, actorId: string, athleteId: string): Promise<AthleteRecoverySnapshot | null> {
        const scope = await this.context.read(tenantId, actorId, athleteId);
        if (!scope) return null;
        if (!(await this.permissions.hasPermission(actorId, tenantId, "recovery-tracking.read"))) return null;
        return this.recovery.read(tenantId, scope.athleteId);
    }
}
