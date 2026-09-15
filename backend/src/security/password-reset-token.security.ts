import {
    createHash,
    randomBytes,
} from "crypto";

export interface GeneratedPasswordResetToken {
    rawToken: string;
    tokenHash: string;
}

export function hashPasswordResetToken(
    rawToken: string,
): string {
    if (
        typeof rawToken !== "string" ||
        !/^[A-Za-z0-9_-]{43}$/.test(rawToken)
    ) {
        throw new Error(
            "Password reset token is invalid.",
        );
    }

    return createHash("sha256")
        .update(rawToken, "utf8")
        .digest("hex");
}

export function generatePasswordResetToken():
    GeneratedPasswordResetToken {
    const rawToken =
        randomBytes(32).toString("base64url");

    return Object.freeze({
        rawToken,
        tokenHash:
            hashPasswordResetToken(rawToken),
    });
}
