import { randomUUID } from "crypto";

import { AthleteRelationshipType } from "../enums/athlete-relationship-type.enum";
import { RecordStatus } from "../enums/record-status.enum";

export class AthleteRelationship {

    constructor(

        public readonly id: string,

        public readonly tenantId: string,

        public readonly athleteId: string,

        public readonly relationshipType: AthleteRelationshipType,

        public readonly relatedEntityId: string,

        public status: RecordStatus,

        public readonly startsAt: Date | null,

        public endsAt: Date | null,

        public readonly createdAt: Date,

        public updatedAt: Date,

    ) {}

    static create(
        tenantId: string,
        athleteId: string,
        relationshipType: AthleteRelationshipType,
        relatedEntityId: string,
        startsAt: Date | null,
    ): AthleteRelationship {

        const now = new Date();

        return new AthleteRelationship(
            randomUUID(),
            tenantId,
            athleteId,
            relationshipType,
            relatedEntityId,
            RecordStatus.ACTIVE,
            startsAt,
            null,
            now,
            now,
        );

    }

    end(): void {

        this.status = RecordStatus.INACTIVE;
        this.endsAt = new Date();
        this.updatedAt = new Date();

    }

    activate(): void {

        this.status = RecordStatus.ACTIVE;
        this.endsAt = null;
        this.updatedAt = new Date();

    }

    isActive(): boolean {

        return this.status === RecordStatus.ACTIVE;

    }

}
