import type { PerformanceMeasurement } from "../entities/performance-measurement/performance-measurement.entity";

export type ImprovementDirection = "HIGHER_IS_BETTER" | "LOWER_IS_BETTER";
export type ImprovementResult =
  | { status: "INSUFFICIENT_DATA"; previousCount: number; currentCount: number; requiredSamplesPerWindow: number }
  | { status: "IMPROVEMENT" | "NO_IMPROVEMENT"; previousCount: number; currentCount: number;
      previousMean: number; currentMean: number; signedChange: number };

/** Two adjacent UTC windows: (asOf - 2 * windowDays, asOf - windowDays] and
 * (asOf - windowDays, asOf]. The repository supplies effective observations. */
export class AthleteImprovementDetector {
  detect(input: {
    tenantId: string; athleteId: string; metricId: string; asOf: Date;
    windowDays: number; minimumSamplesPerWindow: number;
    direction: ImprovementDirection;
    measurements: readonly PerformanceMeasurement[];
  }): ImprovementResult {
    if (!input || ![input.tenantId, input.athleteId, input.metricId]
      .every(value => typeof value === "string" && value.trim())) throw new Error("Trend scope is required.");
    if (!(input.asOf instanceof Date) || !Number.isFinite(input.asOf.getTime()) ||
      !Number.isSafeInteger(input.windowDays) || input.windowDays < 1 || input.windowDays > 1825 ||
      !Number.isSafeInteger(input.minimumSamplesPerWindow) ||
      input.minimumSamplesPerWindow < 2 || input.minimumSamplesPerWindow > 5000 ||
      !["HIGHER_IS_BETTER", "LOWER_IS_BETTER"].includes(input.direction) ||
      !Array.isArray(input.measurements) || input.measurements.length > 10000) {
      throw new Error("Invalid improvement policy or measurements.");
    }
    const end = input.asOf.getTime();
    const boundary = end - input.windowDays * 86_400_000;
    const start = boundary - input.windowDays * 86_400_000;
    const previous: number[] = [];
    const current: number[] = [];
    for (const row of input.measurements) {
      const time = row.recordedAt?.getTime();
      if (row.tenantId !== input.tenantId || row.athleteId !== input.athleteId ||
        row.metricId !== input.metricId || !Number.isFinite(row.value) ||
        !Number.isFinite(time) || time! <= start || time! > end) {
        throw new Error("Trend measurement is outside the defined scope or window.");
      }
      (time! <= boundary ? previous : current).push(row.value);
    }
    if (previous.length < input.minimumSamplesPerWindow || current.length < input.minimumSamplesPerWindow) {
      return { status: "INSUFFICIENT_DATA", previousCount: previous.length,
        currentCount: current.length, requiredSamplesPerWindow: input.minimumSamplesPerWindow };
    }
    const mean = (values: number[]) => {
      // A running mean avoids overflowing a sum of otherwise finite values.
      let result = 0;
      values.forEach((value, index) => { result += (value - result) / (index + 1); });
      if (!Number.isFinite(result)) throw new Error("Trend mean is not finite.");
      return result;
    };
    const previousMean = mean(previous);
    const currentMean = mean(current);
    const signedChange = input.direction === "HIGHER_IS_BETTER"
      ? currentMean - previousMean : previousMean - currentMean;
    if (!Number.isFinite(signedChange)) throw new Error("Trend change is not finite.");
    return { status: signedChange > 0 ? "IMPROVEMENT" : "NO_IMPROVEMENT",
      previousCount: previous.length, currentCount: current.length,
      previousMean, currentMean, signedChange };
  }
}
