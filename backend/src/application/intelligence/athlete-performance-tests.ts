import { AthleteIntelligenceContextReader } from "./athlete-context";

export interface PerformanceTestPermissionChecker {
    hasPermission(userId: string, tenantId: string, code: string): Promise<boolean>;
}

export interface AthletePerformanceTestsSnapshot {
    athleteId: string;
    results: Array<{
        id: string;
        protocolId: string;
        sportId: string;
        protocolCode: string;
        protocolName: string;
        protocolVersion: number;
        unit: string;
        value: string;
        recordedAt: Date;
        correctsResultId: string | null;
    }>;
}

export interface AthletePerformanceTestsReader {
    read(tenantId: string, athleteId: string): Promise<AthletePerformanceTestsSnapshot>;
}

export class ReadAthleteIntelligencePerformanceTests {
    constructor(
        private readonly context: AthleteIntelligenceContextReader,
        private readonly permissions: PerformanceTestPermissionChecker,
        private readonly tests: AthletePerformanceTestsReader,
    ) {}

    async execute(tenantId: string, actorId: string, athleteId: string): Promise<AthletePerformanceTestsSnapshot | null> {
        const scope = await this.context.read(tenantId, actorId, athleteId);
        if (!scope) return null;
        if (!(await this.permissions.hasPermission(actorId, tenantId, "performance-tests.read"))) return null;
        return this.tests.read(tenantId, scope.athleteId);
    }
}
