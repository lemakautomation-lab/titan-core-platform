import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import { UserRole } from "../types/roles";

export const authorize =
    (...allowedRoles: UserRole[]) =>
    (
        req: AuthRequest,
        res: Response,
        next: NextFunction
    ) => {

        if (!req.user) {
            return res.status(401).json({
                authenticated: false,
                message: "User not authenticated"
            });
        }

        const userRole = req.user.role as UserRole;

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                authenticated: true,
                authorized: false,
                message: "Access denied"
            });
        }

        next();
    };