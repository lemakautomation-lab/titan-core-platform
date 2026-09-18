import { AthleteRelationship } from "../entities/athlete-relationship.entity";
import { AthleteRelationshipType } from "../enums/athlete-relationship-type.enum";
import { PaginationInput } from "../../application/common/pagination";

export interface AthleteRelationshipRepository {

    findById(
        id: string,
        tenantId: string,
    ): Promise<AthleteRelationship | null>;

    findAllByAthleteId(
        athleteId: string,
        tenantId: string,
        pagination: PaginationInput,
    ): Promise<{
        items: AthleteRelationship[];
        total: number;
    }>;

    findAllByType(
        athleteId: string,
        relationshipType: AthleteRelationshipType,
        tenantId: string,
        pagination: PaginationInput,
    ): Promise<{
        items: AthleteRelationship[];
        total: number;
    }>;

    findAllByRelatedEntity(
        relatedEntityId: string,
        relationshipType: AthleteRelationshipType,
        tenantId: string,
    ): Promise<AthleteRelationship[]>;

    findByAthleteAndRelatedEntity(
        athleteId: string,
        relatedEntityId: string,
        relationshipType: AthleteRelationshipType,
        tenantId: string,
    ): Promise<AthleteRelationship | null>;
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
