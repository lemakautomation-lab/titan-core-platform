/**
 * Mission 072.1: the immutable policy used to establish one athlete's
 * normal value for one numeric performance metric.
 *
 * This type contains no measurement data and grants no access to an athlete.
 * Callers must resolve tenant-scoped ownership before using it.
 */
export interface BaselineDefinitionInput {
  tenantId: string;
  athleteId: string;
  metricId: string;
  lookbackDays: number;
  minimumSamples: number;
  method: "ARITHMETIC_MEAN";
}

export type BaselineDefinition = Readonly<BaselineDefinitionInput>;

export class BaselineDefinitionValidationError extends Error {
  constructor(
    public readonly field: keyof BaselineDefinitionInput,
    message: string,
  ) {
    super(message);
    this.name = "BaselineDefinitionValidationError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** The lookback interval is (asOf minus lookbackDays, asOf], in UTC. */
export function defineAthleteBaseline(
  input: BaselineDefinitionInput,
): BaselineDefinition {
  if (!input || typeof input !== "object") {
    throw new BaselineDefinitionValidationError(
      "tenantId",
      "Baseline definition is required.",
    );
  }
  for (const field of ["tenantId", "athleteId", "metricId"] as const) {
    if (typeof input[field] !== "string" || !input[field].trim()) {
      throw new BaselineDefinitionValidationError(
        field,
        `${field} is required.`,
      );
    }
  }
  if (!Number.isSafeInteger(input.lookbackDays) || input.lookbackDays < 1 || input.lookbackDays > 3650) {
    throw new BaselineDefinitionValidationError(
      "lookbackDays",
      "lookbackDays must be an integer from 1 to 3650.",
    );
  }
  if (!Number.isSafeInteger(input.minimumSamples) || input.minimumSamples < 2 || input.minimumSamples > 10000) {
    throw new BaselineDefinitionValidationError(
      "minimumSamples",
      "minimumSamples must be an integer from 2 to 10000.",
    );
  }
  if (input.method !== "ARITHMETIC_MEAN") {
    throw new BaselineDefinitionValidationError(
      "method",
      "Unsupported baseline calculation method.",
    );
  }
  return Object.freeze({
    tenantId: input.tenantId.trim(),
    athleteId: input.athleteId.trim(),
    metricId: input.metricId.trim(),
    lookbackDays: input.lookbackDays,
    minimumSamples: input.minimumSamples,
    method: input.method,
  });
}
