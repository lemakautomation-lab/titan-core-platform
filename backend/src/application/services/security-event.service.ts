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



    async recordAuthenticationSuccess(

        tenantId: string | null,

        userId: string | null,

        metadata?: Record<string, unknown>,

        context?: SecurityEventContext,

    ): Promise<void> {


        logger.info(

            "Authentication successful",

            {

                event:
                    SecurityEventType.AUTHENTICATION_SUCCESS,

                userId,

                tenantId,

                requestId:
                    context?.requestId ?? null,

            },

        );


        try {


            const securityEvent =

                SecurityEvent.create(

                    SecurityEventType.AUTHENTICATION_SUCCESS,

                    tenantId,

                    userId,

                    context?.ipAddress ?? null,

                    context?.userAgent ?? null,

                    context?.requestId ?? null,

                    metadata ?? null,

                );


            await this.securityEventRepository.create(

                securityEvent,

            );


        } catch (error) {


            logger.error(

                "Failed to write authentication success security event",

                {

                    userId,

                    tenantId,

                    requestId:
                        context?.requestId ?? null,

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

                event:
                    SecurityEventType.AUTHENTICATION_FAILURE,

                tenantId,

                userId,

                requestId:
                    context?.requestId ?? null,

            },

        );


        try {


            const securityEvent =

                SecurityEvent.create(

                    SecurityEventType.AUTHENTICATION_FAILURE,

                    tenantId,

                    userId,

                    context?.ipAddress ?? null,

                    context?.userAgent ?? null,

                    context?.requestId ?? null,

                    metadata ?? null,

                );


            await this.securityEventRepository.create(

                securityEvent,

            );


        } catch (error) {


            logger.error(

                "Failed to write authentication failure security event",

                {

                    tenantId,

                    userId,

                    requestId:
                        context?.requestId ?? null,

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

                event:
                    SecurityEventType.ACCOUNT_LOCKED,

                tenantId,

                userId,

                requestId:
                    context?.requestId ?? null,

            },

        );


        try {


            const securityEvent =

                SecurityEvent.create(

                    SecurityEventType.ACCOUNT_LOCKED,

                    tenantId,

                    userId,

                    context?.ipAddress ?? null,

                    context?.userAgent ?? null,

                    context?.requestId ?? null,

                    metadata ?? null,

                );


            await this.securityEventRepository.create(

                securityEvent,

            );


        } catch (error) {


            logger.error(

                "Failed to write account locked security event",

                {

                    tenantId,

                    userId,

                    requestId:
                        context?.requestId ?? null,

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

                event:
                    SecurityEventType.AUTHORIZATION_FAILURE,

                permission,

                tenantId,

                userId,

                requestId:
                    context?.requestId ?? null,

            },

        );


        try {


            const securityEvent =

                SecurityEvent.create(

                    SecurityEventType.AUTHORIZATION_FAILURE,

                    tenantId,

                    userId,

                    context?.ipAddress ?? null,

                    context?.userAgent ?? null,

                    context?.requestId ?? null,

                    {

                        permission,

                        ...(metadata ?? {}),

                    },

                );


            await this.securityEventRepository.create(

                securityEvent,

            );


        } catch (error) {


            logger.error(

                "Failed to write authorization failure security event",

                {

                    tenantId,

                    userId,

                    permission,

                    requestId:
                        context?.requestId ?? null,

                    error,

                },

            );

        }

    }



    async recordTokenRefreshSuccess(
        userId: string,
        metadata?: Record<string, unknown>,
        context?: SecurityEventContext,
    ): Promise<void> {


        const securityEvent =
            SecurityEvent.create(

                SecurityEventType.TOKEN_REFRESH_SUCCESS,

                null,

                userId,

                context?.ipAddress ?? null,

                context?.userAgent ?? null,

                context?.requestId ?? null,

                metadata ?? null,

            );


        await this.securityEventRepository.create(
            securityEvent,
        );

    }



    async recordTokenRefreshFailure(
        metadata?: Record<string, unknown>,
        context?: SecurityEventContext,
    ): Promise<void> {


        const securityEvent =
            SecurityEvent.create(

                SecurityEventType.TOKEN_REFRESH_FAILURE,

                null,

                null,

                context?.ipAddress ?? null,

                context?.userAgent ?? null,

                context?.requestId ?? null,

                metadata ?? null,

            );


        await this.securityEventRepository.create(
            securityEvent,
        );

    }

}

