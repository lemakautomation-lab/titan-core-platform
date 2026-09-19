export class ListTrainerSessionSchedulesQuery {
    constructor(
        public readonly tenantId: string,
        public readonly userId: string,
        public readonly startsFrom: Date,
        public readonly startsBefore: Date,
        public readonly athleteId?: string,
    ) {}
}
