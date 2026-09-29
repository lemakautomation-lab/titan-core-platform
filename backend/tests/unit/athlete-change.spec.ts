import { describe, expect, it, vi } from "vitest";
import { DetectAthleteChangeUseCase } from "../../src/application/use-cases/detect-athlete-change.use-case";
import type { DetectAthleteImprovementUseCase } from "../../src/application/use-cases/detect-athlete-improvement.use-case";

const input = { tenantId: "t1", athleteId: "a1", metricId: "m1", windowDays: 30,
  minimumSamplesPerWindow: 3, relativeThreshold: 0.02, absoluteThreshold: 0 };
function detector(currentMean: number) {
  const execute = vi.fn(async () => ({ status: "IMPROVEMENT" as const,
    previousCount: 3, currentCount: 3, previousMean: 100, currentMean,
    signedChange: currentMean - 100, athleteId: "a1", metricId: "m1",
    direction: "HIGHER_IS_BETTER" as const, asOf: new Date(), windowDays: 30 }));
  return { useCase: new DetectAthleteChangeUseCase({ execute } as unknown as DetectAthleteImprovementUseCase), execute };
}
describe("Mission 073.4 material change policy", () => {
  it("requires a change strictly greater than the effective threshold", async () => {
    expect((await detector(102).useCase.execute(input)).status).toBe("NO_CHANGE");
    expect((await detector(103).useCase.execute(input)).status).toBe("CHANGE");
    const decrease = await detector(97).useCase.execute(input);
    expect(decrease).toMatchObject({ status: "CHANGE", changeDirection: "DECREASE",
      absoluteChange: 3, effectiveThreshold: 2 });
    expect(decrease).not.toHaveProperty("direction");
  });
  it("uses absolute threshold for zero baseline and rejects invalid policy before lookup", async () => {
    const zero = detector(0);
    zero.execute.mockResolvedValueOnce({ status: "IMPROVEMENT", previousCount: 3,
      currentCount: 3, previousMean: 0, currentMean: 0.5, signedChange: 0.5,
      athleteId: "a1", metricId: "m1", direction: "HIGHER_IS_BETTER",
      asOf: new Date(), windowDays: 30 });
    expect((await zero.useCase.execute({ ...input, absoluteThreshold: 1 })).status).toBe("NO_CHANGE");
    const invalid = detector(100);
    await expect(invalid.useCase.execute({ ...input, relativeThreshold: NaN })).rejects.toThrow();
    expect(invalid.execute).not.toHaveBeenCalled();
  });
});
