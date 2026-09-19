export class AssignTrainerWorkoutProgrammeCommand {
    constructor(
        public readonly programmeId: string,
        public readonly tenantId: string,
        public readonly userId: string,
        public readonly athleteId: string,
    ) {}
}
