export const REFRESH_TOKEN_COOKIE_NAME =
    "titan_refresh_token";

const secureCookie =
    process.env.NODE_ENV === "production" ||
    process.env.NODE_ENV === "staging";

export const refreshTokenCookieOptions = {

    httpOnly: true,

    secure: secureCookie,

    sameSite: "strict" as const,

    path: "/api/v1/auth",

    maxAge:
        7 * 24 * 60 * 60 * 1000,

};

export const refreshTokenClearCookieOptions = {

    httpOnly: true,

    secure: secureCookie,

    sameSite: "strict" as const,

    path: "/api/v1/auth",

};
