export class AthleteDigitalTwinDto {

    constructor(

        public readonly id: string,

        public readonly tenantId: string,

        public readonly athleteId: string,

        public readonly status: string,

        public readonly createdAt: Date,

        public readonly updatedAt: Date,

    ) {}

}
