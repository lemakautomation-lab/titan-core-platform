export interface CreatePerformanceMetricCommand {
  tenantId: string;
  athleteId: string;
  sportId: string;
  name: string;
  slug: string;
  description?: string;
  unit?: string;
  dataType: string;
}
