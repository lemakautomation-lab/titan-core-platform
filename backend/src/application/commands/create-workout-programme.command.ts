export class CreateWorkoutProgrammeCommand {

    constructor(

        public readonly tenantId: string,

        public readonly userId: string,

        public readonly athleteId: string,

        public readonly name: string,

        public readonly description: string | null,

        public readonly goal: string,

        public readonly experience: string,

        public readonly trainingFrequency: number,

        public readonly sessionDurationMinutes: number,

        public readonly sportId: string | null,

    ) {}

}
