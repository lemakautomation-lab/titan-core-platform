export class ExerciseDto {

    constructor(
        public readonly id: string,
        public readonly tenantId: string,
        public readonly name: string,
        public readonly slug: string,
        public readonly description: string | null,
        public readonly movement: string,
        public readonly muscleGroups: string[],
        public readonly equipment: string[],
        public readonly trainingObjective: string,
        public readonly difficulty: string,
        public readonly trainingPhase: string | null,
        public readonly sportId: string | null,
        public readonly status: string,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) {}
}
