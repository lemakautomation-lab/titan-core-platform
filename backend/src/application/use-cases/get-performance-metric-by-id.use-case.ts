import { PerformanceMetricRepository } from "../../domain/repositories/performance-metric.repository";
import { GetPerformanceMetricByIdQuery } from "../queries/performance-metric/get-performance-metric-by-id.query";
import { PerformanceMetricDto } from "../dto/performance-metric/performance-metric.dto";
import { PerformanceMetricMapper } from "../mappers/performance-metric.mapper";

export class GetPerformanceMetricByIdUseCase {

  constructor(
    private readonly repository: PerformanceMetricRepository
  ) {}

  async execute(
    query: GetPerformanceMetricByIdQuery,
  ): Promise<PerformanceMetricDto | null> {

    const metric =
      await this.repository.findById(
        query.id,
        query.tenantId,
      );

    if (!metric) {
      return null;
    }

    return PerformanceMetricMapper.toDto(metric);
  }
}
