import { DetectAthleteImprovementUseCase } from "./detect-athlete-improvement.use-case";

/** Detects a material difference between two adjacent effective-history windows. */
export class DetectAthleteChangeUseCase {
  constructor(private readonly comparison: DetectAthleteImprovementUseCase) {}

  async execute(input: { tenantId: string; athleteId: string; metricId: string;
    windowDays: number; minimumSamplesPerWindow: number;
    relativeThreshold: number; absoluteThreshold: number }, asOf: Date = new Date()) {
    if (!Number.isFinite(input.relativeThreshold) || input.relativeThreshold < 0 || input.relativeThreshold > 1 ||
      !Number.isFinite(input.absoluteThreshold) || input.absoluteThreshold < 0 ||
      input.absoluteThreshold > 1_000_000_000) {
      throw new Error("Invalid change threshold.");
    }
    const result = await this.comparison.execute({
      tenantId: input.tenantId, athleteId: input.athleteId, metricId: input.metricId,
      direction: "HIGHER_IS_BETTER", windowDays: input.windowDays,
      minimumSamplesPerWindow: input.minimumSamplesPerWindow,
    }, asOf);
    const { direction: _direction, ...publicResult } = result;
    void _direction;
    if (result.status === "INSUFFICIENT_DATA") return publicResult;
    const effectiveThreshold = Math.max(Math.abs(result.previousMean) * input.relativeThreshold,
      input.absoluteThreshold);
    const absoluteChange = Math.abs(result.currentMean - result.previousMean);
    return { ...publicResult, status: absoluteChange > effectiveThreshold ? "CHANGE" as const : "NO_CHANGE" as const,
      absoluteChange, changeDirection: result.currentMean > result.previousMean ? "INCREASE" as const :
        result.currentMean < result.previousMean ? "DECREASE" as const : "UNCHANGED" as const,
      relativeThreshold: input.relativeThreshold, absoluteThreshold: input.absoluteThreshold,
      effectiveThreshold };
  }
}
