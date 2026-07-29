import {
    AuditLog,
    AuditLogStatus,
} from "../../domain/entities/audit-log.entity";

import { AuditLogRepository } from "../../domain/repositories/audit-log.repository";


export class AuditLogService {


    constructor(

        private readonly auditLogRepository:
            AuditLogRepository,

    ) {}



    async log(

        tenantId: string,

        userId: string | null,

        action: string,

        resource: string,

        resourceId: string | null,

        status: AuditLogStatus,

        metadata?: Record<string, any> | null,

    ): Promise<AuditLog> {


        const auditLog =

            AuditLog.create(

                tenantId,

                userId,

                action,

                resource,

                resourceId,

                status,

                metadata,

            );


        return this.auditLogRepository.create(

            auditLog,

        );

    }


}
