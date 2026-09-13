import {
  type Group,
  Mesh,
  MeshStandardMaterial,
} from "three";

export const MUSCLE_DEVELOPMENT_SEGMENTS = [
  "neck",
  "torso",
  "pelvis",
  "left-upper-arm",
  "right-upper-arm",
  "left-forearm",
  "right-forearm",
  "left-thigh",
  "right-thigh",
  "left-lower-leg",
  "right-lower-leg",
] as const;

export type MuscleDevelopmentSegment =
  (typeof MUSCLE_DEVELOPMENT_SEGMENTS)[number];

export type MuscleDevelopmentValues =
  Partial<Record<MuscleDevelopmentSegment, number>>;

export interface MuscleDevelopment {
  readonly segment: MuscleDevelopmentSegment;
  readonly score: number;
}

const DEVELOPMENT_COLOUR = 0x42f5c5;

export function createMuscleDevelopment(
  values: MuscleDevelopmentValues,
): readonly MuscleDevelopment[] {
  const development =
    MUSCLE_DEVELOPMENT_SEGMENTS.flatMap(
      (segment) => {
        const score = values[segment];

        if (score === undefined) {
          return [];
        }

        if (
          !Number.isInteger(score) ||
          score < 0 ||
          score > 100
        ) {
          throw new Error(
            `${segment} development score must be an integer from 0 to 100.`,
          );
        }

        return [
          Object.freeze({
            segment,
            score,
          }),
        ];
      },
    );

  return Object.freeze(development);
}

export function applyMuscleDevelopment(
  model: Group,
  development: readonly MuscleDevelopment[],
): void {
  const scores = new Map(
    development.map((entry) => [
      entry.segment,
      entry.score,
    ]),
  );

  model.traverse((object) => {
    if (!(object instanceof Mesh)) {
      return;
    }

    const score = scores.get(
      object.name as MuscleDevelopmentSegment,
    );

    if (
      score === undefined ||
      !(object.material instanceof MeshStandardMaterial)
    ) {
      return;
    }

    const material = object.material.clone();

    material.emissive.setHex(
      DEVELOPMENT_COLOUR,
    );
    material.emissiveIntensity =
      score / 100;

    object.material = material;
  });
}
