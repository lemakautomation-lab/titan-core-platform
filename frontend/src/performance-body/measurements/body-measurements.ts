export const BODY_MEASUREMENT_NAMES = [
  "height",
  "chest",
  "waist",
  "hips",
  "left-upper-arm",
  "right-upper-arm",
  "left-thigh",
  "right-thigh",
] as const;

export type BodyMeasurementName =
  (typeof BODY_MEASUREMENT_NAMES)[number];

export type BodyMeasurementValues =
  Partial<Record<BodyMeasurementName, number>>;

export interface BodyMeasurement {
  readonly name: BodyMeasurementName;
  readonly label: string;
  readonly valueCm: number;
}

const LABELS: Record<BodyMeasurementName, string> = {
  height: "Height",
  chest: "Chest",
  waist: "Waist",
  hips: "Hips",
  "left-upper-arm": "Left upper arm",
  "right-upper-arm": "Right upper arm",
  "left-thigh": "Left thigh",
  "right-thigh": "Right thigh",
};

export function createBodyMeasurements(
  values: BodyMeasurementValues,
): readonly BodyMeasurement[] {
  const measurements =
    BODY_MEASUREMENT_NAMES.flatMap((name) => {
      const valueCm = values[name];

      if (valueCm === undefined) {
        return [];
      }

      if (
        !Number.isFinite(valueCm) ||
        valueCm <= 0
      ) {
        throw new Error(
          `${LABELS[name]} must be a finite positive centimetre value.`,
        );
      }

      return [
        Object.freeze({
          name,
          label: LABELS[name],
          valueCm,
        }),
      ];
    });

  return Object.freeze(measurements);
}
