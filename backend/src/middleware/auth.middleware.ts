import { Request, Response, NextFunction } from "express";

import { jwtService } from "../security/jwt";


export interface AuthenticatedUser {

    userId: string;

    tenantId: string;

    role?: string;

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

            res.status(401).json({

                message: "Invalid token payload",

            });

            return;

        }


        req.user = {

            userId: payload.userId,

            tenantId: payload.tenantId,

            role: payload.role,

        };


        next();


    } catch (error) {


        console.error(
            "JWT VERIFY ERROR:",
            error,
        );


        res.status(401).json({

            message: "Invalid or expired token",

        });

    }

}
