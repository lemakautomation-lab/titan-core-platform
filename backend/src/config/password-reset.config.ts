const DEFAULT_TTL_MINUTES = 15;
const MAXIMUM_TTL_MINUTES = 60;

export interface ResendPasswordResetConfig {
    apiKey: string;
    fromEmail: string;
}

export function getPasswordResetTokenTtlMinutes(
    value:
        string | undefined =
            process.env
                .PASSWORD_RESET_TOKEN_TTL_MINUTES,
): number {
    if (value === undefined) {
        return DEFAULT_TTL_MINUTES;
    }

    const ttlMinutes =
        Number(value.trim());

    if (
        !Number.isInteger(ttlMinutes) ||
        ttlMinutes < 1 ||
        ttlMinutes > MAXIMUM_TTL_MINUTES
    ) {
        throw new Error(
            "Password reset token expiry is invalid.",
        );
    }

    return ttlMinutes;
}

export function getPasswordResetFrontendUrl(
    value:
        string | undefined =
            process.env
                .TITAN_HEALTH_FRONTEND_URL,
    nodeEnvironment:
        string | undefined =
            process.env.NODE_ENV,
): string {
    const configuredValue =
        value ??
        (
            nodeEnvironment !== "production"
                ? "http://localhost:5173"
                : undefined
        );

    if (!configuredValue?.trim()) {
        throw new Error(
            "TITAN Health frontend URL is not configured.",
        );
    }

    let url: URL;

    try {
        url = new URL(configuredValue.trim());
    }
    catch {
        throw new Error(
            "TITAN Health frontend URL is invalid.",
        );
    }

    if (
        !["http:", "https:"].includes(
            url.protocol,
        ) ||
        url.username ||
        url.password
    ) {
        throw new Error(
            "TITAN Health frontend URL is invalid.",
        );
    }

    if (
        nodeEnvironment === "production" &&
        url.protocol !== "https:"
    ) {
        throw new Error(
            "TITAN Health frontend URL must use HTTPS.",
        );
    }

    return url.origin;
}

export function getResendPasswordResetConfig(
    apiKey:
        string | undefined =
            process.env.RESEND_API_KEY,
    fromEmail:
        string | undefined =
            process.env
                .PASSWORD_RESET_FROM_EMAIL,
    nodeEnvironment:
        string | undefined =
            process.env.NODE_ENV,
): ResendPasswordResetConfig | null {
    const normalizedApiKey =
        apiKey?.trim();

    const normalizedFromEmail =
        fromEmail?.trim();

    if (
        !normalizedApiKey ||
        !normalizedFromEmail
    ) {
        if (nodeEnvironment === "production") {
            throw new Error(
                "Production password-reset email delivery is not configured.",
            );
        }

        return null;
    }

    if (
        /[\r\n]/.test(normalizedFromEmail) ||
        !normalizedFromEmail.includes("@")
    ) {
        throw new Error(
            "Password-reset sender email is invalid.",
        );
    }

    return Object.freeze({
        apiKey:
            normalizedApiKey,
        fromEmail:
            normalizedFromEmail,
    });
}
