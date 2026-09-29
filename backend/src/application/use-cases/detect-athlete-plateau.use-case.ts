import { DetectAthleteImprovementUseCase } from "./detect-athlete-improvement.use-case";

/** A plateau is a bounded change between the same two effective-history windows. */
export class DetectAthletePlateauUseCase {
  constructor(private readonly comparison: DetectAthleteImprovementUseCase) {}

  async execute(input: { tenantId: string; athleteId: string; metricId: string;
    windowDays: number; minimumSamplesPerWindow: number;
    relativeTolerance: number; absoluteTolerance: number }, asOf: Date = new Date()) {
    if (!Number.isFinite(input.relativeTolerance) || input.relativeTolerance < 0 || input.relativeTolerance > 1 ||
      !Number.isFinite(input.absoluteTolerance) || input.absoluteTolerance < 0 || input.absoluteTolerance > 1_000_000_000) {
      throw new Error("Invalid plateau tolerance.");
    }
    // Direction has no effect on absolute change; use a fixed internal orientation.
    const result = await this.comparison.execute({
      tenantId: input.tenantId, athleteId: input.athleteId, metricId: input.metricId,
      direction: "HIGHER_IS_BETTER", windowDays: input.windowDays,
      minimumSamplesPerWindow: input.minimumSamplesPerWindow,
    }, asOf);
    if (result.status === "INSUFFICIENT_DATA") {
      const { direction: _direction, ...publicResult } = result;
      void _direction;
      return publicResult;
    }
    const tolerance = Math.max(Math.abs(result.previousMean) * input.relativeTolerance,
      input.absoluteTolerance);
    const { direction: _direction, ...publicResult } = result;
      void _direction;
    return { ...publicResult, status: Math.abs(result.signedChange) <= tolerance
      ? "PLATEAU" as const : "NO_PLATEAU" as const,
      relativeTolerance: input.relativeTolerance, absoluteTolerance: input.absoluteTolerance,
      effectiveTolerance: tolerance };
  }
}
