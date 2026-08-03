import {
    AuditLogRepository,
    AuditLogQuery,
} from "../../domain/repositories/audit-log.repository";


export class GetAuditLogsQuery {


    constructor(

        private readonly auditLogRepository:
            AuditLogRepository,

    ) {}



    async execute(

        query: AuditLogQuery,

    ) {


        return this.auditLogRepository.findMany(

            query,

        );


    }


}
