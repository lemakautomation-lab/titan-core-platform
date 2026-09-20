export class RemoveMyCoachAthleteCommand {
    constructor(
        public readonly tenantId: string,
        public readonly userId: string,
        public readonly athleteId: string,
    ) {}
}
