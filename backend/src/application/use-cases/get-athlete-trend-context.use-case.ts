import { DetectAthleteImprovementUseCase } from "./detect-athlete-improvement.use-case";
import type { ImprovementDirection } from "../../domain/services/athlete-improvement-detector.service";

/** Describes sample coverage for a two-window trend without claiming statistical certainty. */
export class GetAthleteTrendContextUseCase {
  constructor(private readonly comparison: DetectAthleteImprovementUseCase) {}

  async execute(input: { tenantId: string; athleteId: string; metricId: string;
    direction: ImprovementDirection; windowDays: number; minimumSamplesPerWindow: number },
    asOf: Date = new Date()) {
    const result = await this.comparison.execute(input, asOf);
    const boundary = new Date(asOf.getTime() - input.windowDays * 86_400_000);
    const start = new Date(boundary.getTime() - input.windowDays * 86_400_000);
    const smallerWindowCount = Math.min(result.previousCount, result.currentCount);
    const evidenceLevel = smallerWindowCount < input.minimumSamplesPerWindow ? "INSUFFICIENT" as const :
      smallerWindowCount < input.minimumSamplesPerWindow * 2 ? "MINIMUM_COVERAGE" as const :
        "EXTRA_COVERAGE" as const;
    return { athleteId: input.athleteId, metricId: input.metricId, direction: input.direction,
      asOf, windowDays: input.windowDays, minimumSamplesPerWindow: input.minimumSamplesPerWindow,
      previousWindow: { after: start, through: boundary, sampleCount: result.previousCount },
      currentWindow: { after: boundary, through: asOf, sampleCount: result.currentCount },
      evidenceLevel, evidenceBasis: "SAMPLE_COVERAGE_ONLY" as const,
      statisticalConfidence: null,
      comparison: result.status === "INSUFFICIENT_DATA" ? null : {
        previousMean: result.previousMean, currentMean: result.currentMean,
        signedChange: result.signedChange,
      } };
  }
}
