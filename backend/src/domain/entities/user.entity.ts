import { randomUUID } from "crypto";

import { UserStatus } from "../enums/user-status.enum";

export class User {

    constructor(

        public readonly id: string,

        public readonly tenantId: string,

        public readonly organisationId: string | null,

        public email: string,

        public passwordHash: string,

        public firstName: string | null,

        public lastName: string | null,

        public status: UserStatus,

        public readonly createdAt: Date,

        public updatedAt: Date,

    ) {}

    static create(
        tenantId: string,
        organisationId: string | null,
        email: string,
        passwordHash: string,
        firstName: string | null,
        lastName: string | null,
    ): User {

        const now = new Date();

        return new User(
            randomUUID(),
            tenantId,
            organisationId,
            email,
            passwordHash,
            firstName,
            lastName,
            UserStatus.ACTIVE,
            now,
            now,
        );

    }

    activate(): void {
        this.status = UserStatus.ACTIVE;
    }

    suspend(): void {
        this.status = UserStatus.SUSPENDED;
    }

    deactivate(): void {
        this.status = UserStatus.INACTIVE;
    }

    isActive(): boolean {
        return this.status === UserStatus.ACTIVE;
    }

    getFullName(): string {
        return [this.firstName, this.lastName]
            .filter(Boolean)
            .join(" ");
    }

}
