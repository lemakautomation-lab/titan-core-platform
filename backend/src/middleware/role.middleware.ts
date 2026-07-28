import { Response, NextFunction } from "express";

import { AuthRequest } from "./auth.middleware";

import { UserRole } from "../types/roles";

export const authorize =
    (...allowedRoles: UserRole[]) =>
    (
        req: AuthRequest,
        res: Response,
        next: NextFunction,
    ) => {

        if (!req.user) {

            return res.status(401).json({

                authenticated: false,

                message: "User not authenticated",

            });

        }

        const userRoles =
            req.user.roles as UserRole[];

        const authorized =
            userRoles.some(
                role =>
                    allowedRoles.includes(role),
            );

        if (!authorized) {

            return res.status(403).json({

                authenticated: true,

                authorized: false,

                message: "Access denied",

            });

        }

        next();

    };
