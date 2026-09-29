import { describe, expect, it, vi } from "vitest";
import { DetectAthleteDeviationUseCase } from "../../src/application/use-cases/detect-athlete-deviation.use-case";
import type { AthleteRepository } from "../../src/domain/repositories/athlete.repository";
import type { PerformanceMetricRepository } from "../../src/domain/repositories/performance-metric.repository";
import type { PerformanceMeasurementRepository } from "../../src/domain/repositories/performance-measurement/performance-measurement.repository";
import type { AthleteBaselineVersionRepository } from "../../src/domain/repositories/athlete-baseline-version.repository";
import { PerformanceMeasurement } from "../../src/domain/entities/performance-measurement/performance-measurement.entity";

const input = { tenantId: "t1", athleteId: "a1", metricId: "m1", relativeThreshold: 0.05,
  absoluteThreshold: 0 };
function setup(value: number) {
  const baseline = { id: "b1", version: 2, status: "READY", value: 100,
    asOf: new Date("2026-09-20T00:00:00Z") };
  const findLatest = vi.fn(async () => baseline);
  const findLatestEffectiveAfter = vi.fn(async () => new PerformanceMeasurement(
    "p1", "t1", "a1", "m1", value, new Date("2026-09-21T00:00:00Z"),
    new Date("2026-09-21T00:00:00Z"),
  ));
  const useCase = new DetectAthleteDeviationUseCase(
    { findById: vi.fn(async () => ({ id: "a1" })) } as unknown as AthleteRepository,
    { findById: vi.fn(async () => ({ id: "m1", athleteId: "a1" })) } as unknown as PerformanceMetricRepository,
    { findLatestEffectiveAfter } as unknown as PerformanceMeasurementRepository,
    { findLatest } as unknown as AthleteBaselineVersionRepository,
  );
  return { useCase, baseline, findLatest, findLatestEffectiveAfter };
}
describe("Mission 073.5 baseline deviation", () => {
  it("classifies a strict threshold and both directions", async () => {
    expect((await setup(105).useCase.execute(input)).status).toBe("NO_DEVIATION");
    expect(await setup(106).useCase.execute(input)).toMatchObject({ status: "DEVIATION",
      direction: "ABOVE", signedDeviation: 6, baselineVersion: 2 });
    expect(await setup(94).useCase.execute(input)).toMatchObject({ status: "DEVIATION",
      direction: "BELOW", signedDeviation: -6 });
  });
  it("does not use a stale ready baseline or an absent observation", async () => {
    const missing = setup(106);
    missing.baseline.status = "INSUFFICIENT_DATA";
    expect((await missing.useCase.execute(input)).status).toBe("BASELINE_NOT_READY");
    expect(missing.findLatestEffectiveAfter).not.toHaveBeenCalled();
    const empty = setup(106);
    empty.findLatestEffectiveAfter.mockResolvedValueOnce(null as never);
    expect((await empty.useCase.execute(input)).status).toBe("NO_NEW_MEASUREMENT");
  });
  it("rejects invalid thresholds before repository access", async () => {
    const subject = setup(106);
    await expect(subject.useCase.execute({ ...input, relativeThreshold: NaN })).rejects.toThrow();
    expect(subject.findLatest).not.toHaveBeenCalled();
  });
});
