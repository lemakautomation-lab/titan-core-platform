import { PerformanceImprovementDirection } from "../../domain/services/performance-evidence-evaluator.service";

export class AdaptWorkoutProgrammeFromPerformanceCommand {

    constructor(
        public readonly programmeId: string,
        public readonly tenantId: string,
        public readonly actorUserId: string,
        public readonly athleteId: string,
        public readonly metricId: string,
        public readonly improvementDirection: PerformanceImprovementDirection,
        public readonly trainingFrequencyDelta: number,
        public readonly sessionDurationMinutesDelta: number,
        public readonly rationale: string,
    ) {}
}
