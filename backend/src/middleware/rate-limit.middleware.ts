import rateLimit, {
    MemoryStore,
    type RateLimitExceededEventHandler,
    type RateLimitRequestHandler,
} from "express-rate-limit";


export type RateLimitExceededHandler =
    (
        request:
            Parameters<RateLimitExceededEventHandler>[0],
    ) =>
        void |
        Promise<void>;


let rateLimitExceededHandler:
    RateLimitExceededHandler |
    undefined;


export function setRateLimitExceededHandler(
    handler:
        RateLimitExceededHandler,
): void {

    rateLimitExceededHandler =
        handler;

}


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


function createRateLimitHandler(
    message:
        typeof rateLimitMessage,

    onLimitExceeded?:
        RateLimitExceededHandler,
): RateLimitExceededEventHandler {

    return async (
        request,
        response,
    ): Promise<void> => {

        if (onLimitExceeded) {

            try {

                await onLimitExceeded(
                    request,
                );

            } catch {

                /*
                 * Security-event persistence must never prevent
                 * the rate limiter from returning HTTP 429.
                 */

            }

        }

        response
            .status(429)
            .send(message);

    };

}


function createManagedRateLimiter(
    windowMs:
        number,

    limit:
        number,

    message:
        typeof rateLimitMessage,

    onLimitExceeded?:
        RateLimitExceededHandler,
): {
    limiter:
        RateLimitRequestHandler;

    store:
        MemoryStore;
} {

    const store =
        new MemoryStore();

    const limiter =
        rateLimit({

            windowMs,

            limit,

            store,

            /*
             * Emit the consolidated RateLimit header required by
             * the TITAN HTTP rate-limit contract.
             */

            standardHeaders:
                false,

            legacyHeaders:
                true,

            handler:
                createRateLimitHandler(
                    message,
                    onLimitExceeded,
                ),

        });

    return {
        limiter,
        store,
    };

}


const apiRateLimiterState =
    createManagedRateLimiter(
        Number(
            process.env.RATE_LIMIT_WINDOW_MS ??
            15 * 60 * 1000,
        ),

        Number(
            process.env.RATE_LIMIT_MAX_REQUESTS ??
            100,
        ),

        rateLimitMessage,

        request => {

            return rateLimitExceededHandler?.(
                request,
            );

        },
    );


const authRateLimiterState =
    createManagedRateLimiter(
        Number(
            process.env.AUTH_RATE_LIMIT_WINDOW_MS ??
            15 * 60 * 1000,
        ),

        Number(
            process.env.AUTH_RATE_LIMIT_MAX_REQUESTS ??
            10,
        ),

        authRateLimitMessage,

        request => {

            return rateLimitExceededHandler?.(
                request,
            );

        },
    );


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

    onLimitExceeded?:
        RateLimitExceededHandler,
): RateLimitRequestHandler {

    return createManagedRateLimiter(
        windowMs,
        limit,
        rateLimitMessage,
        onLimitExceeded,
    ).limiter;

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

    onLimitExceeded?:
        RateLimitExceededHandler,
): RateLimitRequestHandler {

    return createManagedRateLimiter(
        windowMs,
        limit,
        authRateLimitMessage,
        onLimitExceeded,
    ).limiter;

}


export const apiRateLimiter =
    apiRateLimiterState.limiter;


export const authRateLimiter =
    authRateLimiterState.limiter;


export async function resetApiRateLimiter(): Promise<void> {

    await apiRateLimiterState.store.resetAll();

}


export async function resetAuthRateLimiter(): Promise<void> {

    await authRateLimiterState.store.resetAll();

}


export async function resetRateLimiters(): Promise<void> {

    await Promise.all([
        resetApiRateLimiter(),
        resetAuthRateLimiter(),
    ]);

}


