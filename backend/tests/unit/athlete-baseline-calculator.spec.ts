import { describe, expect, it } from "vitest";
import { defineAthleteBaseline } from "../../src/domain/entities/athlete-baseline/baseline-definition";
import { AthleteBaselineCalculator } from "../../src/domain/services/athlete-baseline-calculator.service";
import { PerformanceMeasurement } from "../../src/domain/entities/performance-measurement/performance-measurement.entity";

const definition = defineAthleteBaseline({
  tenantId: "t1", athleteId: "a1", metricId: "m1",
  lookbackDays: 90, minimumSamples: 3, method: "ARITHMETIC_MEAN",
});
const asOf = new Date("2026-09-28T12:00:00.000Z");
const at = (id: string, value: number, date: string, tenantId = "t1") =>
  new PerformanceMeasurement(id, tenantId, "a1", "m1", value, new Date(date), asOf);
const rows = [
  at("1", 10, "2026-09-01T12:00:00.000Z"),
  at("2", 20, "2026-09-10T12:00:00.000Z"),
  at("3", 30, "2026-09-20T12:00:00.000Z"),
];

describe("Mission 072.3 baseline calculation", () => {
  const calculator = new AthleteBaselineCalculator();
  it("calculates a stable mean and provenance dates", () => {
    expect(calculator.calculate(definition, asOf, rows)).toEqual({
      status: "READY",
      value: 20,
      sampleCount: 3,
      earliestRecordedAt: rows[0].recordedAt,
      latestRecordedAt: rows[2].recordedAt,
    });
  });
  it("reports insufficient data without inventing a baseline", () => {
    expect(calculator.calculate(definition, asOf, rows.slice(0, 2))).toEqual({
      status: "INSUFFICIENT_DATA", sampleCount: 2, requiredSamples: 3,
    });
  });
  it("rejects foreign tenant data and non-finite values", () => {
    expect(() => calculator.calculate(definition, asOf, [...rows, at("4", 1, "2026-09-21T12:00:00.000Z", "t2")])).toThrow();
    expect(() => calculator.calculate(definition, asOf, [...rows, at("5", NaN, "2026-09-21T12:00:00.000Z")])).toThrow();
  });
  it("rejects observations outside the defined window", () => {
    expect(() => calculator.calculate(definition, asOf, [...rows, at("4", 1, "2026-06-01T12:00:00.000Z")])).toThrow();
    expect(() => calculator.calculate(definition, asOf, [...rows, at("5", 1, "2026-09-29T12:00:00.000Z")])).toThrow();
  });
});
