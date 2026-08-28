import { RecordStatus as PrismaRecordStatus } from "../../generated/prisma/enums";

import { PerformanceMetric } from "../../domain/entities/performance-metric.entity";
import { RecordStatus } from "../../domain/enums/record-status.enum";

export class PerformanceMetricInfrastructureMapper {

  static toDomain(
    row: {
      id: string;
      tenantId: string;
      athleteId: string;
      sportId: string;
      name: string;
      slug: string;
      description: string | null;
      unit: string | null;
      dataType: string;
      status: PrismaRecordStatus;
      createdAt: Date;
      updatedAt: Date;
    },
  ): PerformanceMetric {

    return PerformanceMetric.create({
      id: row.id,
      tenantId: row.tenantId,
      athleteId: row.athleteId,
      sportId: row.sportId,
      name: row.name,
      slug: row.slug,
      description: row.description,
      unit: row.unit,
      dataType: row.dataType,
      status: this.toDomainStatus(row.status),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  private static toDomainStatus(
    status: PrismaRecordStatus,
  ): RecordStatus {

    switch (status) {

      case PrismaRecordStatus.ACTIVE:
        return RecordStatus.ACTIVE;

      case PrismaRecordStatus.INACTIVE:
        return RecordStatus.INACTIVE;

      case PrismaRecordStatus.SUSPENDED:
        return RecordStatus.SUSPENDED;

      case PrismaRecordStatus.DELETED:
        return RecordStatus.DELETED;

      default:
        throw new Error(
          `Unknown performance metric Prisma record status: ${status}`,
        );
    }
  }
}
