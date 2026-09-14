import { randomUUID } from "crypto";

import { UserStatus } from "../enums/user-status.enum";

export class User {

    constructor(

        public readonly id: string,

        public readonly tenantId: string,

        public organisationId: string | null,

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
            User.normalizeEmail(email),
            passwordHash,
            firstName,
            lastName,
            UserStatus.ACTIVE,
            now,
            now,
        );

    }

    updateProfile(
        organisationId: string | null,
        email: string,
        firstName: string | null,
        lastName: string | null,
    ): void {

        const normalizedEmail =
            User.normalizeEmail(email);

        this.organisationId = organisationId;
        this.email = normalizedEmail;
        this.firstName = firstName;
        this.lastName = lastName;
        this.updatedAt = new Date();

    }

    static normalizeEmail(
        email: string,
    ): string {

        if (
            typeof email !== "string" ||
            !email.trim()
        ) {

            throw new Error(
                "User email is required.",
            );

        }

        const normalized =
            email.trim().toLowerCase();

        if (
            normalized.length > 254 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                normalized,
            )
        ) {

            throw new Error(
                "User email format is invalid.",
            );

        }

        return normalized;

    }

    changePassword(
        passwordHash: string,
    ): void {

        this.passwordHash = passwordHash;
        this.updatedAt = new Date();

    }

    activate(): void {

        this.status = UserStatus.ACTIVE;
        this.updatedAt = new Date();

    }

    suspend(): void {

        this.status = UserStatus.SUSPENDED;
        this.updatedAt = new Date();

    }

    deactivate(): void {

        this.status = UserStatus.INACTIVE;
        this.updatedAt = new Date();

    }

    lock(): void {

        this.status = UserStatus.LOCKED;
        this.updatedAt = new Date();

    }

    unlock(): void {

        this.status = UserStatus.ACTIVE;
        this.updatedAt = new Date();

    }

    isActive(): boolean {

        return this.status === UserStatus.ACTIVE;

    }

    isLocked(): boolean {

        return this.status === UserStatus.LOCKED;

    }

    getFullName(): string {

        return [this.firstName, this.lastName]
            .filter(Boolean)
            .join(" ");

    }

}
