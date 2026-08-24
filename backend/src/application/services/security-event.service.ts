import { SecurityEvent } from "../../domain/entities/security-event.entity";
import { SecurityEventRepository } from "../../domain/repositories/security-event.repository";
import { SecurityEventType } from "../../domain/security/security-event-type";
import { logger } from "../../logging/logger";


export interface SecurityEventContext {

    ipAddress?: string | null;

    userAgent?: string | null;

    requestId?: string | null;

}


export class SecurityEventService {

    constructor(
        private readonly securityEventRepository: SecurityEventRepository,
    ) {}


    private async persist(
        eventType: SecurityEventType,
        tenantId: string | null,
        userId: string | null,
        metadata: Record<string, unknown> | null,
        context?: SecurityEventContext,
    ): Promise<void> {

        const securityEvent =
            SecurityEvent.create(
                eventType,
                tenantId,
                userId,
                context?.ipAddress ?? null,
                context?.userAgent ?? null,
                context?.requestId ?? null,
                metadata,
            );

        await this.securityEventRepository.create(
            securityEvent,
        );
    }


    async recordAuthenticationSuccess(
        tenantId: string | null,
        userId: string | null,
        metadata?: Record<string, unknown>,
        context?: SecurityEventContext,
    ): Promise<void> {

        logger.info(
            "Authentication successful",
            {
                event: SecurityEventType.AUTHENTICATION_SUCCESS,
                userId,
                tenantId,
                requestId: context?.requestId ?? null,
            },
        );

        try {

            await this.persist(
                SecurityEventType.AUTHENTICATION_SUCCESS,
                tenantId,
                userId,
                metadata ?? null,
                context,
            );

        } catch (error) {

            logger.error(
                "Failed to write authentication success security event",
                {
                    userId,
                    tenantId,
                    requestId: context?.requestId ?? null,
                    error,
                },
            );

        }
    }


    async recordAuthenticationFailure(
        tenantId: string | null,
        userId: string | null,
        metadata?: Record<string, unknown>,
        context?: SecurityEventContext,
    ): Promise<void> {

        logger.warn(
            "Authentication failed",
            {
                event: SecurityEventType.AUTHENTICATION_FAILURE,
                userId,
                tenantId,
                requestId: context?.requestId ?? null,
            },
        );

        try {

            await this.persist(
                SecurityEventType.AUTHENTICATION_FAILURE,
                tenantId,
                userId,
                metadata ?? null,
                context,
            );

        } catch (error) {

            logger.error(
                "Failed to write authentication failure security event",
                {
                    tenantId,
                    userId,
                    requestId: context?.requestId ?? null,
                    error,
                },
            );

        }
    }


    async recordAccountLocked(
        tenantId: string | null,
        userId: string | null,
        metadata?: Record<string, unknown>,
        context?: SecurityEventContext,
    ): Promise<void> {

        logger.warn(
            "Account locked",
            {
                event: SecurityEventType.ACCOUNT_LOCKED,
                tenantId,
                userId,
                requestId: context?.requestId ?? null,
            },
        );

        try {

            await this.persist(
                SecurityEventType.ACCOUNT_LOCKED,
                tenantId,
                userId,
                metadata ?? null,
                context,
            );

        } catch (error) {

            logger.error(
                "Failed to write account locked security event",
                {
                    tenantId,
                    userId,
                    requestId: context?.requestId ?? null,
                    error,
                },
            );

        }
    }


    async recordPermissionDenied(
        tenantId: string | null,
        userId: string | null,
        permission: string,
        metadata?: Record<string, unknown>,
        context?: SecurityEventContext,
    ): Promise<void> {

        logger.warn(
            "Permission denied",
            {
                event: SecurityEventType.AUTHORIZATION_FAILURE,
                permission,
                tenantId,
                userId,
                requestId: context?.requestId ?? null,
            },
        );

        try {

            await this.persist(
                SecurityEventType.AUTHORIZATION_FAILURE,
                tenantId,
                userId,
                {
                    permission,
                    ...(metadata ?? {}),
                },
                context,
            );

        } catch (error) {

            logger.error(
                "Failed to write authorization failure security event",
                {
                    tenantId,
                    userId,
                    permission,
                    requestId: context?.requestId ?? null,
                    error,
                },
            );

        }
    }


    async recordTokenRefreshSuccess(
        tenantId: string,
        userId: string,
        metadata?: Record<string, unknown>,
        context?: SecurityEventContext,
    ): Promise<void> {

        logger.info(
            "Token refresh successful",
            {
                event: SecurityEventType.TOKEN_REFRESH_SUCCESS,
                tenantId,
                userId,
                requestId: context?.requestId ?? null,
            },
        );

        await this.persist(
            SecurityEventType.TOKEN_REFRESH_SUCCESS,
            tenantId,
            userId,
            metadata ?? null,
            context,
        );
    }


    async recordTokenRefreshFailure(
        metadata?: Record<string, unknown>,
        context?: SecurityEventContext,
        tenantId?: string | null,
        userId?: string | null,
    ): Promise<void> {

        logger.warn(
            "Token refresh failed",
            {
                event: SecurityEventType.TOKEN_REFRESH_FAILURE,
                tenantId: tenantId ?? null,
                userId: userId ?? null,
                requestId: context?.requestId ?? null,
            },
        );

        await this.persist(
            SecurityEventType.TOKEN_REFRESH_FAILURE,
            tenantId ?? null,
            userId ?? null,
            metadata ?? null,
            context,
        );
    }


    async recordTokenReuseDetected(
        tenantId: string | null,
        userId: string,
        metadata?: Record<string, unknown>,
        context?: SecurityEventContext,
    ): Promise<void> {

        logger.warn(
            "Refresh token reuse detected",
            {
                event: SecurityEventType.TOKEN_REUSE_DETECTED,
                tenantId,
                userId,
                requestId: context?.requestId ?? null,
            },
        );

        try {

            await this.persist(
                SecurityEventType.TOKEN_REUSE_DETECTED,
                tenantId,
                userId,
                metadata ?? null,
                context,
            );

        } catch (error) {

            logger.error(
                "Failed to write token reuse detection security event",
                {
                    tenantId,
                    userId,
                    requestId: context?.requestId ?? null,
                    error,
                },
            );

        }
    }


    async recordSessionRevoked(
        userId: string,
        metadata?: Record<string, unknown>,
        context?: SecurityEventContext,
    ): Promise<void> {

        logger.info(
            "Session revoked",
            {
                event: SecurityEventType.SESSION_REVOKED,
                userId,
                requestId: context?.requestId ?? null,
            },
        );

        try {

            await this.persist(
                SecurityEventType.SESSION_REVOKED,
                null,
                userId,
                metadata ?? null,
                context,
            );

        } catch (error) {

            logger.error(
                "Failed to write session revoked security event",
                {
                    userId,
                    requestId: context?.requestId ?? null,
                    error,
                },
            );

        }
    }


    async recordRateLimitExceeded(
        tenantId: string | null,
        userId: string | null,
        metadata?: Record<string, unknown>,
        context?: SecurityEventContext,
    ): Promise<void> {

        logger.warn(
            "Rate limit exceeded",
            {
                event: SecurityEventType.RATE_LIMIT_EXCEEDED,
                tenantId,
                userId,
                requestId: context?.requestId ?? null,
            },
        );

        try {

            await this.persist(
                SecurityEventType.RATE_LIMIT_EXCEEDED,
                tenantId,
                userId,
                metadata ?? null,
                context,
            );

        } catch (error) {

            logger.error(
                "Failed to write rate limit exceeded security event",
                {
                    tenantId,
                    userId,
                    requestId: context?.requestId ?? null,
                    error,
                },
            );

        }
    }

}
