import { AthleteRelationshipType } from "../../domain/enums/athlete-relationship-type.enum";

export class CreateAthleteRelationshipCommand {

    constructor(

        public readonly tenantId: string,

        public readonly athleteId: string,

        public readonly relationshipType: AthleteRelationshipType,

        public readonly relatedEntityId: string,

        public readonly startsAt: Date | null,

    ) {}

}
