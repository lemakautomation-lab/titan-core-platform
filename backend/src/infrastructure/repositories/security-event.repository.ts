import {
    SecurityEvent,
} from "../../domain/entities/security-event.entity";

import {
    SecurityEventRepository,
    SecurityEventQuery,
} from "../../domain/repositories/security-event.repository";

import {
    SecurityEventType,
} from "../../domain/security/security-event-type";

import {
    DatabaseService,
} from "../database/database.service";

import {
    SecurityEventMapper,
} from "../mappers/security-event.mapper";


export class PrismaSecurityEventRepository
implements SecurityEventRepository {


    constructor(

        private readonly database: DatabaseService,

    ) {}



    async create(

        securityEvent: SecurityEvent,

    ): Promise<SecurityEvent> {


        const created =

            await this.database.prisma.securityEvent.create({

                data:
                    SecurityEventMapper.toPersistence(
                        securityEvent,
                    ),

            });


        return SecurityEventMapper.toDomain(

            created,

        );

    }



    async findMany(

        query: SecurityEventQuery,

    ): Promise<SecurityEvent[]> {


        const events =

            await this.database.prisma.securityEvent.findMany({

                where: {

                    tenantId:
                        query.tenantId,

                    userId:
                        query.userId,

                    eventType:
                        query.eventType,

                    createdAt: {

                        gte:
                            query.from,

                        lte:
                            query.to,

                    },

                },

                orderBy: {

                    createdAt: "desc",

                },

            });



        return events.map(

            event =>
                SecurityEventMapper.toDomain(
                    event,
                ),

        );

    }



    async findRecent(

        tenantId: string,

        from: Date,

    ): Promise<SecurityEvent[]> {


        return this.findMany({

            tenantId,

            from,

        });

    }



    async countByType(

        tenantId: string,

        eventType: SecurityEventType,

        from: Date,

    ): Promise<number> {


        return await this.database.prisma.securityEvent.count({

            where: {

                tenantId,

                eventType,

                createdAt: {

                    gte: from,

                },

            },

        });

    }



}
