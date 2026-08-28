import { randomUUID } from "crypto";

import { RecordStatus } from "../enums/record-status.enum";

export class Sport {

    constructor(

        public readonly id: string,

        public readonly tenantId: string,

        public name: string,

        public slug: string,

        public status: RecordStatus,

        public readonly createdAt: Date,

        public updatedAt: Date,

    ) {}

    static create(
        tenantId: string,
        name: string,
        slug: string,
    ): Sport {

        const now = new Date();

        return new Sport(
            randomUUID(),
            tenantId,
            name,
            slug,
            RecordStatus.ACTIVE,
            now,
            now,
        );
    }

    updateDetails(
        name: string,
        slug: string,
    ): void {

        this.name = name;
        this.slug = slug;
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
}
