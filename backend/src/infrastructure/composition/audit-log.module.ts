import { DatabaseService } from "../database/database.service";

import { PrismaAuditLogRepository } from "../repositories/audit-log.repository";

import { PrismaSecurityEventRepository } from "../repositories/security-event.repository";

import { AuditLogService } from "../../application/services/audit-log.service";

import { SecurityEventService } from "../../application/services/security-event.service";

import { SecurityAnalyticsService } from "../../application/services/security-analytics.service";

import { GetAuditLogsQuery } from "../../application/queries/get-audit-logs.query";

import { GetAuditLogByIdQuery } from "../../application/queries/get-audit-log-by-id.query";


const database =
    new DatabaseService();


const auditLogRepository =
    new PrismaAuditLogRepository(
        database,
    );


const securityEventRepository =
    new PrismaSecurityEventRepository(
        database,
    );


const auditLogService =
    new AuditLogService(
        auditLogRepository,
    );


const securityEventService =
    new SecurityEventService(
        securityEventRepository,
    );


const securityAnalyticsService =
    new SecurityAnalyticsService(
        securityEventRepository,
    );


export const auditLogModule = {

    auditLogService,

    securityEventService,

    securityAnalyticsService,

    getAuditLogsQuery:

        new GetAuditLogsQuery(
            auditLogRepository,
        ),


    getAuditLogByIdQuery:

        new GetAuditLogByIdQuery(
            auditLogRepository,
        ),

};
