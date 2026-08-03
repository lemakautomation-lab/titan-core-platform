import { DatabaseService } from "../database/database.service";

import { PrismaAuditLogRepository } from "../repositories/audit-log.repository";

import { AuditLogService } from "../../application/services/audit-log.service";

import { GetAuditLogsQuery } from "../../application/queries/get-audit-logs.query";



const database =
    new DatabaseService();



const auditLogRepository =
    new PrismaAuditLogRepository(
        database,
    );



export const auditLogModule = {


    auditLogService:

        new AuditLogService(

            auditLogRepository,

        ),



    getAuditLogsQuery:

        new GetAuditLogsQuery(

            auditLogRepository,

        ),


};
