export class ListCoachSquadsQuery {
    constructor(
        public readonly tenantId: string,
        public readonly coachUserId: string,
    ) {}
}