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

    updateDetails(

        name: string,

        slug: string,

    ): void {

        this.name = name;
        this.slug = slug;
        this.updatedAt = new Date();

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