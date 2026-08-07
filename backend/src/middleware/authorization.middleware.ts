import { Response, NextFunction } from "express";

import { authorizationModule }
    from "../infrastructure/composition/authorization.module";

import { auditLogModule }
    from "../infrastructure/composition/audit-log.module";

import { AuthRequest }
    from "./auth.middleware";

import { RequestWithId }
    from "./request-id.middleware";

import { requestContextService }
    from "../shared/context/request-context.service";

import { UnauthorizedException }
    from "../shared/exceptions/unauthorized.exception";

import { ForbiddenException }
    from "../shared/exceptions/forbidden.exception";


type AuthorizationRequest =
    AuthRequest & RequestWithId;


export function requirePermission(
    permission: string,
) {

    return async (

        req: AuthorizationRequest,

        res: Response,

        next: NextFunction,

    ) => {

        try {

            const authUser =
                req.user;


            if (!authUser) {

                return next(

                    new UnauthorizedException(
                        "Unauthorized",
                    ),

                );

            }


            const allowed =
                await authorizationModule
                    .authorizationService
                    .hasPermission(

                        authUser.userId,

                        permission,

                    );


            if (!allowed) {

                await auditLogModule.securityEventService.recordPermissionDenied(

                    authUser.tenantId,

                    authUser.userId,

                    permission,

                    {
                        method: req.method,
                        path: req.originalUrl,
                        ipAddress: req.ip,
                        userAgent: req.get("User-Agent") ?? undefined,
                        requestId: req.requestId,
                    },

                );

                return next(

                    new ForbiddenException(
                        "Forbidden",
                    ),

                );

            }


            const context =
                requestContextService.get();


            if (context?.security) {

                if (
                    !context.security.permissions.includes(
                        permission,
                    )
                ) {

                    context.security.permissions.push(
                        permission,
                    );

                }

            }


            next();

        }

        catch (error) {

            next(error);

        }

    };

}
