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
    SecurityEventType as PrismaSecurityEventType,
} from "../../generated/prisma/enums";

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

        const where: {
            tenantId?: string | null;
            userId?: string | null;
            eventType?: PrismaSecurityEventType;
            requestId?: string | null;
            createdAt?: {
                gte?: Date;
                lte?: Date;
            };
        } = {};


        if (query.tenantId !== undefined) {

            where.tenantId =
                query.tenantId;

        }


        if (query.userId !== undefined) {

            where.userId =
                query.userId;

        }


        if (query.eventType !== undefined) {

            where.eventType =
                query.eventType as PrismaSecurityEventType;

        }


        if (query.requestId !== undefined) {

            where.requestId =
                query.requestId;

        }


        if (
            query.from !== undefined ||
            query.to !== undefined
        ) {

            where.createdAt = {};

            if (query.from !== undefined) {

                where.createdAt.gte =
                    query.from;

            }

            if (query.to !== undefined) {

                where.createdAt.lte =
                    query.to;

            }

        }


        const events =
            await this.database.prisma.securityEvent.findMany({

                where,

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

                eventType:
                    eventType as PrismaSecurityEventType,

                createdAt: {

                    gte:
                        from,

                },

            },

        });
    }
}
