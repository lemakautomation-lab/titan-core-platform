import type {
  BodyMeasurement,
} from "../measurements/body-measurements";
import type {
  MuscleDevelopment,
} from "../muscle-development/muscle-development";
import type {
  BodyProgressSnapshot,
} from "../progress/body-progress";

export interface BeforeBodyState {
  readonly state: "BEFORE";
  readonly recordedAt: string;
  readonly measurements: readonly BodyMeasurement[];
  readonly muscleDevelopment: readonly MuscleDevelopment[];
}

export function selectBeforeBodyState(
  snapshots: readonly BodyProgressSnapshot[],
): BeforeBodyState {
  if (snapshots.length === 0) {
    throw new Error(
      "Before body state requires at least one progress snapshot.",
    );
  }

  const ordered = [...snapshots].sort(
    (left, right) =>
      Date.parse(left.recordedAt) -
      Date.parse(right.recordedAt),
  );

  const before = ordered[0];

  if (Number.isNaN(Date.parse(before.recordedAt))) {
    throw new Error(
      "Before body state requires a valid timestamp.",
    );
  }

  return Object.freeze({
    state: "BEFORE" as const,
    recordedAt: before.recordedAt,
    measurements: Object.freeze([
      ...before.measurements,
    ]),
    muscleDevelopment: Object.freeze([
      ...before.muscleDevelopment,
    ]),
  });
}
export interface CurrentBodyState {
  readonly state: "CURRENT";
  readonly recordedAt: string;
  readonly measurements: readonly BodyMeasurement[];
  readonly muscleDevelopment: readonly MuscleDevelopment[];
}

export function selectCurrentBodyState(
  snapshots: readonly BodyProgressSnapshot[],
): CurrentBodyState {
  if (snapshots.length === 0) {
    throw new Error(
      "Current body state requires at least one progress snapshot.",
    );
  }

  const dated = snapshots.map((snapshot) => {
    const timestamp = Date.parse(snapshot.recordedAt);

    if (Number.isNaN(timestamp)) {
      throw new Error(
        "Current body state requires valid timestamps.",
      );
    }

    return {
      snapshot,
      timestamp,
    };
  });

  dated.sort(
    (left, right) =>
      right.timestamp - left.timestamp,
  );

  const current = dated[0].snapshot;

  return Object.freeze({
    state: "CURRENT" as const,
    recordedAt: current.recordedAt,
    measurements: Object.freeze([
      ...current.measurements,
    ]),
    muscleDevelopment: Object.freeze([
      ...current.muscleDevelopment,
    ]),
  });
}
