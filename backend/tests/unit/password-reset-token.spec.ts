import {
    describe,
    expect,
    it,
} from "vitest";

import {
    PasswordResetToken,
} from "../../src/domain/entities/password-reset-token.entity";

const hash = "a".repeat(64);
const issuedAt =
    new Date("2026-09-15T10:00:00.000Z");

describe("PasswordResetToken", () => {
    it("issues a bounded active token", () => {
        const token =
            PasswordResetToken.issue(
                "tenant-1",
                "user-1",
                hash,
                issuedAt,
                15,
            );

        expect(token.tenantId).toBe("tenant-1");
        expect(token.userId).toBe("user-1");
        expect(token.tokenHash).toBe(hash);
        expect(token.expiresAt.toISOString())
            .toBe("2026-09-15T10:15:00.000Z");
        expect(token.isActive(issuedAt)).toBe(true);
    });

    it("rejects invalid ownership and hashes", () => {
        expect(() =>
            PasswordResetToken.issue(
                "",
                "user-1",
                hash,
                issuedAt,
            ),
        ).toThrow(
            "Password reset ownership is required.",
        );

        expect(() =>
            PasswordResetToken.issue(
                "tenant-1",
                "user-1",
                "raw-token",
                issuedAt,
            ),
        ).toThrow(
            "Password reset token hash is invalid.",
        );
    });

    it("rejects expiry outside the bounded range", () => {
        for (const ttl of [0, 61, 1.5]) {
            expect(() =>
                PasswordResetToken.issue(
                    "tenant-1",
                    "user-1",
                    hash,
                    issuedAt,
                    ttl,
                ),
            ).toThrow(
                "Password reset expiry is invalid.",
            );
        }
    });

    it("consumes a token only once", () => {
        const token =
            PasswordResetToken.issue(
                "tenant-1",
                "user-1",
                hash,
                issuedAt,
            );

        const consumedAt =
            new Date("2026-09-15T10:05:00.000Z");

        token.consume(consumedAt);

        expect(token.consumedAt)
            .toEqual(consumedAt);
        expect(token.isActive(consumedAt))
            .toBe(false);

        expect(() =>
            token.consume(consumedAt),
        ).toThrow(
            "Password reset token is invalid or expired.",
        );
    });

    it("rejects expired or revoked tokens", () => {
        const expired =
            PasswordResetToken.issue(
                "tenant-1",
                "user-1",
                hash,
                issuedAt,
                15,
            );

        expect(() =>
            expired.consume(
                new Date(
                    "2026-09-15T10:15:00.000Z",
                ),
            ),
        ).toThrow(
            "Password reset token is invalid or expired.",
        );

        const revoked =
            PasswordResetToken.issue(
                "tenant-1",
                "user-1",
                hash,
                issuedAt,
            );

        revoked.revoke(
            new Date("2026-09-15T10:01:00.000Z"),
        );

        expect(revoked.isActive(issuedAt))
            .toBe(false);
    });
});
