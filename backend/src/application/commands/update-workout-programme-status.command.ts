export type WorkoutProgrammeStatus =
    "ACTIVE" |
    "INACTIVE" |
    "SUSPENDED";

export class UpdateWorkoutProgrammeStatusCommand {

    constructor(
        public readonly id: string,
        public readonly tenantId: string,
        public readonly userId: string,
        public readonly status: WorkoutProgrammeStatus,
    ) {}
}
