import {
  compareBodyProgress,
  type BodyProgressSnapshot,
} from "./body-progress";

interface BodyProgressPanelProps {
  snapshots: readonly BodyProgressSnapshot[];
}

function signed(value: number): string {
  return value > 0
    ? `+${value}`
    : `${value}`;
}

export default function BodyProgressPanel({
  snapshots,
}: BodyProgressPanelProps) {
  if (snapshots.length < 2) {
    return (
      <p
        className="performance-body-progress__empty"
        role="status"
      >
        At least two progress snapshots are required.
      </p>
    );
  }

  const ordered = [...snapshots].sort(
    (left, right) =>
      Date.parse(left.recordedAt) -
      Date.parse(right.recordedAt),
  );

  const comparison = compareBodyProgress(
    ordered[0],
    ordered[ordered.length - 1],
  );

  return (
    <section
      className="performance-body-progress"
      aria-label="Body progress"
    >
      <h2>Progress</h2>

      <p>
        Baseline: {comparison.baselineAt}
        <br />
        Current: {comparison.currentAt}
      </p>

      <dl>
        {comparison.measurementDeltas.map(
          (delta) => (
            <div key={delta.name}>
              <dt>{delta.label}</dt>
              <dd>{signed(delta.deltaCm)} cm</dd>
            </div>
          ),
        )}

        {comparison.muscleDeltas.map(
          (delta) => (
            <div key={delta.segment}>
              <dt>{delta.segment}</dt>
              <dd>
                {signed(delta.deltaScore)} points
              </dd>
            </div>
          ),
        )}
      </dl>

      <p>
        Progress reflects supplied records and is not a
        medical or diagnostic assessment.
      </p>
    </section>
  );
}
