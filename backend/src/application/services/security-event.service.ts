import {
    AuditLogService,
} from "./audit-log.service";

import {
    AuditLogStatus,
} from "../../domain/entities/audit-log.entity";

import {
    logger,
} from "../../logging/logger";


export class SecurityEventService {


    constructor(

        private readonly auditLogService:
            AuditLogService,

    ) {}


    async recordAuthenticationSuccess(

        tenantId: string,

        userId: string,

        metadata?: Record<string, unknown>,

    ): Promise<void> {


        logger.info(
            "Authentication successful",
            {
                event: "AUTH_SUCCESS",
                userId,
                tenantId,
            },
        );


        await this.auditLogService.log(

            tenantId,

            userId,

            "AUTH_SUCCESS",

            "AUTHENTICATION",

            null,

            AuditLogStatus.SUCCESS,

            metadata ?? null,

        );

    }



    async recordAuthenticationFailure(

        tenantId: string,

        userId: string | null,

        metadata?: Record<string, unknown>,

    ): Promise<void> {


        logger.warn(
            "Authentication failed",
            {
                event: "AUTH_FAILURE",
                tenantId,
            },
        );


        await this.auditLogService.log(

            tenantId,

            userId,

            "AUTH_FAILURE",

            "AUTHENTICATION",

            null,

            AuditLogStatus.FAILURE,

            metadata ?? null,

        );

    }



    async recordPermissionDenied(

        tenantId: string,

        userId: string,

        permission: string,

        metadata?: Record<string, unknown>,

    ): Promise<void> {


        logger.warn(
            "Permission denied",
            {
                event: "PERMISSION_DENIED",
                permission,
                tenantId,
            },
        );


        await this.auditLogService.log(

            tenantId,

            userId,

            "PERMISSION_DENIED",

            "AUTHORIZATION",

            null,

            AuditLogStatus.FAILURE,

            {
                permission,
                ...(metadata ?? {}),
            },

        );

    }


}
