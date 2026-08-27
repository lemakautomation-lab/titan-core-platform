import { AthleteRelationship } from "../../domain/entities/athlete-relationship.entity";
import { AthleteRelationshipDto } from "../dto/athlete-relationship/athlete-relationship.dto";

export class AthleteRelationshipApplicationMapper {

    static toDto(
        relationship: AthleteRelationship,
    ): AthleteRelationshipDto {

        return new AthleteRelationshipDto(
            relationship.id,
            relationship.tenantId,
            relationship.athleteId,
            relationship.relationshipType.toString(),
            relationship.relatedEntityId,
            relationship.status.toString(),
            relationship.startsAt,
            relationship.endsAt,
            relationship.createdAt,
            relationship.updatedAt,
        );

    }

}
