import { AuditLog } from "../entities/audit-log.entity";


export interface AuditLogQuery {

    tenantId: string;

    action?: string;

    resource?: string;

    status?: string;

    userId?: string;

    resourceId?: string;

    from?: Date;

    to?: Date;

    page?: number;

    limit?: number;

}



export interface AuditLogRepository {


    create(
        auditLog: AuditLog,
    ): Promise<AuditLog>;



    findById(
        id: string,
    ): Promise<AuditLog | null>;



    findByIdForTenant(

        id: string,

        tenantId: string,

    ): Promise<AuditLog | null>;



    findAllByTenantId(
        tenantId: string,
    ): Promise<AuditLog[]>;



    findMany(
        query: AuditLogQuery,
    ): Promise<{

        items: AuditLog[];

        total: number;

    }>;


}
