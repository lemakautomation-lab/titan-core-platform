import {
    SecurityEvent,
} from "../../domain/entities/security-event.entity";

import {
    SecurityEventRepository,
} from "../../domain/repositories/security-event.repository";

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


}
