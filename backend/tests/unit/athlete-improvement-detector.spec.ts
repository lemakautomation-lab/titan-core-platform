import { describe, expect, it } from "vitest";
import { PerformanceMeasurement } from "../../src/domain/entities/performance-measurement/performance-measurement.entity";
import { AthleteImprovementDetector } from "../../src/domain/services/athlete-improvement-detector.service";

const asOf = new Date("2026-09-29T00:00:00.000Z");
const row = (id: string, value: number, time: string, tenantId = "t1") =>
  new PerformanceMeasurement(id, tenantId, "a1", "m1", value, new Date(time), asOf);
const previous = [1, 2, 3].map((n) => row(`p${n}`, 12, `2026-09-${10 + n}T00:00:00.000Z`));
const current = [1, 2, 3].map((n) => row(`c${n}`, 10, `2026-09-${20 + n}T00:00:00.000Z`));
const input = { tenantId: "t1", athleteId: "a1", metricId: "m1", asOf,
  windowDays: 15, minimumSamplesPerWindow: 3,
  direction: "LOWER_IS_BETTER" as const, measurements: [...previous, ...current] };
const detector = new AthleteImprovementDetector();

describe("Mission 073.1 improvement detection", () => {
  it("detects lower-is-better improvement and the opposite direction", () => {
    expect(detector.detect(input)).toMatchObject({ status: "IMPROVEMENT", signedChange: 2,
      previousMean: 12, currentMean: 10 });
    expect(detector.detect({ ...input, direction: "HIGHER_IS_BETTER" })).toMatchObject({
      status: "NO_IMPROVEMENT", signedChange: -2,
    });
  });
  it("does not infer improvement from equal values or sparse windows", () => {
    expect(detector.detect({ ...input, measurements: [...previous, ...previous.map((r, n) =>
      row(`e${n}`, 12, `2026-09-${20 + n}T00:00:00.000Z`))] })).toMatchObject({ status: "NO_IMPROVEMENT" });
    expect(detector.detect({ ...input, measurements: [...previous, ...current.slice(0, 2)] })).toEqual({
      status: "INSUFFICIENT_DATA", previousCount: 3, currentCount: 2, requiredSamplesPerWindow: 3,
    });
  });
  it("rejects foreign scope, nonfinite values and out-of-window observations", () => {
    expect(() => detector.detect({ ...input, measurements: [...previous, ...current,
      row("foreign", 10, "2026-09-22T00:00:00.000Z", "t2")] })).toThrow();
    expect(() => detector.detect({ ...input, measurements: [...previous, ...current,
      row("nan", NaN, "2026-09-22T00:00:00.000Z")] })).toThrow();
    expect(() => detector.detect({ ...input, measurements: [...previous, ...current,
      row("old", 10, "2026-08-01T00:00:00.000Z")] })).toThrow();
  });
  it("rejects invalid policy", () => {
    expect(() => detector.detect({ ...input, windowDays: 1826 })).toThrow();
    expect(() => detector.detect({ ...input, direction: "UNKNOWN" as never })).toThrow();
  });
});
