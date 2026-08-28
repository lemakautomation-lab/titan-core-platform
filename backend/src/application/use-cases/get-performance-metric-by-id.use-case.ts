import { PerformanceMetricRepository } from "../../domain/repositories/performance-metric.repository";
import { GetPerformanceMetricByIdQuery } from "../queries/performance-metric/get-performance-metric-by-id.query";

export class GetPerformanceMetricByIdUseCase {
  constructor(
    private readonly repository: PerformanceMetricRepository
  ) {}

  async execute(query: GetPerformanceMetricByIdQuery) {
    return this.repository.findById(query.id, query.tenantId);
  }
}
