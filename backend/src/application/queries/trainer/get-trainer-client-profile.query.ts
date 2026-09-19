export class GetTrainerClientProfileQuery {
    constructor(
        public readonly userId: string,
        public readonly tenantId: string,
        public readonly athleteId: string,
    ) {}
}
