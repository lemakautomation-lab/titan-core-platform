import { Response } from "express";

import { AuthRequest } from "../../middleware/auth.middleware";

import { GetAuditLogsQuery } from "../../application/queries/get-audit-logs.query";
import { GetAuditLogByIdQuery } from "../../application/queries/get-audit-log-by-id.query";


export class AuditLogController {


    constructor(

        private readonly getAuditLogsQuery:
            GetAuditLogsQuery,


        private readonly getAuditLogByIdQuery:
            GetAuditLogByIdQuery,

    ) {}



    async list(

        req: AuthRequest,

        res: Response,

    ): Promise<void> {


        const authUser = req.user;


        if (!authUser) {

            res.status(401).json({

                error: "Unauthorized",

            });

            return;

        }



        const result =

            await this.getAuditLogsQuery.execute({

                tenantId:
                    authUser.tenantId,

                action:
                    req.query.action as string | undefined,

                resource:
                    req.query.resource as string | undefined,

                status:
                    req.query.status as string | undefined,

                userId:
                    req.query.userId as string | undefined,

                resourceId:
                    req.query.resourceId as string | undefined,

                from:
                    req.query.from
                        ? new Date(String(req.query.from))
                        : undefined,

                to:
                    req.query.to
                        ? new Date(String(req.query.to))
                        : undefined,

                page:
                    req.query.page
                        ? Number(req.query.page)
                        : 1,

                limit:
                    req.query.limit
                        ? Number(req.query.limit)
                        : 50,

            });



        const totalPages =

            Math.ceil(

                result.total / result.limit,

            );



        res.json({

            items:

                result.items.map(

                    audit => ({

                        id: audit.id,

                        action: audit.action,

                        resource: audit.resource,

                        status: audit.status,

                        resourceId:
                            audit.resourceId,

                        userId:
                            audit.userId,

                        metadata:
                            audit.metadata,

                        createdAt:
                            audit.createdAt,

                    }),

                ),


            pagination: {

                page:
                    result.page,

                limit:
                    result.limit,

                total:
                    result.total,

                totalPages,

            },

        });


    }





    async getById(

        req: AuthRequest,

        res: Response,

    ): Promise<void> {


        const authUser = req.user;


        if (!authUser) {

            res.status(401).json({

                error: "Unauthorized",

            });

            return;

        }



        const auditLog =

            await this.getAuditLogByIdQuery.execute({

                id:
                    String(req.params.id),

                tenantId:
                    authUser.tenantId,

            });



        if (!auditLog) {

            res.status(404).json({

                error: "Audit log not found",

            });

            return;

        }



        res.json({

            id: auditLog.id,

            action: auditLog.action,

            resource: auditLog.resource,

            status: auditLog.status,

            resourceId:
                auditLog.resourceId,

            userId:
                auditLog.userId,

            metadata:
                auditLog.metadata,

            createdAt:
                auditLog.createdAt,

        });


    }


}


