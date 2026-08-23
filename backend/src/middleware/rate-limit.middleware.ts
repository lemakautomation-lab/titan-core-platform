import rateLimit from "express-rate-limit";


const rateLimitMessage = {
    error:
        "Too Many Requests",

    message:
        "Rate limit exceeded. Please try again later.",
};


const authRateLimitMessage = {
    error:
        "Too Many Requests",

    message:
        "Too many authentication attempts. Please try again later.",
};


export function createApiRateLimiter(
    windowMs:
        number =
            Number(
                process.env.RATE_LIMIT_WINDOW_MS ??
                15 * 60 * 1000,
            ),

    limit:
        number =
            Number(
                process.env.RATE_LIMIT_MAX_REQUESTS ??
                100,
            ),
) {

    return rateLimit({

        windowMs,

        limit,

        standardHeaders:
            true,

        legacyHeaders:
            false,

        message:
            rateLimitMessage,

    });

}


export function createAuthRateLimiter(
    windowMs:
        number =
            Number(
                process.env.AUTH_RATE_LIMIT_WINDOW_MS ??
                15 * 60 * 1000,
            ),

    limit:
        number =
            Number(
                process.env.AUTH_RATE_LIMIT_MAX_REQUESTS ??
                10,
            ),
) {

    return rateLimit({

        windowMs,

        limit,

        standardHeaders:
            true,

        legacyHeaders:
            false,

        message:
            authRateLimitMessage,

    });

}


export const apiRateLimiter =
    createApiRateLimiter();


export const authRateLimiter =
    createAuthRateLimiter();
