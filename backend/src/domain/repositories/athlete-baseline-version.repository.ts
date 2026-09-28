import type { BaselineDefinition } from "../entities/athlete-baseline/baseline-definition";
import type { BaselineCalculationResult } from "../services/athlete-baseline-calculator.service";

export interface AthleteBaselineVersionRepository {
  append(
    definition: BaselineDefinition,
    asOf: Date,
    result: BaselineCalculationResult,
  ): Promise<{ id: string; version: number }>;
}
