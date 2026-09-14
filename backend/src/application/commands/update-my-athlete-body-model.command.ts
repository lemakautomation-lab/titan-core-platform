export class UpdateMyAthleteBodyModelCommand {
    constructor(
        public readonly userId: string,
        public readonly tenantId: string,
        public readonly modelType: unknown,
    ) {}
}