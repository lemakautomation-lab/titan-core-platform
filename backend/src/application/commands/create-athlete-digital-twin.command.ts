export class CreateAthleteDigitalTwinCommand {

    constructor(

        public readonly tenantId: string,

        public readonly athleteId: string,

    ) {}

}
