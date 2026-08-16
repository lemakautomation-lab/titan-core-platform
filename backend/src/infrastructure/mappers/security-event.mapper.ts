import {
    SecurityEvent as PrismaSecurityEvent,
    Prisma,
} from "../../generated/prisma/client";

import {
    SecurityEventType as PrismaSecurityEventType,
} from "../../generated/prisma/enums";

import {
    SecurityEvent,
} from "../../domain/entities/security-event.entity";

import {
    SecurityEventType,
} from "../../domain/security/security-event-type";


export class SecurityEventMapper {

    static toDomain(
        prisma: PrismaSecurityEvent,
    ): SecurityEvent {

        return new SecurityEvent(
            prisma.id,
            prisma.eventType as SecurityEventType,
            prisma.tenantId,
            prisma.userId,
            prisma.ipAddress,
            prisma.userAgent,
            prisma.requestId,
            prisma.metadata
                ? prisma.metadata as Record<string, any>
                : null,
            prisma.createdAt,
        );
    }


    static toPersistence(
        securityEvent: SecurityEvent,
    ) {

        return {
            id:
                securityEvent.id,

            eventType:
                securityEvent.eventType as PrismaSecurityEventType,

            tenantId:
                securityEvent.tenantId,

            userId:
                securityEvent.userId,

            ipAddress:
                securityEvent.ipAddress,

            userAgent:
                securityEvent.userAgent,

            requestId:
                securityEvent.requestId,

            metadata:
                securityEvent.metadata === null
                    ? Prisma.JsonNull
                    : securityEvent.metadata,

            createdAt:
                securityEvent.createdAt,
        };
    }
}
