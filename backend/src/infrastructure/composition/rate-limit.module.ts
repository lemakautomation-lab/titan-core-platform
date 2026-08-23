import { Request } from "express";

import {
    apiRateLimiter,
    authRateLimiter,
    resetApiRateLimiter,
    resetAuthRateLimiter,
    resetRateLimiters,
    setRateLimitExceededHandler,
} from "../../middleware/rate-limit.middleware";

import { auditLogModule } from "./audit-log.module";
import { requestContextService } from "../../shared/context/request-context.service";


export async function recordRateLimitExceeded(
    req: Request,
): Promise<void> {

    const context =
        requestContextService.get();

    const security =
        context?.security;

    const requestId =
        context?.requestId ??
        req.get("X-Request-Id") ??
        null;

    await auditLogModule.securityEventService.recordRateLimitExceeded(
        security?.tenantId ?? null,
        security?.userId ?? null,
        {
            method:
                req.method,

            path:
                req.originalUrl,
        },
        {
            ipAddress:
                req.ip ?? null,

            userAgent:
                req.get("user-agent") ?? null,

            requestId,
        },
    );

}


/*
 * Register the infrastructure rate-limit callback through the
 * composition root. The middleware retains responsibility for
 * enforcing HTTP 429; this callback is responsible only for
 * security-event persistence.
 */

setRateLimitExceededHandler(
    recordRateLimitExceeded,
);


export {
    apiRateLimiter,
    authRateLimiter,
    resetApiRateLimiter,
    resetAuthRateLimiter,
    resetRateLimiters,
};


export const rateLimitModule = {

    recordRateLimitExceeded,

    apiRateLimiter,

    authRateLimiter,

    resetApiRateLimiter,

    resetAuthRateLimiter,

    resetRateLimiters,

};
