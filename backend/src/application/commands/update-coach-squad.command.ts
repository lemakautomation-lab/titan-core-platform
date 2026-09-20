export class UpdateCoachSquadCommand {
    constructor(
        public readonly id: string,
        public readonly tenantId: string,
        public readonly coachUserId: string,
        public readonly name: string,
        public readonly description?: string | null,
    ) {}
}