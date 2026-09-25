import { AthleteIntelligenceContextReader } from "./athlete-context";
import { PerformanceTestPermissionChecker } from "./athlete-performance-tests";

export interface TestProtocolInput {
    tenantId: string; actorId: string; sportId: string;
    code: string; name: string; unit: string;
}
export interface TestResultInput {
    tenantId: string; actorId: string; athleteId: string;
    protocolId: string; value: string; recordedAt: Date;
    correctsResultId?: string;
}
export interface PerformanceTestWriter {
    registerProtocol(input: TestProtocolInput): Promise<{ id: string; version: number }>;
    recordResult(input: TestResultInput): Promise<{ id: string }>;
}

export class ManageAthletePerformanceTests {
    constructor(
        private readonly context: AthleteIntelligenceContextReader,
        private readonly permissions: PerformanceTestPermissionChecker,
        private readonly writer: PerformanceTestWriter,
    ) {}

    async registerProtocol(input: TestProtocolInput) {
        if (!(await this.permissions.hasPermission(input.actorId, input.tenantId, "performance-tests.write"))) return null;
        return this.writer.registerProtocol(input);
    }

    async recordResult(input: TestResultInput) {
        const scope = await this.context.read(input.tenantId, input.actorId, input.athleteId);
        if (!scope) return null;
        if (!(await this.permissions.hasPermission(input.actorId, input.tenantId, "performance-tests.write"))) return null;
        return this.writer.recordResult({ ...input, athleteId: scope.athleteId });
    }
}
