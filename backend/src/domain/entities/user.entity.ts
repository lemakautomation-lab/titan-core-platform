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

        public contactNumber: string | null = null,

    ) {}

    static create(
        tenantId: string,
        organisationId: string | null,
        email: string,
        passwordHash: string,
        firstName: string | null,
        lastName: string | null,
        contactNumber: string | null = null,
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
            User.normalizeContactNumber(contactNumber),
        );

    }

    updateProfile(
        organisationId: string | null,
        email: string,
        firstName: string | null,
        lastName: string | null,
        contactNumber: string | null | undefined = undefined,
    ): void {

        const normalizedEmail =
            User.normalizeEmail(email);

        const normalizedContactNumber =
            contactNumber === undefined
                ? this.contactNumber
                : User.normalizeContactNumber(
                    contactNumber,
                );

        this.organisationId = organisationId;
        this.email = normalizedEmail;
        this.firstName = firstName;
        this.lastName = lastName;
        this.contactNumber = normalizedContactNumber;
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

    updateContactNumber(
        contactNumber: string | null,
    ): void {

        const normalized =
            User.normalizeContactNumber(
                contactNumber,
            );

        this.contactNumber = normalized;
        this.updatedAt = new Date();

    }

    static normalizeContactNumber(
        contactNumber: string | null,
    ): string | null {

        if (contactNumber === null) {

            return null;

        }

        const normalized = contactNumber.trim();

        if (!/^\+[1-9]\d{7,14}$/.test(normalized)) {

            throw new Error(
                "User contact number must use E.164 format.",
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
