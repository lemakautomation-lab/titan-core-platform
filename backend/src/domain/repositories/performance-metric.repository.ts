import { PerformanceMetric } from "../entities/performance-metric.entity";

export interface PerformanceMetricRepository {
  findById(
    id: string,
    tenantId: string
  ): Promise<PerformanceMetric | null>;

  findAll(
    tenantId: string
  ): Promise<PerformanceMetric[]>;

  findAllByAthleteId(
    athleteId: string,
    tenantId: string
  ): Promise<PerformanceMetric[]>;

  create(
    metric: PerformanceMetric
  ): Promise<PerformanceMetric>;

  update(
    metric: PerformanceMetric
  ): Promise<PerformanceMetric>;

  delete(
    id: string,
    tenantId: string
  ): Promise<void>;
}
