import { DetectAthleteImprovementUseCase } from "./detect-athlete-improvement.use-case";
import type { ImprovementDirection } from "../../domain/services/athlete-improvement-detector.service";

/** Reuses the same tenant-scoped effective history and signed comparison. */
export class DetectAthleteDeclineUseCase {
  constructor(private readonly comparison: DetectAthleteImprovementUseCase) {}

  async execute(input: { tenantId: string; athleteId: string; metricId: string;
    direction: ImprovementDirection; windowDays: number; minimumSamplesPerWindow: number },
    asOf: Date = new Date()) {
    const result = await this.comparison.execute(input, asOf);
    if (result.status === "INSUFFICIENT_DATA") return result;
    return { ...result, status: result.signedChange < 0 ? "DECLINE" as const : "NO_DECLINE" as const };
  }
}
