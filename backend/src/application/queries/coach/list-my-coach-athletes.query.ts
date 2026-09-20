export class ListMyCoachAthletesQuery {
    constructor(
        public readonly tenantId: string,
        public readonly userId: string,
    ) {}
}
