import { Request, Response, NextFunction } from "express";

import { jwtService } from "../security/jwt";
import { requestContextService } from "../shared/context/request-context.service";
import { logger } from "../logging/logger";


export interface AuthenticatedUser {

    userId: string;

    tenantId: string;

    roles: string[];

}


export interface AuthRequest extends Request {

    user?: AuthenticatedUser;

}


export function authMiddleware(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
): void {


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


        res.status(401).json({

            message: "Authorization header missing",

        });

        return;

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


        res.status(401).json({

            message: "Invalid authorization format",

        });

        return;

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


            res.status(401).json({

                message: "Invalid token payload",

            });


            return;

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


    } catch (error) {


        logger.warn(
            "Authentication failed: invalid or expired token",
            {
                event: "AUTH_FAILURE",
                reason: "INVALID_OR_EXPIRED_TOKEN",
                path: req.originalUrl,
            },
        );


        res.status(401).json({

            message: "Invalid or expired token",

        });

    }

}
