import { Request, Response, NextFunction } from "express";

import { authorizationModule }
    from "../infrastructure/composition/authorization.module";

export function requirePermission(
    permission: string,
) {

    return async (

        req: Request,

        res: Response,

        next: NextFunction,

    ) => {

        try {

            const authUser =
                (req as any).user;

            if (!authUser) {

                return res.status(401).json({

                    success: false,

                    error: {

                        message: "Unauthorized",

                    },

                });

            }

            const allowed =
                await authorizationModule
                    .authorizationService
                    .hasPermission(

                        authUser.userId,

                        permission,

                    );

            if (!allowed) {

                return res.status(403).json({

                    success: false,

                    error: {

                        message:
                            "Forbidden",

                    },

                });

            }

            next();

        }

        catch (error) {

            next(error);

        }

    };

}
