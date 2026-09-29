import { describe, expect, it, vi } from "vitest";
import { GetAthleteTrendContextUseCase } from "../../src/application/use-cases/get-athlete-trend-context.use-case";
import type { DetectAthleteImprovementUseCase } from "../../src/application/use-cases/detect-athlete-improvement.use-case";

const asOf = new Date("2026-09-29T12:00:00.000Z");
const input = { tenantId: "t1", athleteId: "a1", metricId: "m1",
  direction: "HIGHER_IS_BETTER" as const, windowDays: 30, minimumSamplesPerWindow: 3 };
function context(previousCount: number, currentCount: number) {
  const execute = vi.fn(async () => ({ status: "IMPROVEMENT" as const,
    previousCount, currentCount, previousMean: 100, currentMean: 110,
    signedChange: 10, athleteId: "a1", metricId: "m1",
    direction: "HIGHER_IS_BETTER" as const, asOf, windowDays: 30 }));
  return new GetAthleteTrendContextUseCase({ execute } as unknown as DetectAthleteImprovementUseCase);
}
describe("Mission 073.6 trend context", () => {
  it("reports sample coverage and exact adjacent window boundaries", async () => {
    expect(await context(6, 6).execute(input, asOf)).toMatchObject({
      evidenceLevel: "EXTRA_COVERAGE", evidenceBasis: "SAMPLE_COVERAGE_ONLY",
      statisticalConfidence: null,
      previousWindow: { after: new Date("2026-07-31T12:00:00.000Z"),
        through: new Date("2026-08-30T12:00:00.000Z"), sampleCount: 6 },
      currentWindow: { after: new Date("2026-08-30T12:00:00.000Z"), through: asOf, sampleCount: 6 },
      comparison: { previousMean: 100, currentMean: 110, signedChange: 10 },
    });
    expect((await context(3, 4).execute(input, asOf)).evidenceLevel).toBe("MINIMUM_COVERAGE");
  });
  it("withholds the comparison for sparse windows", async () => {
    const execute = vi.fn(async () => ({ status: "INSUFFICIENT_DATA" as const,
      previousCount: 2, currentCount: 8, requiredSamplesPerWindow: 3,
      athleteId: "a1", metricId: "m1", direction: "HIGHER_IS_BETTER" as const,
      asOf, windowDays: 30 }));
    const useCase = new GetAthleteTrendContextUseCase({ execute } as unknown as DetectAthleteImprovementUseCase);
    expect(await useCase.execute(input, asOf)).toMatchObject({ evidenceLevel: "INSUFFICIENT", comparison: null });
  });
});
