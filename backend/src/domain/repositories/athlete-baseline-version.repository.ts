import type { BaselineDefinition } from "../entities/athlete-baseline/baseline-definition";
import type { BaselineCalculationResult } from "../services/athlete-baseline-calculator.service";

export interface AthleteBaselineVersionRepository {
  findLatest(tenantId: string, athleteId: string, metricId: string): Promise<{
    id: string; version: number; status: string; value: number | null; asOf: Date;
  } | null>;
  append(
    definition: BaselineDefinition,
    asOf: Date,
    result: BaselineCalculationResult,
  ): Promise<{ id: string; version: number }>;
}
