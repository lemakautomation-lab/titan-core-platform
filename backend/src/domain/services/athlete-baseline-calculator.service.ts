import type { BaselineDefinition } from "../entities/athlete-baseline/baseline-definition";
import type { PerformanceMeasurement } from "../entities/performance-measurement/performance-measurement.entity";

export type BaselineCalculationResult =
  | { status: "INSUFFICIENT_DATA"; sampleCount: number; requiredSamples: number }
  | { status: "READY"; value: number; sampleCount: number; earliestRecordedAt: Date; latestRecordedAt: Date };

/**
 * Calculates from already selected effective measurements. Selection and
 * ownership checks remain mandatory at the application/repository boundary.
 */
export class AthleteBaselineCalculator {
  calculate(
    definition: BaselineDefinition,
    asOf: Date,
    measurements: readonly PerformanceMeasurement[],
  ): BaselineCalculationResult {
    if (!(asOf instanceof Date) || !Number.isFinite(asOf.getTime())) {
      throw new Error("Baseline asOf must be a valid date.");
    }
    if (!Array.isArray(measurements) || measurements.length > 10000) {
      throw new Error("Baseline measurements are invalid or exceed the limit.");
    }
    const startMs = asOf.getTime() - definition.lookbackDays * 86_400_000;
    if (!Number.isFinite(startMs) || definition.method !== "ARITHMETIC_MEAN") {
      throw new Error("Baseline definition is invalid.");
    }
    let sum = 0;
    let compensation = 0;
    let earliest = Number.POSITIVE_INFINITY;
    let latest = Number.NEGATIVE_INFINITY;
    for (const measurement of measurements) {
      const time = measurement.recordedAt?.getTime();
      if (
        measurement.tenantId !== definition.tenantId ||
        measurement.athleteId !== definition.athleteId ||
        measurement.metricId !== definition.metricId ||
        !Number.isFinite(measurement.value) ||
        !Number.isFinite(time) ||
        time! <= startMs ||
        time! > asOf.getTime()
      ) {
        throw new Error("Baseline measurement is outside the defined scope or window.");
      }
      // Neumaier compensated summation reduces cancellation error.
      const next = sum + measurement.value;
      compensation += Math.abs(sum) >= Math.abs(measurement.value)
        ? (sum - next) + measurement.value
        : (measurement.value - next) + sum;
      sum = next;
      earliest = Math.min(earliest, time!);
      latest = Math.max(latest, time!);
    }
    if (measurements.length < definition.minimumSamples) {
      return {
        status: "INSUFFICIENT_DATA",
        sampleCount: measurements.length,
        requiredSamples: definition.minimumSamples,
      };
    }
    const value = (sum + compensation) / measurements.length;
    if (!Number.isFinite(value)) {
      throw new Error("Baseline arithmetic result is not finite.");
    }
    return {
      status: "READY",
      value,
      sampleCount: measurements.length,
      earliestRecordedAt: new Date(earliest),
      latestRecordedAt: new Date(latest),
    };
  }
}
