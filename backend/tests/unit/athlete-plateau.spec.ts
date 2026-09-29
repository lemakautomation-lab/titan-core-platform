import { describe, expect, it, vi } from "vitest";
import { DetectAthletePlateauUseCase } from "../../src/application/use-cases/detect-athlete-plateau.use-case";
import type { DetectAthleteImprovementUseCase } from "../../src/application/use-cases/detect-athlete-improvement.use-case";

const input = { tenantId: "t1", athleteId: "a1", metricId: "m1", windowDays: 30,
  minimumSamplesPerWindow: 3, relativeTolerance: 0.02, absoluteTolerance: 0 };
function useCase(currentMean: number) {
  const execute = vi.fn(async () => ({ status: "IMPROVEMENT" as const,
    previousCount: 3, currentCount: 3, previousMean: 100, currentMean,
    signedChange: currentMean - 100, athleteId: "a1", metricId: "m1",
    direction: "HIGHER_IS_BETTER" as const, asOf: new Date(), windowDays: 30 }));
  return { detector: new DetectAthletePlateauUseCase({ execute } as unknown as DetectAthleteImprovementUseCase), execute };
}
describe("Mission 073.3 plateau policy", () => {
  it("accepts changes within the 2% tolerance, including its boundary", async () => {
    expect((await useCase(101).detector.execute(input)).status).toBe("PLATEAU");
    expect((await useCase(102).detector.execute(input)).status).toBe("PLATEAU");
  });
  it("rejects a larger change and handles a zero baseline with absolute tolerance", async () => {
    expect((await useCase(103).detector.execute(input)).status).toBe("NO_PLATEAU");
    const zero = useCase(0);
    zero.execute.mockResolvedValueOnce({ status: "IMPROVEMENT", previousCount: 3,
      currentCount: 3, previousMean: 0, currentMean: 0.5, signedChange: 0.5,
      athleteId: "a1", metricId: "m1", direction: "HIGHER_IS_BETTER",
      asOf: new Date(), windowDays: 30 });
    expect((await zero.detector.execute({ ...input, absoluteTolerance: 1 })).status).toBe("PLATEAU");
  });
  it("rejects invalid tolerances before querying measurements", async () => {
    const { detector, execute } = useCase(100);
    await expect(detector.execute({ ...input, relativeTolerance: NaN })).rejects.toThrow();
    expect(execute).not.toHaveBeenCalled();
  });
});
