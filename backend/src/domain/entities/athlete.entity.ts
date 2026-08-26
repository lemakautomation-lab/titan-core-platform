import { randomUUID } from "crypto";

import { RecordStatus } from "../enums/record-status.enum";

export class Athlete {

    constructor(

        public readonly id: string,

        public readonly tenantId: string,

        public organisationId: string | null,

        public userId: string | null,

        public firstName: string,

        public lastName: string,

        public dateOfBirth: Date | null,

        public status: RecordStatus,

        public readonly createdAt: Date,

        public updatedAt: Date,

    ) {}

    static create(
        tenantId: string,
        organisationId: string | null,
        userId: string | null,
        firstName: string,
        lastName: string,
        dateOfBirth: Date | null,
    ): Athlete {

        const now = new Date();

        return new Athlete(
            randomUUID(),
            tenantId,
            organisationId,
            userId,
            firstName,
            lastName,
            dateOfBirth,
            RecordStatus.ACTIVE,
            now,
            now,
        );

    }

    updateProfile(
        organisationId: string | null,
        userId: string | null,
        firstName: string,
        lastName: string,
        dateOfBirth: Date | null,
    ): void {

        this.organisationId = organisationId;
        this.userId = userId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.dateOfBirth = dateOfBirth;
        this.updatedAt = new Date();

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

    getFullName(): string {

        return `${this.firstName} ${this.lastName}`.trim();

    }

}
