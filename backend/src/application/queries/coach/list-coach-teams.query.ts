export class ListCoachTeamsQuery {
    constructor(
        public readonly tenantId: string,
        public readonly coachUserId: string,
    ) {}
}