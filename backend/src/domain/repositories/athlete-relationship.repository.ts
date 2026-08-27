import { AthleteRelationship } from "../entities/athlete-relationship.entity";
import { AthleteRelationshipType } from "../enums/athlete-relationship-type.enum";

export interface AthleteRelationshipRepository {

    findById(
        id: string,
        tenantId: string,
    ): Promise<AthleteRelationship | null>;

    findAllByAthleteId(
        athleteId: string,
        tenantId: string,
    ): Promise<AthleteRelationship[]>;

    findAllByType(
        athleteId: string,
        relationshipType: AthleteRelationshipType,
        tenantId: string,
    ): Promise<AthleteRelationship[]>;

    create(
        relationship: AthleteRelationship,
    ): Promise<AthleteRelationship>;

    update(
        relationship: AthleteRelationship,
        tenantId: string,
    ): Promise<AthleteRelationship>;

    delete(
        id: string,
        tenantId: string,
    ): Promise<void>;

}
