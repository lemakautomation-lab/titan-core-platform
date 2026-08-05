import { AuditLogService } from "./audit-log.service";

import { AuditLogStatus } from "../../domain/entities/audit-log.entity";
import { AuditAction } from "../../domain/security/audit-action";
import { AuditResource } from "../../domain/security/audit-resource";

import { logger } from "../../logging/logger";

export class SecurityEventService {

    constructor(
        private readonly auditLogService: AuditLogService,
    ) {}

    async recordAuthenticationSuccess(
        tenantId: string,
        userId: string,
        metadata?: Record<string, unknown>,
    ): Promise<void> {

        logger.info(
            "Authentication successful",
            {
                event: AuditAction.AUTH_SUCCESS,
                userId,
                tenantId,
            },
        );

        await this.auditLogService.log(
            tenantId,
            userId,
            AuditAction.AUTH_SUCCESS,
            AuditResource.AUTHENTICATION,
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
                event: AuditAction.AUTH_FAILURE,
                tenantId,
            },
        );

        await this.auditLogService.log(
            tenantId,
            userId,
            AuditAction.AUTH_FAILURE,
            AuditResource.AUTHENTICATION,
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
                event: AuditAction.PERMISSION_DENIED,
                permission,
                tenantId,
            },
        );

        await this.auditLogService.log(
            tenantId,
            userId,
            AuditAction.PERMISSION_DENIED,
            AuditResource.AUTHORIZATION,
            null,
            AuditLogStatus.FAILURE,
            {
                permission,
                ...(metadata ?? {}),
            },
        );
    }
}
