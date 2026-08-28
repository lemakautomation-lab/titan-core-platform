export interface UpdatePerformanceMetricCommand {
  id: string;
  tenantId: string;
  name?: string;
  slug?: string;
  description?: string | null;
  unit?: string | null;
  dataType?: string;
}
