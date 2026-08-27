import { randomUUID } from "crypto";

import { RecordStatus } from "../enums/record-status.enum";

export class AthleteDigitalTwin {

    constructor(

        public readonly id: string,

        public readonly tenantId: string,

        public readonly athleteId: string,

        public status: RecordStatus,

        public readonly createdAt: Date,

        public updatedAt: Date,

    ) {}

    static create(
        tenantId: string,
        athleteId: string,
    ): AthleteDigitalTwin {

        const now = new Date();

        return new AthleteDigitalTwin(
            randomUUID(),
            tenantId,
            athleteId,
            RecordStatus.ACTIVE,
            now,
            now,
        );

    }

    activate(): void {

        this.status = RecordStatus.ACTIVE;
        this.updatedAt = new Date();

    }

    deactivate(): void {

        this.status = RecordStatus.INACTIVE;
        this.updatedAt = new Date();

    }

    suspend(): void {

        this.status = RecordStatus.SUSPENDED;
        this.updatedAt = new Date();

    }

    delete(): void {

        this.status = RecordStatus.DELETED;
        this.updatedAt = new Date();

    }

    isActive(): boolean {

        return this.status === RecordStatus.ACTIVE;

    }

}
