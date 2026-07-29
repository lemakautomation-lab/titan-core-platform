import { AuditLog } from "../entities/audit-log.entity";


export interface AuditLogRepository {


    create(
        auditLog: AuditLog,
    ): Promise<AuditLog>;


    findById(
        id: string,
    ): Promise<AuditLog | null>;


    findAllByTenantId(
        tenantId: string,
    ): Promise<AuditLog[]>;


}
