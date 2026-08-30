export type ExerciseStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export class UpdateExerciseStatusCommand {
    constructor(
        public readonly id: string,
        public readonly tenantId: string,
        public readonly userId: string,
        public readonly status: ExerciseStatus,
    ) {}
}
