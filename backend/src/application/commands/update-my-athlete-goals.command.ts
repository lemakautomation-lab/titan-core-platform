export class UpdateMyAthleteGoalsCommand {

    constructor(
        public readonly userId: string,
        public readonly tenantId: string,
        public readonly primaryGoal: unknown,
        public readonly secondaryGoals: readonly unknown[],
    ) {}
}
