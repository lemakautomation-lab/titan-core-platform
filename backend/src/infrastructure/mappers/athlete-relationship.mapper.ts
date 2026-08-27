import { AthleteRelationship as PrismaAthleteRelationship } from "../../generated/prisma/client";
import { AthleteRelationship } from "../../domain/entities/athlete-relationship.entity";
import { AthleteRelationshipType } from "../../domain/enums/athlete-relationship-type.enum";
import { RecordStatus } from "../../domain/enums/record-status.enum";

export class AthleteRelationshipMapper {

    static toDomain(
        prisma: PrismaAthleteRelationship,
    ): AthleteRelationship {

        return new AthleteRelationship(
            prisma.id,
            prisma.tenantId,
            prisma.athleteId,
            prisma.relationshipType as AthleteRelationshipType,
            prisma.relatedEntityId,
            prisma.status as RecordStatus,
            prisma.startsAt,
            prisma.endsAt,
            prisma.createdAt,
            prisma.updatedAt,
        );

    }

    static toPersistence(
        relationship: AthleteRelationship,
    ) {

        return {

            id: relationship.id,

            tenantId: relationship.tenantId,

            athleteId: relationship.athleteId,

            relationshipType: relationship.relationshipType,

            relatedEntityId: relationship.relatedEntityId,

            status: relationship.status,

            startsAt: relationship.startsAt,

            endsAt: relationship.endsAt,

        };

    }

}
