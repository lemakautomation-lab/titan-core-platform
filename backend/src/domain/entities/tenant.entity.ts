import { randomUUID } from "crypto";
import { RecordStatus } from "../enums/record-status.enum";

export class Tenant {

    public static create(name: string): Tenant {

        const now = new Date();

        return new Tenant(
            randomUUID(),
            name,
            Tenant.generateSlug(name),
            RecordStatus.ACTIVE,
            now,
            now,
        );

    }

    constructor(

        public readonly id: string,

        public name: string,

        public slug: string,

        public status: RecordStatus,

        public readonly createdAt: Date,

        public updatedAt: Date,

    ) {}

    activate(): void {

        this.status = RecordStatus.ACTIVE;

    }

    deactivate(): void {

        this.status = RecordStatus.INACTIVE;

    }

    suspend(): void {

        this.status = RecordStatus.SUSPENDED;

    }

    delete(): void {

        this.status = RecordStatus.DELETED;

    }

    isActive(): boolean {

        return this.status === RecordStatus.ACTIVE;

    }

    private static generateSlug(name: string): string {

        return name
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");

    }

}