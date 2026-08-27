import { AthleteDigitalTwin } from "../../domain/entities/athlete-digital-twin.entity";
import { AthleteDigitalTwinRepository } from "../../domain/repositories/athlete-digital-twin.repository";

import { DatabaseService } from "../database/database.service";
import { AthleteDigitalTwinMapper } from "../mappers/athlete-digital-twin.mapper";

export class PrismaAthleteDigitalTwinRepository
implements AthleteDigitalTwinRepository {

    constructor(
        private readonly database: DatabaseService,
    ) {}

    async findById(
        id: string,
        tenantId: string,
    ): Promise<AthleteDigitalTwin | null> {

        const twin =
            await this.database.prisma.athleteDigitalTwin.findFirst({

                where: {
                    id,
                    tenantId,
                },

            });

        return twin
            ? AthleteDigitalTwinMapper.toDomain(twin)
            : null;

    }

    async findByAthleteId(
        athleteId: string,
        tenantId: string,
    ): Promise<AthleteDigitalTwin | null> {

        const twin =
            await this.database.prisma.athleteDigitalTwin.findFirst({

                where: {
                    athleteId,
                    tenantId,
                },

            });

        return twin
            ? AthleteDigitalTwinMapper.toDomain(twin)
            : null;

    }

    async create(
        twin: AthleteDigitalTwin,
    ): Promise<AthleteDigitalTwin> {

        const created =
            await this.database.prisma.athleteDigitalTwin.create({

                data:
                    AthleteDigitalTwinMapper.toPersistence(
                        twin,
                    ),

            });

        return AthleteDigitalTwinMapper.toDomain(
            created,
        );

    }

    async update(
        twin: AthleteDigitalTwin,
        tenantId: string,
    ): Promise<AthleteDigitalTwin> {

        const updated =
            await this.database.prisma.athleteDigitalTwin.updateMany({

                where: {
                    id: twin.id,
                    tenantId,
                },

                data:
                    AthleteDigitalTwinMapper.toPersistence(
                        twin,
                    ),

            });

        if (updated.count !== 1) {

            throw new Error(
                "Athlete digital twin not found in tenant.",
            );

        }

        const persisted =
            await this.database.prisma.athleteDigitalTwin.findFirst({

                where: {
                    id: twin.id,
                    tenantId,
                },

            });

        if (!persisted) {

            throw new Error(
                "Athlete digital twin not found in tenant.",
            );

        }

        return AthleteDigitalTwinMapper.toDomain(
            persisted,
        );

    }

    async delete(
        id: string,
        tenantId: string,
    ): Promise<void> {

        const deleted =
            await this.database.prisma.athleteDigitalTwin.deleteMany({

                where: {
                    id,
                    tenantId,
                },

            });

        if (deleted.count !== 1) {

            throw new Error(
                "Athlete digital twin not found in tenant.",
            );

        }

    }

}
