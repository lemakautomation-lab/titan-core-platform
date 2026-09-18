export class RemoveMyTrainerClientCommand {
    constructor(
        public readonly userId: string,
        public readonly tenantId: string,
        public readonly athleteId: string,
    ) {}
}
