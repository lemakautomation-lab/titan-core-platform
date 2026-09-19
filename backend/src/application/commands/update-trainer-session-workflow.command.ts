import { TrainerSessionScheduleStatus } from "../../domain/enums/trainer-session-schedule-status.enum";

export class UpdateTrainerSessionWorkflowCommand {
    constructor(
        public readonly id: string,
        public readonly tenantId: string,
        public readonly userId: string,
        public readonly status: TrainerSessionScheduleStatus,
    ) {}
}
