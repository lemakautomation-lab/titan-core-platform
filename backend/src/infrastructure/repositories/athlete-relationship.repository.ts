import { AthleteRelationship } from "../../domain/entities/athlete-relationship.entity";
import { AthleteRelationshipRepository } from "../../domain/repositories/athlete-relationship.repository";
import { AthleteRelationshipType } from "../../domain/enums/athlete-relationship-type.enum";

import { PaginationInput } from "../../application/common/pagination";

import { DatabaseService } from "../database/database.service";
import { AthleteRelationshipMapper } from "../mappers/athlete-relationship.mapper";

export class PrismaAthleteRelationshipRepository
implements AthleteRelationshipRepository {

    constructor(
        private readonly database: DatabaseService,
    ) {}

    async findById(
        id: string,
        tenantId: string,
    ): Promise<AthleteRelationship | null> {

        const relationship =
            await this.database.prisma.athleteRelationship.findFirst({
                where: {
                    id,
                    tenantId,
                },
            });

        return relationship
            ? AthleteRelationshipMapper.toDomain(relationship)
            : null;
    }

    async findAllByAthleteId(
        athleteId: string,
        tenantId: string,
        pagination: PaginationInput,
    ): Promise<{
        items: AthleteRelationship[];
        total: number;
    }> {

        const where = {
            athleteId,
            tenantId,
        };

        const [relationships, total] =
            await this.database.prisma.$transaction([
                this.database.prisma.athleteRelationship.findMany({
                    where,
                    orderBy: [
                        {
                            createdAt: "asc",
                        },
                        {
                            id: "asc",
                        },
                    ],
                    skip:
                        (pagination.page - 1) *
                        pagination.pageSize,
                    take: pagination.pageSize,
                }),
                this.database.prisma.athleteRelationship.count({
                    where,
                }),
            ]);

        return {
            items: relationships.map(
                AthleteRelationshipMapper.toDomain,
            ),
            total,
        };
    }

    async findAllByType(
        athleteId: string,
        relationshipType: AthleteRelationshipType,
        tenantId: string,
        pagination: PaginationInput,
    ): Promise<{
        items: AthleteRelationship[];
        total: number;
    }> {

        const where = {
            athleteId,
            relationshipType,
            tenantId,
        };

        const [relationships, total] =
            await this.database.prisma.$transaction([
                this.database.prisma.athleteRelationship.findMany({
                    where,
                    orderBy: [
                        {
                            createdAt: "asc",
                        },
                        {
                            id: "asc",
                        },
                    ],
                    skip:
                        (pagination.page - 1) *
                        pagination.pageSize,
                    take: pagination.pageSize,
                }),
                this.database.prisma.athleteRelationship.count({
                    where,
                }),
            ]);

        return {
            items: relationships.map(
                AthleteRelationshipMapper.toDomain,
            ),
            total,
        };
    }

    async create(
        relationship: AthleteRelationship,
    ): Promise<AthleteRelationship> {

        const created =
            await this.database.prisma.athleteRelationship.create({
                data:
                    AthleteRelationshipMapper.toPersistence(
                        relationship,
                    ),
            });

        return AthleteRelationshipMapper.toDomain(
            created,
        );
    }

    async update(
        relationship: AthleteRelationship,
        tenantId: string,
    ): Promise<AthleteRelationship> {

        const updated =
            await this.database.prisma.athleteRelationship.updateMany({
                where: {
                    id: relationship.id,
                    tenantId,
                },
                data:
                    AthleteRelationshipMapper.toPersistence(
                        relationship,
                    ),
            });

        if (updated.count !== 1) {
            throw new Error(
                "Athlete relationship not found in tenant.",
            );
        }

        const persisted =
            await this.database.prisma.athleteRelationship.findFirst({
                where: {
                    id: relationship.id,
                    tenantId,
                },
            });

        if (!persisted) {
            throw new Error(
                "Athlete relationship not found in tenant.",
            );
        }

        return AthleteRelationshipMapper.toDomain(
            persisted,
        );
    }

    async delete(
        id: string,
        tenantId: string,
    ): Promise<void> {

        const deleted =
            await this.database.prisma.athleteRelationship.deleteMany({
                where: {
                    id,
                    tenantId,
                },
            });

        if (deleted.count !== 1) {
            throw new Error(
                "Athlete relationship not found in tenant.",
            );
        }
    }
}
