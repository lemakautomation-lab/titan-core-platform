import { apiRequest } from "../api/client";

export interface PerformanceMetricDto {
  id: string;
  tenantId: string;
  athleteId: string;
  sportId: string;
  name: string;
  slug: string;
  description: string | null;
  unit: string | null;
  dataType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface PerformanceMetricsListResponse {
  data: PerformanceMetricDto[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export async function listPerformanceMetrics(
  tenantId: string,
): Promise<PerformanceMetricDto[]> {
  const result =
    await apiRequest<PerformanceMetricsListResponse>(
      "/performance-metrics",
    );

  return result.data;
}
