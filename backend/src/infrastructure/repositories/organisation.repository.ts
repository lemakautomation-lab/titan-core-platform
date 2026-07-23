import { Organisation } from "../../domain/entities/organisation.entity";
import { OrganisationRepository } from "../../domain/repositories/organisation.repository";

import { DatabaseService } from "../database/database.service";
import { OrganisationMapper } from "../mappers/organisation.mapper";

export class PrismaOrganisationRepository implements OrganisationRepository {

    constructor(
        private readonly database: DatabaseService,
    ) {}

    async findById(id: string): Promise<Organisation | null> {

        const organisation = await this.database.prisma.organisation.findUnique({
            where: { id },
        });

        return organisation
            ? OrganisationMapper.toDomain(organisation)
            : null;

    }

    async findAll(): Promise<Organisation[]> {

        const organisations = await this.database.prisma.organisation.findMany({
            where: {
                status: "ACTIVE",
            },
            orderBy: {
                createdAt: "asc",
            },
        });

        return organisations.map(OrganisationMapper.toDomain);

    }

    async create(organisation: Organisation): Promise<Organisation> {

        const created = await this.database.prisma.organisation.create({
            data: OrganisationMapper.toPersistence(organisation),
        });

        return OrganisationMapper.toDomain(created);

    }

    async update(organisation: Organisation): Promise<Organisation> {

        const updated = await this.database.prisma.organisation.update({
            where: {
                id: organisation.id,
            },
            data: OrganisationMapper.toPersistence(organisation),
        });

        return OrganisationMapper.toDomain(updated);

    }

    async delete(id: string): Promise<void> {

        await this.database.prisma.organisation.update({
            where: {
                id,
            },
            data: {
                status: "DELETED",
            },
        });

    }

}