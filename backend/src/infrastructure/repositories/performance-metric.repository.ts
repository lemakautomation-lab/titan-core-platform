import { PerformanceMetric } from "../../domain/entities/performance-metric.entity";
import { PerformanceMetricRepository } from "../../domain/repositories/performance-metric.repository";
import { RecordStatus } from "../../domain/enums/record-status.enum";

import { PaginationInput } from "../../application/common/pagination";

import { DatabaseService } from "../database/database.service";
import { PerformanceMetricInfrastructureMapper } from "../mappers/performance-metric.mapper";

export class PrismaPerformanceMetricRepository
implements PerformanceMetricRepository {

    constructor(
        private readonly database: DatabaseService,
    ) {}

    async findById(
        id: string,
        tenantId: string,
    ): Promise<PerformanceMetric | null> {

        const row =
            await this.database.prisma.performanceMetric.findFirst({
                where: {
                    id,
                    tenantId,
                    status: "ACTIVE",
                },
            });

        return row
            ? PerformanceMetricInfrastructureMapper.toDomain(row)
            : null;
    }

    async findAll(
        tenantId: string,
        pagination: PaginationInput,
    ): Promise<{
        items: PerformanceMetric[];
        total: number;
    }> {

        const where = {
            tenantId,
            status: "ACTIVE" as const,
        };

        const [rows, total] =
            await this.database.prisma.$transaction([
                this.database.prisma.performanceMetric.findMany({
                    where,
                    orderBy: {
                        createdAt: "desc",
                    },
                    skip:
                        (pagination.page - 1) *
                        pagination.pageSize,
                    take: pagination.pageSize,
                }),
                this.database.prisma.performanceMetric.count({
                    where,
                }),
            ]);

        return {
            items: rows.map(
                PerformanceMetricInfrastructureMapper.toDomain,
            ),
            total,
        };
    }

    async findAllByAthleteId(
        athleteId: string,
        tenantId: string,
    ): Promise<PerformanceMetric[]> {

        const rows =
            await this.database.prisma.performanceMetric.findMany({
                where: {
                    athleteId,
                    tenantId,
                    status: "ACTIVE",
                },
                orderBy: {
                    createdAt: "desc",
                },
            });

        return rows.map(
            PerformanceMetricInfrastructureMapper.toDomain,
        );
    }

    async create(
        metric: PerformanceMetric,
    ): Promise<PerformanceMetric> {

        const created =
            await this.database.prisma.performanceMetric.create({
                data: {
                    id: metric.id,
                    tenantId: metric.tenantId,
                    athleteId: metric.athleteId,
                    sportId: metric.sportId,
                    name: metric.name,
                    slug: metric.slug,
                    description: metric.description,
                    unit: metric.unit,
                    dataType: metric.dataType,
                    status: metric.status,
                    createdAt: metric.createdAt,
                    updatedAt: metric.updatedAt,
                },
            });

        return PerformanceMetricInfrastructureMapper.toDomain(
            created,
        );
    }

    async update(
        metric: PerformanceMetric,
    ): Promise<PerformanceMetric> {

        const updated =
            await this.database.prisma.performanceMetric.updateMany({
                where: {
                    id: metric.id,
                    tenantId: metric.tenantId,
                },
                data: {
                    name: metric.name,
                    slug: metric.slug,
                    description: metric.description,
                    unit: metric.unit,
                    dataType: metric.dataType,
                    status: metric.status,
                },
            });

        if (updated.count !== 1) {
            throw new Error(
                "Performance metric not found",
            );
        }

        const result =
            await this.database.prisma.performanceMetric.findFirst({
                where: {
                    id: metric.id,
                    tenantId: metric.tenantId,
                },
            });

        if (!result) {
            throw new Error(
                "Performance metric not found",
            );
        }

        return PerformanceMetricInfrastructureMapper.toDomain(
            result,
        );
    }

    async delete(
        id: string,
        tenantId: string,
    ): Promise<void> {

        await this.database.prisma.performanceMetric.updateMany({
            where: {
                id,
                tenantId,
            },
            data: {
                status: RecordStatus.DELETED,
            },
        });
    }
}
