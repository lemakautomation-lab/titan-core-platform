export type AthleteDigitalTwinLifecycleAction =
    | "ACTIVATE"
    | "DEACTIVATE"
    | "SUSPEND"
    | "DELETE";

export class UpdateAthleteDigitalTwinLifecycleCommand {

    constructor(

        public readonly id: string,

        public readonly tenantId: string,

        public readonly action: AthleteDigitalTwinLifecycleAction,

    ) {}

}
