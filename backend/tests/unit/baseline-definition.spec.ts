import { describe, expect, it } from "vitest";
import {
  BaselineDefinitionValidationError,
  defineAthleteBaseline,
  type BaselineDefinitionInput,
} from "../../src/domain/entities/athlete-baseline/baseline-definition";

const valid: BaselineDefinitionInput = {
  tenantId: "tenant-1",
  athleteId: "athlete-1",
  metricId: "metric-1",
  lookbackDays: 90,
  minimumSamples: 3,
  method: "ARITHMETIC_MEAN",
};

describe("Mission 072.1 baseline definition", () => {
  it("defines an immutable, scoped numeric metric policy", () => {
    const definition = defineAthleteBaseline({
      ...valid,
      tenantId: " tenant-1 ",
    });
    expect(definition).toEqual(valid);
    expect(Object.isFrozen(definition)).toBe(true);
  });

  it.each(["tenantId", "athleteId", "metricId"] as const)(
    "rejects missing %s",
    (field) => {
      expect(() => defineAthleteBaseline({ ...valid, [field]: "  " }))
        .toThrow(BaselineDefinitionValidationError);
    },
  );

  it.each([0, -1, 1.5, 3651, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects invalid lookbackDays %s",
    (lookbackDays) => {
      expect(() => defineAthleteBaseline({ ...valid, lookbackDays }))
        .toThrow(BaselineDefinitionValidationError);
    },
  );

  it.each([0, 1, 2.5, 10001, Number.NaN])(
    "rejects invalid minimumSamples %s",
    (minimumSamples) => {
      expect(() => defineAthleteBaseline({ ...valid, minimumSamples }))
        .toThrow(BaselineDefinitionValidationError);
    },
  );

  it("rejects an unknown calculation method", () => {
    expect(() => defineAthleteBaseline({
      ...valid,
      method: "MEDIAN" as BaselineDefinitionInput["method"],
    })).toThrow(BaselineDefinitionValidationError);
  });
});
