const jwtSecret =
    process.env.JWT_SECRET;

if (!jwtSecret) {
    throw new Error(
        "JWT_SECRET environment variable is required",
    );
}

export const jwtConfig = {
    secret: jwtSecret,
    expiresIn: "24h" as const,
    issuer: "titan-core-platform",
    audience: "titan-api",
};
