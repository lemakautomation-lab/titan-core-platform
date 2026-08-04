import { AuditLog } from "../../domain/entities/audit-log.entity";

import {
    AuditLogRepository,
    AuditLogQuery,
} from "../../domain/repositories/audit-log.repository";

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



    async findByIdForTenant(

        id: string,

        tenantId: string,

    ): Promise<AuditLog | null> {


        const auditLog =

            await this.database.prisma.auditLog.findFirst({

                where: {

                    id,

                    tenantId,

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

                orderBy: [

                    {
                        createdAt: "desc",
                    },

                    {
                        id: "desc",
                    },

                ],

            });


        return auditLogs.map(

            AuditLogMapper.toDomain,

        );

    }



    async findMany(

        query: AuditLogQuery,

    ): Promise<{

        items: AuditLog[];

        total: number;

        page: number;

        limit: number;

    }> {


        const where: any = {

            tenantId:
                query.tenantId,

        };


        if (query.action) {

            where.action = query.action;

        }


        if (query.resource) {

            where.resource = query.resource;

        }


        if (query.status) {

            where.status = query.status;

        }


        if (query.userId) {

            where.userId = query.userId;

        }


        if (query.resourceId) {

            where.resourceId = query.resourceId;

        }



        if (query.from || query.to) {

            where.createdAt = {};


            if (query.from) {

                where.createdAt.gte = query.from;

            }


            if (query.to) {

                where.createdAt.lte = query.to;

            }

        }



        const page =

            query.page && query.page > 0

                ? Math.floor(query.page)

                : 1;



        const requestedLimit =

            query.limit && query.limit > 0

                ? Math.floor(query.limit)

                : 50;


        const limit =

            Math.min(

                requestedLimit,

                100,

            );



        const skip =

            (page - 1) * limit;



        const [items, total] =

            await Promise.all([

                this.database.prisma.auditLog.findMany({

                    where,

                    orderBy: [

                        {
                            createdAt: "desc",
                        },

                        {
                            id: "desc",
                        },

                    ],

                    skip,

                    take: limit,

                }),


                this.database.prisma.auditLog.count({

                    where,

                }),

            ]);



        return {

            items:

                items.map(

                    AuditLogMapper.toDomain,

                ),


            total,

            page,

            limit,

        };


    }


}
