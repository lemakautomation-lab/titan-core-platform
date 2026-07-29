import { AuditLog } from "../../domain/entities/audit-log.entity";

import { AuditLogRepository } from "../../domain/repositories/audit-log.repository";

import { DatabaseService } from "../database/database.service";

import { AuditLogMapper } from "../mappers/audit-log.mapper";


export class PrismaAuditLogRepository
implements AuditLogRepository {


    constructor(

        private readonly database: DatabaseService,

    ) {}



    async create(

        auditLog: AuditLog,

    ): Promise<AuditLog> {


        const created =

            await this.database.prisma.auditLog.create({

                data:
                    AuditLogMapper.toPersistence(
                        auditLog,
                    ),

            });


        return AuditLogMapper.toDomain(
            created,
        );

    }



    async findById(

        id: string,

    ): Promise<AuditLog | null> {


        const auditLog =

            await this.database.prisma.auditLog.findUnique({

                where: {

                    id,

                },

            });


        return auditLog

            ? AuditLogMapper.toDomain(
                auditLog,
            )

            : null;

    }



    async findAllByTenantId(

        tenantId: string,

    ): Promise<AuditLog[]> {


        const auditLogs =

            await this.database.prisma.auditLog.findMany({

                where: {

                    tenantId,

                },

                orderBy: {

                    createdAt: "desc",

                },

            });



        return auditLogs.map(

            AuditLogMapper.toDomain,

        );

    }


}
