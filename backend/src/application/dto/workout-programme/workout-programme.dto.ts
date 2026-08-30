export class WorkoutProgrammeDto {

    constructor(

        public readonly id: string,

        public readonly tenantId: string,

        public readonly athleteId: string,

        public readonly name: string,

        public readonly description: string | null,

        public readonly goal: string,

        public readonly experience: string,

        public readonly trainingFrequency: number,

        public readonly sessionDurationMinutes: number,

        public readonly sportId: string | null,

        public readonly status: string,

        public readonly createdAt: Date,

        public readonly updatedAt: Date,

    ) {}

}
