import { Athlete } from "../../domain/entities/athlete.entity";
import { AthleteRepository } from "../../domain/repositories/athlete.repository";

import { DatabaseService } from "../database/database.service";
import { AthleteMapper } from "../mappers/athlete.mapper";

export class PrismaAthleteRepository
implements AthleteRepository {

    constructor(
        private readonly database: DatabaseService,
    ) {}

    async findById(
        id: string,
        tenantId: string,
    ): Promise<Athlete | null> {

        const athlete =
            await this.database.prisma.athlete.findFirst({

                where: {
                    id,
                    tenantId,
                },

            });

        return athlete
            ? AthleteMapper.toDomain(athlete)
            : null;

    }

    async findAll(
        tenantId: string,
    ): Promise<Athlete[]> {

        const athletes =
            await this.database.prisma.athlete.findMany({

                where: {
                    tenantId,
                },

                orderBy: {
                    lastName: "asc",
                },

            });

        return athletes.map(
            AthleteMapper.toDomain,
        );

    }

    async findAllByOrganisationId(
        organisationId: string,
        tenantId: string,
    ): Promise<Athlete[]> {

        const athletes =
            await this.database.prisma.athlete.findMany({

                where: {
                    organisationId,
                    tenantId,
                },

                orderBy: {
                    lastName: "asc",
                },

            });

        return athletes.map(
            AthleteMapper.toDomain,
        );

    }

    async findByUserId(
        userId: string,
        tenantId: string,
    ): Promise<Athlete | null> {

        const athlete =
            await this.database.prisma.athlete.findFirst({

                where: {
                    userId,
                    tenantId,
                },

            });

        return athlete
            ? AthleteMapper.toDomain(athlete)
            : null;

    }

    async create(
        athlete: Athlete,
    ): Promise<Athlete> {

        const created =
            await this.database.prisma.athlete.create({

                data:
                    AthleteMapper.toPersistence(
                        athlete,
                    ),

            });

        return AthleteMapper.toDomain(
            created,
        );

    }

    async update(
        athlete: Athlete,
        tenantId: string,
    ): Promise<Athlete> {

        const updated =
            await this.database.prisma.athlete.updateMany({

                where: {
                    id: athlete.id,
                    tenantId,
                },

                data:
                    AthleteMapper.toPersistence(
                        athlete,
                    ),

            });

        if (updated.count !== 1) {

            throw new Error(
                "Athlete not found in tenant.",
            );

        }

        const persisted =
            await this.database.prisma.athlete.findFirst({

                where: {
                    id: athlete.id,
                    tenantId,
                },

            });

        if (!persisted) {

            throw new Error(
                "Athlete not found in tenant.",
            );

        }

        return AthleteMapper.toDomain(
            persisted,
        );

    }

    async delete(
        id: string,
        tenantId: string,
    ): Promise<void> {

        const deleted =
            await this.database.prisma.athlete.deleteMany({

                where: {
                    id,
                    tenantId,
                },

            });

        if (deleted.count !== 1) {

            throw new Error(
                "Athlete not found in tenant.",
            );

        }

    }

}
