import {
    randomUUID,
} from "node:crypto";

const DEFAULT_TTL_HOURS = 72;
const MAXIMUM_TTL_HOURS = 168;

export type AccountAssistanceStatus =
    "OPEN" |
    "CLOSED" |
    "EXPIRED";

export class AccountAssistanceRequest {
    constructor(
        public readonly id: string,
        public readonly tenantId: string,
        public readonly referenceHash: string,
        public status:
            AccountAssistanceStatus,
        public readonly expiresAt: Date,
        public closedAt: Date | null,
        public readonly createdAt: Date,
    ) {}

    static open(
        tenantId: string,
        referenceHash: string,
        createdAt: Date = new Date(),
        ttlHours = DEFAULT_TTL_HOURS,
    ): AccountAssistanceRequest {
        if (!tenantId.trim()) {
            throw new Error(
                "Account-assistance tenant ownership is required.",
            );
        }

        if (
            !/^[0-9a-f]{64}$/.test(
                referenceHash,
            )
        ) {
            throw new Error(
                "Account-assistance reference hash is invalid.",
            );
        }

        if (
            !Number.isInteger(ttlHours) ||
            ttlHours < 1 ||
            ttlHours > MAXIMUM_TTL_HOURS
        ) {
            throw new Error(
                "Account-assistance expiry is invalid.",
            );
        }

        if (Number.isNaN(createdAt.getTime())) {
            throw new Error(
                "Account-assistance creation time is invalid.",
            );
        }

        return new AccountAssistanceRequest(
            randomUUID(),
            tenantId,
            referenceHash,
            "OPEN",
            new Date(
                createdAt.getTime() +
                ttlHours * 60 * 60_000,
            ),
            null,
            createdAt,
        );
    }

    isOpen(
        at: Date = new Date(),
    ): boolean {
        return (
            this.status === "OPEN" &&
            at.getTime() <
                this.expiresAt.getTime()
        );
    }

    close(
        at: Date = new Date(),
    ): void {
        if (!this.isOpen(at)) {
            throw new Error(
                "Account-assistance request is unavailable.",
            );
        }

        this.status = "CLOSED";
        this.closedAt = at;
    }

    expire(
        at: Date = new Date(),
    ): void {
        if (
            this.status !== "OPEN" ||
            at.getTime() <
                this.expiresAt.getTime()
        ) {
            return;
        }

        this.status = "EXPIRED";
    }
}
