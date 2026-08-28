import { PerformanceMetric } from "../../domain/entities/performance-metric.entity";
import { PerformanceMetricDto } from "../dto/performance-metric/performance-metric.dto";

export class PerformanceMetricMapper {
  static toDto(metric: PerformanceMetric): PerformanceMetricDto {
    return {
      id: metric.id,
      tenantId: metric.tenantId,
      athleteId: metric.athleteId,
      sportId: metric.sportId,
      name: metric.name,
      slug: metric.slug,
      description: metric.description ?? null,
      unit: metric.unit ?? null,
      dataType: metric.dataType,
      status: metric.status,
      createdAt: metric.createdAt.toISOString(),
      updatedAt: metric.updatedAt.toISOString(),
    };
  }
}
