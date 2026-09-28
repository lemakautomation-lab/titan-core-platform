import { defineAthleteBaseline } from "../../domain/entities/athlete-baseline/baseline-definition";
import type { BaselineDefinitionInput } from "../../domain/entities/athlete-baseline/baseline-definition";
import { AthleteBaselineCalculator } from "../../domain/services/athlete-baseline-calculator.service";
import type { AthleteRepository } from "../../domain/repositories/athlete.repository";
import type { PerformanceMetricRepository } from "../../domain/repositories/performance-metric.repository";
import type { PerformanceMeasurementRepository } from "../../domain/repositories/performance-measurement/performance-measurement.repository";
import type { AthleteBaselineVersionRepository } from "../../domain/repositories/athlete-baseline-version.repository";

export class CreateAthleteBaselineUseCase {
  constructor(
    private readonly athletes: AthleteRepository,
    private readonly metrics: PerformanceMetricRepository,
    private readonly measurements: PerformanceMeasurementRepository,
    private readonly versions: AthleteBaselineVersionRepository,
    private readonly calculator = new AthleteBaselineCalculator(),
  ) {}

  async execute(input: BaselineDefinitionInput, asOf: Date = new Date()) {
    const definition = defineAthleteBaseline(input);
    if (!(asOf instanceof Date) || !Number.isFinite(asOf.getTime()) ||
        asOf.getTime() > Date.now()) {
      throw new Error("Baseline asOf must be a valid date no later than now.");
    }
    const athlete = await this.athletes.findById(definition.athleteId, definition.tenantId);
    if (!athlete) throw new Error("Athlete not found.");
    const metric = await this.metrics.findById(definition.metricId, definition.tenantId);
    if (!metric || metric.athleteId !== definition.athleteId) {
      throw new Error("Performance metric not found for athlete.");
    }
    const history = await this.measurements.listEffectiveHistoryForBaseline(
      definition.tenantId, definition.athleteId, definition.metricId,
      asOf, definition.lookbackDays,
    );
    const result = this.calculator.calculate(definition, asOf, history);
    const persisted = await this.versions.append(definition, asOf, result);
    return { ...persisted, ...result, asOf, tenantId: definition.tenantId,
      athleteId: definition.athleteId, metricId: definition.metricId };
  }
}
