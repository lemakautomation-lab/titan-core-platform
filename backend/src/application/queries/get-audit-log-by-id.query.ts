import { AuditLogRepository } from "../../domain/repositories/audit-log.repository";


export interface GetAuditLogByIdQueryInput {

    id: string;

    tenantId: string;

}



export class GetAuditLogByIdQuery {


    constructor(

        private readonly auditLogRepository:
            AuditLogRepository,

    ) {}



    async execute(

        input: GetAuditLogByIdQueryInput,

    ) {


        return this.auditLogRepository.findByIdForTenant(

            input.id,

            input.tenantId,

        );


    }


}
