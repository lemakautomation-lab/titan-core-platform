import {
  MALE_BODY_SEGMENT_NAMES,
} from "../models/male-body.model";
import type {
  MaleBodySegmentName,
} from "../models/male-body.model";
import type {
  BodyMeasurement,
  BodyMeasurementName,
} from "../measurements/body-measurements";

export interface BodyMeasurementMapping {
  readonly measurement: BodyMeasurementName;
  readonly label: string;
  readonly valueCm: number;
  readonly segments:
    readonly MaleBodySegmentName[];
}

function segments(
  ...names: MaleBodySegmentName[]
): readonly MaleBodySegmentName[] {
  return Object.freeze(names);
}

const MEASUREMENT_SEGMENTS:
  Readonly<
    Record<
      BodyMeasurementName,
      readonly MaleBodySegmentName[]
    >
  > = Object.freeze({
    height: MALE_BODY_SEGMENT_NAMES,
    chest: segments("torso"),
    waist: segments("torso"),
    hips: segments("pelvis"),
    "left-upper-arm":
      segments("left-upper-arm"),
    "right-upper-arm":
      segments("right-upper-arm"),
    "left-thigh":
      segments("left-thigh"),
    "right-thigh":
      segments("right-thigh"),
  });

export function mapBodyMeasurements(
  measurements: readonly BodyMeasurement[],
): readonly BodyMeasurementMapping[] {
  const seen =
    new Set<BodyMeasurementName>();

  const mappings = measurements.map(
    (measurement) => {
      if (seen.has(measurement.name)) {
        throw new Error(
          `Duplicate body measurement: ${measurement.name}.`,
        );
      }

      seen.add(measurement.name);

      return Object.freeze({
        measurement: measurement.name,
        label: measurement.label,
        valueCm: measurement.valueCm,
        segments: Object.freeze([
          ...MEASUREMENT_SEGMENTS[
            measurement.name
          ],
        ]),
      });
    },
  );

  return Object.freeze(mappings);
}
