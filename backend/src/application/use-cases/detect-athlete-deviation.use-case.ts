import type { AthleteRepository } from "../../domain/repositories/athlete.repository";
import type { PerformanceMetricRepository } from "../../domain/repositories/performance-metric.repository";
import type { PerformanceMeasurementRepository } from "../../domain/repositories/performance-measurement/performance-measurement.repository";
import type { AthleteBaselineVersionRepository } from "../../domain/repositories/athlete-baseline-version.repository";

/** Compares the latest post-baseline effective observation with the latest baseline version. */
export class DetectAthleteDeviationUseCase {
  constructor(
    private readonly athletes: AthleteRepository,
    private readonly metrics: PerformanceMetricRepository,
    private readonly measurements: PerformanceMeasurementRepository,
    private readonly baselines: AthleteBaselineVersionRepository,
  ) {}

  async execute(input: { tenantId: string; athleteId: string; metricId: string;
    relativeThreshold: number; absoluteThreshold: number }, asOf: Date = new Date()) {
    if (![input?.tenantId, input?.athleteId, input?.metricId].every(value => typeof value === "string" && value.trim()) ||
      !(asOf instanceof Date) || !Number.isFinite(asOf.getTime()) || asOf.getTime() > Date.now() ||
      !Number.isFinite(input.relativeThreshold) || input.relativeThreshold < 0 || input.relativeThreshold > 1 ||
      !Number.isFinite(input.absoluteThreshold) || input.absoluteThreshold < 0 ||
      input.absoluteThreshold > 1_000_000_000) {
      throw new Error("Invalid deviation request.");
    }
    if (!await this.athletes.findById(input.athleteId, input.tenantId)) throw new Error("Athlete not found.");
    const metric = await this.metrics.findById(input.metricId, input.tenantId);
    if (!metric || metric.athleteId !== input.athleteId) throw new Error("Performance metric not found for athlete.");
    const baseline = await this.baselines.findLatest(input.tenantId, input.athleteId, input.metricId);
    if (!baseline) return { status: "NO_BASELINE" as const, athleteId: input.athleteId, metricId: input.metricId };
    const scope = { athleteId: input.athleteId, metricId: input.metricId,
      baselineId: baseline.id, baselineVersion: baseline.version, baselineAsOf: baseline.asOf };
    if (baseline.status !== "READY" || baseline.value === null) {
      return { ...scope, status: "BASELINE_NOT_READY" as const };
    }
    const measurement = await this.measurements.findLatestEffectiveAfter(
      input.tenantId, input.athleteId, input.metricId, baseline.asOf, asOf,
    );
    if (!measurement) return { ...scope, status: "NO_NEW_MEASUREMENT" as const };
    const signedDeviation = measurement.value - baseline.value;
    const absoluteDeviation = Math.abs(signedDeviation);
    const effectiveThreshold = Math.max(Math.abs(baseline.value) * input.relativeThreshold,
      input.absoluteThreshold);
    if (![signedDeviation, absoluteDeviation, effectiveThreshold].every(Number.isFinite)) {
      throw new Error("Deviation calculation is not finite.");
    }
    return { ...scope, status: absoluteDeviation > effectiveThreshold ? "DEVIATION" as const : "NO_DEVIATION" as const,
      baselineValue: baseline.value, measurementId: measurement.id,
      measurementValue: measurement.value, measurementRecordedAt: measurement.recordedAt,
      signedDeviation, absoluteDeviation, effectiveThreshold,
      direction: signedDeviation > 0 ? "ABOVE" as const : signedDeviation < 0 ? "BELOW" as const : "EQUAL" as const,
      relativeThreshold: input.relativeThreshold, absoluteThreshold: input.absoluteThreshold };
  }
}
