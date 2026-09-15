import {
    describe,
    expect,
    it,
} from "vitest";

import {
    generatePasswordResetToken,
    hashPasswordResetToken,
} from "../../src/security/password-reset-token.security";

describe("password reset token security", () => {
    it("generates a high-entropy URL-safe token and hash", () => {
        const generated =
            generatePasswordResetToken();

        expect(generated.rawToken)
            .toMatch(/^[A-Za-z0-9_-]{43}$/);

        expect(generated.tokenHash)
            .toMatch(/^[0-9a-f]{64}$/);

        expect(generated.tokenHash)
            .not.toContain(generated.rawToken);
    });

    it("generates unique token material", () => {
        const first =
            generatePasswordResetToken();

        const second =
            generatePasswordResetToken();

        expect(first.rawToken)
            .not.toBe(second.rawToken);

        expect(first.tokenHash)
            .not.toBe(second.tokenHash);
    });

    it("hashes the same token deterministically", () => {
        const generated =
            generatePasswordResetToken();

        expect(
            hashPasswordResetToken(
                generated.rawToken,
            ),
        ).toBe(generated.tokenHash);
    });

    it("rejects malformed raw tokens", () => {
        for (const token of [
            "",
            "short",
            "a".repeat(42),
            "a".repeat(44),
            `${"a".repeat(42)}+`,
        ]) {
            expect(() =>
                hashPasswordResetToken(token),
            ).toThrow(
                "Password reset token is invalid.",
            );
        }
    });
});
