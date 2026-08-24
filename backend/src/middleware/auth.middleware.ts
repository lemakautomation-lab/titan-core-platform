import { Request, Response, NextFunction } from "express";

import { jwtService } from "../security/jwt";
import { requestContextService } from "../shared/context/request-context.service";
import { logger } from "../logging/logger";
import { UnauthorizedException } from "../shared/exceptions/unauthorized.exception";
import { auditLogModule } from "../infrastructure/composition/audit-log.module";

export interface AuthenticatedUser {

    userId: string;

    tenantId: string;

    roles: string[];

}

export interface AuthRequest extends Request {

    user?: AuthenticatedUser;

}


async function recordAuthenticationFailure(
    req: Request,
    reason: string,
): Promise<void> {

    const context =
        requestContextService.get();

    await auditLogModule.securityEventService.recordAuthenticationFailure(
        null,
        null,
        {
            reason,
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

            requestId:
                context?.requestId ??
                req.get("X-Request-Id") ??
                null,
        },
    );

}


export async function authMiddleware(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
): Promise<void> {

    const authorization =
        req.headers.authorization;

    if (!authorization) {

        logger.warn(
            "Authentication failed: missing authorization header",
            {
                event: "AUTH_FAILURE",
                reason: "MISSING_AUTH_HEADER",
                path: req.originalUrl,
            },
        );

        await recordAuthenticationFailure(
            req,
            "MISSING_AUTH_HEADER",
        );

        return next(
            new UnauthorizedException(
                "Authorization header missing",
            ),
        );

    }

    const parts =
        authorization.split(" ");

    if (
        parts.length !== 2 ||
        parts[0] !== "Bearer"
    ) {

        logger.warn(
            "Authentication failed: invalid authorization format",
            {
                event: "AUTH_FAILURE",
                reason: "INVALID_AUTH_FORMAT",
                path: req.originalUrl,
            },
        );

        await recordAuthenticationFailure(
            req,
            "INVALID_AUTH_FORMAT",
        );

        return next(
            new UnauthorizedException(
                "Invalid authorization format",
            ),
        );

    }

    const token =
        parts[1];

    try {

        const payload =
            jwtService.verifyAccessToken(
                token,
            );

        if (
            !payload.userId ||
            !payload.tenantId
        ) {

            logger.warn(
                "Authentication failed: invalid token payload",
                {
                    event: "AUTH_FAILURE",
                    reason: "INVALID_TOKEN_PAYLOAD",
                    path: req.originalUrl,
                },
            );

            await recordAuthenticationFailure(
                req,
                "INVALID_TOKEN_PAYLOAD",
            );

            return next(
                new UnauthorizedException(
                    "Invalid token payload",
                ),
            );

        }

        const authenticatedUser = {

            userId: payload.userId,

            tenantId: payload.tenantId,

            roles: payload.roles ?? [],

        };

        req.user =
            authenticatedUser;

        const context =
            requestContextService.get();

        if (context) {

            context.security = {

                userId:
                    authenticatedUser.userId,

                tenantId:
                    authenticatedUser.tenantId,

                roles:
                    authenticatedUser.roles,

                permissions: [],

                authenticationMethod:
                    "JWT",

            };

        }

        logger.info(
            "Authentication successful",
            {
                event: "AUTH_SUCCESS",
            },
        );

        next();

    } catch {

        logger.warn(
            "Authentication failed: invalid or expired token",
            {
                event: "AUTH_FAILURE",
                reason: "INVALID_OR_EXPIRED_TOKEN",
                path: req.originalUrl,
            },
        );

        await recordAuthenticationFailure(
            req,
            "INVALID_OR_EXPIRED_TOKEN",
        );

        return next(
            new UnauthorizedException(
                "Invalid or expired token",
            ),
        );

    }

}
