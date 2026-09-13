import {
  createBodyLongitudinalProgress,
} from "./body-longitudinal";
import type {
  BodyProgressSnapshot,
} from "../progress/body-progress";

interface BodyLongitudinalPanelProps {
  snapshots: readonly BodyProgressSnapshot[];
}

function signed(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

export default function BodyLongitudinalPanel({
  snapshots,
}: BodyLongitudinalPanelProps) {
  const timeline =
    createBodyLongitudinalProgress(snapshots);

  return (
    <section aria-label="Longitudinal body progress">
      <h2>Longitudinal comparison</h2>

      <p>
        From{" "}
        <time dateTime={timeline.startAt}>
          {timeline.startAt}
        </time>
        {" "}to{" "}
        <time dateTime={timeline.endAt}>
          {timeline.endAt}
        </time>
      </p>

      <ol aria-label="Body progress intervals">
        {timeline.comparisons.map(
          (comparison) => (
            <li
              key={
                `${comparison.baselineAt}-${comparison.currentAt}`
              }
            >
              <h3>
                <time dateTime={comparison.baselineAt}>
                  {comparison.baselineAt}
                </time>
                {" "}to{" "}
                <time dateTime={comparison.currentAt}>
                  {comparison.currentAt}
                </time>
              </h3>

              <ul>
                {comparison.measurementDeltas.map(
                  (delta) => (
                    <li key={`measurement-${delta.name}`}>
                      {delta.label}:{" "}
                      {signed(delta.deltaCm)} cm
                    </li>
                  ),
                )}

                {comparison.muscleDeltas.map(
                  (delta) => (
                    <li key={`muscle-${delta.segment}`}>
                      {delta.segment}:{" "}
                      {signed(delta.deltaScore)}
                    </li>
                  ),
                )}
              </ul>
            </li>
          ),
        )}
      </ol>

      <p>
        Longitudinal progress reflects supplied records and is
        not a medical or diagnostic assessment.
      </p>
    </section>
  );
}
