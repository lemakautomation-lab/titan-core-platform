export class CreateTrainerSessionScheduleCommand {
    constructor(
        public readonly tenantId: string,
        public readonly userId: string,
        public readonly athleteId: string,
        public readonly title: string,
        public readonly notes: string | null,
        public readonly startsAt: Date,
        public readonly endsAt: Date,
    ) {}
}
