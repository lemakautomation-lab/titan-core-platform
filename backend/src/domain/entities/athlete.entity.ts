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

        public countryCode: string | null = null,

    ) {}

    static create(
        tenantId: string,
        organisationId: string | null,
        userId: string | null,
        firstName: string,
        lastName: string,
        dateOfBirth: Date | null,
        countryCode: string | null = null,
    ): Athlete {

        const now = new Date();

        return new Athlete(
            randomUUID(),
            tenantId,
            organisationId,
            userId,
            Athlete.normalizeFirstName(firstName),
            Athlete.normalizeLastName(lastName),
            dateOfBirth,
            RecordStatus.ACTIVE,
            now,
            now,
            countryCode === null
                ? null
                : Athlete.normalizeCountryCode(
                    countryCode,
                ),
        );

    }

    updateProfile(
        organisationId: string | null,
        userId: string | null,
        firstName: string,
        lastName: string,
        dateOfBirth: Date | null,
    ): void {

        const normalizedFirstName =
            Athlete.normalizeFirstName(firstName);

        const normalizedLastName =
            Athlete.normalizeLastName(lastName);

        this.organisationId = organisationId;
        this.userId = userId;
        this.firstName = normalizedFirstName;
        this.lastName = normalizedLastName;
        this.dateOfBirth = dateOfBirth;
        this.updatedAt = new Date();

    }

    updateCountry(
        countryCode: string,
    ): void {

        this.countryCode =
            Athlete.normalizeCountryCode(
                countryCode,
            );

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

    private static normalizeCountryCode(
        countryCode: string,
    ): string {

        if (
            typeof countryCode !== "string" ||
            !countryCode.trim()
        ) {

            throw new Error(
                "Athlete country code is required.",
            );

        }

        const normalized =
            countryCode.trim().toUpperCase();

        if (!/^[A-Z]{2}$/.test(normalized)) {

            throw new Error(
                "Athlete country code must contain exactly two letters.",
            );

        }

        return normalized;

    }
    private static normalizeLastName(
        lastName: string,
    ): string {

        if (
            typeof lastName !== "string" ||
            !lastName.trim()
        ) {

            throw new Error(
                "Athlete surname is required.",
            );

        }

        const normalized = lastName.trim();

        if (normalized.length > 100) {

            throw new Error(
                "Athlete surname must not exceed 100 characters.",
            );

        }

        return normalized;

    }
    private static normalizeFirstName(
        firstName: string,
    ): string {

        if (
            typeof firstName !== "string" ||
            !firstName.trim()
        ) {

            throw new Error(
                "Athlete first name is required.",
            );

        }

        const normalized = firstName.trim();

        if (normalized.length > 100) {

            throw new Error(
                "Athlete first name must not exceed 100 characters.",
            );

        }

        return normalized;

    }

}
