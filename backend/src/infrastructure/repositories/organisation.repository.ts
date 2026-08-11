import { Organisation } from "../../domain/entities/organisation.entity";
import { OrganisationRepository } from "../../domain/repositories/organisation.repository";

import { DatabaseService } from "../database/database.service";
import { OrganisationMapper } from "../mappers/organisation.mapper";

export class PrismaOrganisationRepository
implements OrganisationRepository {

    constructor(
        private readonly database: DatabaseService,
    ) {}

    async findById(
        id: string,
        tenantId: string,
    ): Promise<Organisation | null> {

        const organisation =
            await this.database.prisma.organisation.findFirst({
                where: {
                    id,
                    tenantId,
                },
            });

        return organisation
            ? OrganisationMapper.toDomain(organisation)
            : null;
    }

    async findAll(
        tenantId: string,
    ): Promise<Organisation[]> {

        const organisations =
            await this.database.prisma.organisation.findMany({
                where: {
                    tenantId,
                    status: "ACTIVE",
                },
                orderBy: {
                    createdAt: "asc",
                },
            });

        return organisations.map(
            OrganisationMapper.toDomain,
        );
    }

    async create(
        organisation: Organisation,
    ): Promise<Organisation> {

        const created =
            await this.database.prisma.organisation.create({
                data:
                    OrganisationMapper.toPersistence(
                        organisation,
                    ),
            });

        return OrganisationMapper.toDomain(
            created,
        );
    }

    async update(
        organisation: Organisation,
        tenantId: string,
    ): Promise<Organisation> {

        const updated =
            await this.database.prisma.organisation.updateMany({
                where: {
                    id: organisation.id,
                    tenantId,
                },
                data:
                    OrganisationMapper.toPersistence(
                        organisation,
                    ),
            });

        if (updated.count !== 1) {
            throw new Error(
                "Organisation update failed.",
            );
        }

        const result =
            await this.database.prisma.organisation.findFirst({
                where: {
                    id: organisation.id,
                    tenantId,
                },
            });

        if (!result) {
            throw new Error(
                "Organisation not found after update.",
            );
        }

        return OrganisationMapper.toDomain(
            result,
        );
    }

    async delete(
        id: string,
        tenantId: string,
    ): Promise<void> {

        await this.database.prisma.organisation.updateMany({
            where: {
                id,
                tenantId,
            },
            data: {
                status: "DELETED",
            },
        });
    }

}
