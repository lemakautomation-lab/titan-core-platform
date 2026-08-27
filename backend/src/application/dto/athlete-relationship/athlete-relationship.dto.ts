export class AthleteRelationshipDto {

    constructor(

        public readonly id: string,

        public readonly tenantId: string,

        public readonly athleteId: string,

        public readonly relationshipType: string,

        public readonly relatedEntityId: string,

        public readonly status: string,

        public readonly startsAt: Date | null,

        public readonly endsAt: Date | null,

        public readonly createdAt: Date,

        public readonly updatedAt: Date,

    ) {}

}
