import type {
  BodyMeasurement,
} from "../measurements/body-measurements";

import type {
  MuscleDevelopment,
} from "../muscle-development/muscle-development";

export interface BodyProgressSnapshot {
  readonly recordedAt: string;
  readonly measurements: readonly BodyMeasurement[];
  readonly muscleDevelopment: readonly MuscleDevelopment[];
}

export interface BodyMeasurementDelta {
  readonly name: string;
  readonly label: string;
  readonly deltaCm: number;
}

export interface MuscleDevelopmentDelta {
  readonly segment: string;
  readonly deltaScore: number;
}

export interface BodyProgressComparison {
  readonly baselineAt: string;
  readonly currentAt: string;
  readonly measurementDeltas: readonly BodyMeasurementDelta[];
  readonly muscleDeltas: readonly MuscleDevelopmentDelta[];
}

const OFFSET_TIMESTAMP =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/;

function validateTimestamp(
  recordedAt: string,
): void {
  if (
    !OFFSET_TIMESTAMP.test(recordedAt) ||
    Number.isNaN(Date.parse(recordedAt))
  ) {
    throw new Error(
      "Progress timestamp must be a valid ISO 8601 value with timezone.",
    );
  }
}

function roundDelta(value: number): number {
  return Math.round(value * 100) / 100;
}

export function createBodyProgressSnapshot(
  recordedAt: string,
  measurements: readonly BodyMeasurement[],
  muscleDevelopment: readonly MuscleDevelopment[],
): BodyProgressSnapshot {
  validateTimestamp(recordedAt);

  if (
    measurements.length === 0 &&
    muscleDevelopment.length === 0
  ) {
    throw new Error(
      "Progress snapshot requires at least one supplied value.",
    );
  }

  return Object.freeze({
    recordedAt,
    measurements: Object.freeze([
      ...measurements,
    ]),
    muscleDevelopment: Object.freeze([
      ...muscleDevelopment,
    ]),
  });
}

export function compareBodyProgress(
  baseline: BodyProgressSnapshot,
  current: BodyProgressSnapshot,
): BodyProgressComparison {
  const baselineTime =
    Date.parse(baseline.recordedAt);

  const currentTime =
    Date.parse(current.recordedAt);

  if (currentTime <= baselineTime) {
    throw new Error(
      "Current progress snapshot must be later than baseline.",
    );
  }

  const baselineMeasurements = new Map(
    baseline.measurements.map((measurement) => [
      measurement.name,
      measurement.valueCm,
    ]),
  );

  const baselineMuscles = new Map(
    baseline.muscleDevelopment.map((entry) => [
      entry.segment,
      entry.score,
    ]),
  );

  const measurementDeltas =
    current.measurements.flatMap(
      (measurement) => {
        const baselineValue =
          baselineMeasurements.get(
            measurement.name,
          );

        if (baselineValue === undefined) {
          return [];
        }

        return [
          Object.freeze({
            name: measurement.name,
            label: measurement.label,
            deltaCm: roundDelta(
              measurement.valueCm -
                baselineValue,
            ),
          }),
        ];
      },
    );

  const muscleDeltas =
    current.muscleDevelopment.flatMap(
      (entry) => {
        const baselineScore =
          baselineMuscles.get(
            entry.segment,
          );

        if (baselineScore === undefined) {
          return [];
        }

        return [
          Object.freeze({
            segment: entry.segment,
            deltaScore:
              entry.score -
              baselineScore,
          }),
        ];
      },
    );

  return Object.freeze({
    baselineAt: baseline.recordedAt,
    currentAt: current.recordedAt,
    measurementDeltas:
      Object.freeze(measurementDeltas),
    muscleDeltas:
      Object.freeze(muscleDeltas),
  });
}
