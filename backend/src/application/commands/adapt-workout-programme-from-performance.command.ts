export class AdaptWorkoutProgrammeFromPerformanceCommand {

    constructor(
        public readonly programmeId: string,
        public readonly tenantId: string,
        public readonly actorUserId: string,
        public readonly athleteId: string,
        public readonly metricId: string,
        public readonly trainingFrequencyDelta: number,
        public readonly sessionDurationMinutesDelta: number,
        public readonly rationale: string,
    ) {}
}
