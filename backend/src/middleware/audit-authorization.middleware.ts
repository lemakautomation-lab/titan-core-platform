import { Response, NextFunction } from "express";

import { AuthRequest } from "./auth.middleware";

import { authorizationModule }
    from "../infrastructure/composition/authorization.module";


export function requireAuditAccess() {


    return async (

        req: AuthRequest,

        res: Response,

        next: NextFunction,

    ) => {


        const authUser = req.user;


        if (!authUser) {

            res.status(401).json({

                error: "Unauthorized",

            });

            return;

        }


        const canReadAll =

            await authorizationModule
                .authorizationService
                .hasPermission(

                    authUser.userId,

                    "audit.read.all",

                );


        if (canReadAll) {

            next();

            return;

        }


        const canRead =

            await authorizationModule
                .authorizationService
                .hasPermission(

                    authUser.userId,

                    "audit.read",

                );


        if (!canRead) {

            res.status(403).json({

                error: "Forbidden",

            });

            return;

        }


        (req as any).auditOwnOnly = true;


        next();


    };


}
