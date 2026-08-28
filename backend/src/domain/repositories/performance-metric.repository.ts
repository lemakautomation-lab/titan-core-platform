import { PerformanceMetric } from "../entities/performance-metric.entity";

export interface PerformanceMetricListResult {
  items: PerformanceMetric[];
  total: number;
}

export interface PerformanceMetricRepository {
  findById(
    id: string,
    tenantId: string
  ): Promise<PerformanceMetric | null>;

  findAll(
    tenantId: string,
    pagination: {
      page: number;
      pageSize: number;
    }
  ): Promise<PerformanceMetricListResult>;

  findAllByAthleteId(
    athleteId: string,
    tenantId: string
  ): Promise<PerformanceMetric[]>;

  create(metric: PerformanceMetric): Promise<PerformanceMetric>;

  update(metric: PerformanceMetric): Promise<PerformanceMetric>;

  delete(id: string, tenantId: string): Promise<void>;
}
