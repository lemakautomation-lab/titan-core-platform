import { AuditLogRepository } from "../../domain/repositories/audit-log.repository";


export class GetAuditLogByIdQuery {


    constructor(

        private readonly auditLogRepository:
            AuditLogRepository,

    ) {}



    async execute(

        id: string,

    ) {


        return this.auditLogRepository.findById(

            id,

        );


    }


}
