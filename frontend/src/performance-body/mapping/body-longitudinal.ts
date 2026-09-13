import {
  compareBodyProgress,
  type BodyProgressComparison,
  type BodyProgressSnapshot,
} from "../progress/body-progress";

export interface BodyLongitudinalProgress {
  readonly startAt: string;
  readonly endAt: string;
  readonly comparisons:
    readonly BodyProgressComparison[];
}

export function createBodyLongitudinalProgress(
  snapshots: readonly BodyProgressSnapshot[],
): BodyLongitudinalProgress {
  if (snapshots.length < 2) {
    throw new Error(
      "Longitudinal progress requires at least two snapshots.",
    );
  }

  const ordered = snapshots.map((snapshot) => {
    const timestamp = Date.parse(snapshot.recordedAt);

    if (Number.isNaN(timestamp)) {
      throw new Error(
        "Longitudinal progress requires valid timestamps.",
      );
    }

    return {
      snapshot,
      timestamp,
    };
  }).sort(
    (left, right) =>
      left.timestamp - right.timestamp,
  );

  for (
    let index = 1;
    index < ordered.length;
    index += 1
  ) {
    if (
      ordered[index].timestamp ===
      ordered[index - 1].timestamp
    ) {
      throw new Error(
        "Longitudinal progress requires unique timestamps.",
      );
    }
  }

  const comparisons =
    ordered.slice(1).map((entry, index) =>
      compareBodyProgress(
        ordered[index].snapshot,
        entry.snapshot,
      ),
    );

  return Object.freeze({
    startAt: ordered[0].snapshot.recordedAt,
    endAt:
      ordered[ordered.length - 1]
        .snapshot.recordedAt,
    comparisons: Object.freeze(comparisons),
  });
}
