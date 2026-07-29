import { AuditLog as PrismaAuditLog, Prisma } from "../../generated/prisma/client";

import {
    AuditLog,
    AuditLogStatus,
} from "../../domain/entities/audit-log.entity";


export class AuditLogMapper {


    static toDomain(
        prisma: PrismaAuditLog,
    ): AuditLog {


        return new AuditLog(

            prisma.id,

            prisma.tenantId,

            prisma.userId,

            prisma.action,

            prisma.resource,

            prisma.resourceId,

            prisma.status as AuditLogStatus,

            prisma.metadata
                ? prisma.metadata as Record<string, any>
                : null,

            prisma.createdAt,

        );

    }



    static toPersistence(
        auditLog: AuditLog,
    ) {


        return {

            id: auditLog.id,

            tenantId: auditLog.tenantId,

            userId: auditLog.userId,

            action: auditLog.action,

            resource: auditLog.resource,

            resourceId: auditLog.resourceId,

            status: auditLog.status,

            metadata:
                auditLog.metadata === null
                    ? Prisma.JsonNull
                    : auditLog.metadata,

        };

    }


}
