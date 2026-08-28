export interface CreatePerformanceMetricDto {
  tenantId: string;
  athleteId: string;
  sportId: string;
  name: string;
  slug: string;
  description?: string;
  unit?: string;
  dataType: string;
}

export interface UpdatePerformanceMetricDto {
  name?: string;
  slug?: string;
  description?: string | null;
  unit?: string | null;
  dataType?: string;
}

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
