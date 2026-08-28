import { Sport } from "../../domain/entities/sport.entity";
import { SportRepository } from "../../domain/repositories/sport.repository";

import { PaginationInput } from "../../application/common/pagination";

import { DatabaseService } from "../database/database.service";
import { SportMapper } from "../mappers/sport.mapper";

export class PrismaSportRepository
implements SportRepository {

    constructor(
        private readonly database: DatabaseService,
    ) {}

    async findById(
        id: string,
        tenantId: string,
    ): Promise<Sport | null> {

        const sport =
            await this.database.prisma.sport.findFirst({
                where: {
                    id,
                    tenantId,
                    status: "ACTIVE",
                },
            });

        return sport
            ? SportMapper.toDomain(sport)
            : null;
    }

    async findBySlug(
        slug: string,
        tenantId: string,
    ): Promise<Sport | null> {

        const sport =
            await this.database.prisma.sport.findFirst({
                where: {
                    slug,
                    tenantId,
                },
            });

        return sport
            ? SportMapper.toDomain(sport)
            : null;
    }

    async findAll(
        tenantId: string,
        pagination: PaginationInput,
    ): Promise<{
        items: Sport[];
        total: number;
    }> {

        const where = {
            tenantId,
            status: "ACTIVE" as const,
        };

        const [sports, total] =
            await this.database.prisma.$transaction([
                this.database.prisma.sport.findMany({
                    where,
                    orderBy: [
                        {
                            name: "asc",
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
                this.database.prisma.sport.count({
                    where,
                }),
            ]);

        return {
            items: sports.map(
                SportMapper.toDomain,
            ),
            total,
        };
    }

    async create(
        sport: Sport,
    ): Promise<Sport> {

        const created =
            await this.database.prisma.sport.create({
                data:
                    SportMapper.toPersistence(
                        sport,
                    ),
            });

        return SportMapper.toDomain(
            created,
        );
    }

    async update(
        sport: Sport,
        tenantId: string,
    ): Promise<Sport> {

        const updated =
            await this.database.prisma.sport.updateMany({
                where: {
                    id: sport.id,
                    tenantId,
                },
                data:
                    SportMapper.toPersistence(
                        sport,
                    ),
            });

        if (updated.count !== 1) {
            throw new Error(
                "Sport update failed.",
            );
        }

        const result =
            await this.database.prisma.sport.findFirst({
                where: {
                    id: sport.id,
                    tenantId,
                },
            });

        if (!result) {
            throw new Error(
                "Sport not found after update.",
            );
        }

        return SportMapper.toDomain(
            result,
        );
    }

    async delete(
        id: string,
        tenantId: string,
    ): Promise<void> {

        await this.database.prisma.sport.updateMany({
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
