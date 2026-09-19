export class UpdateTrainerSessionScheduleCommand {
    constructor(
        public readonly id: string,
        public readonly tenantId: string,
        public readonly userId: string,
        public readonly title: string,
        public readonly notes: string | null,
        public readonly startsAt: Date,
        public readonly endsAt: Date,
    ) {}
}
