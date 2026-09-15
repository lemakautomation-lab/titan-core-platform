import { randomUUID } from "crypto";

const MINIMUM_TTL_MINUTES = 1;
const MAXIMUM_TTL_MINUTES = 60;

export class PasswordResetToken {
    constructor(
        public readonly id: string,
        public readonly tenantId: string,
        public readonly userId: string,
        public readonly tokenHash: string,
        public readonly expiresAt: Date,
        public consumedAt: Date | null,
        public revokedAt: Date | null,
        public readonly createdAt: Date,
    ) {}

    static issue(
        tenantId: string,
        userId: string,
        tokenHash: string,
        issuedAt: Date = new Date(),
        ttlMinutes = 15,
    ): PasswordResetToken {
        if (!tenantId.trim() || !userId.trim()) {
            throw new Error(
                "Password reset ownership is required.",
            );
        }

        if (!/^[0-9a-f]{64}$/.test(tokenHash)) {
            throw new Error(
                "Password reset token hash is invalid.",
            );
        }

        if (
            !Number.isInteger(ttlMinutes) ||
            ttlMinutes < MINIMUM_TTL_MINUTES ||
            ttlMinutes > MAXIMUM_TTL_MINUTES
        ) {
            throw new Error(
                "Password reset expiry is invalid.",
            );
        }

        if (Number.isNaN(issuedAt.getTime())) {
            throw new Error(
                "Password reset issue time is invalid.",
            );
        }

        return new PasswordResetToken(
            randomUUID(),
            tenantId,
            userId,
            tokenHash,
            new Date(
                issuedAt.getTime() +
                ttlMinutes * 60_000,
            ),
            null,
            null,
            issuedAt,
        );
    }

    isActive(
        at: Date = new Date(),
    ): boolean {
        return (
            this.consumedAt === null &&
            this.revokedAt === null &&
            at.getTime() < this.expiresAt.getTime()
        );
    }

    consume(
        at: Date = new Date(),
    ): void {
        if (!this.isActive(at)) {
            throw new Error(
                "Password reset token is invalid or expired.",
            );
        }

        this.consumedAt = at;
    }

    revoke(
        at: Date = new Date(),
    ): void {
        if (
            this.consumedAt !== null ||
            this.revokedAt !== null
        ) {
            return;
        }

        this.revokedAt = at;
    }
}
