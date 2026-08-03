import { AuditLogRepository } from "../../domain/repositories/audit-log.repository";


export class GetAuditLogByIdQuery {


    constructor(

        private readonly auditLogRepository:
            AuditLogRepository,

    ) {}



    async execute(

        input: {
            id: string;
            tenantId: string;
        },

    ) {


        return this.auditLogRepository.findByIdForTenant(

            input.id,

            input.tenantId,

        );


    }


}
