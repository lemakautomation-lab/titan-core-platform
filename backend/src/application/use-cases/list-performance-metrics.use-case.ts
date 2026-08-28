import { PerformanceMetricRepository } from "../../domain/repositories/performance-metric.repository";
import { ListPerformanceMetricsQuery } from "../queries/performance-metric/list-performance-metrics.query";

export class ListPerformanceMetricsUseCase {
  constructor(
    private readonly repository: PerformanceMetricRepository
  ) {}

  async execute(query: ListPerformanceMetricsQuery) {
    return this.repository.findAll(query.tenantId);
  }
}
