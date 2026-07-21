export const jwtConfig = {
    secret: process.env.JWT_SECRET || "titan-development-secret",
    expiresIn: "24h" as const,
    issuer: "titan-core-platform",
    audience: "titan-api"
};