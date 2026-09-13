import PerformanceBodyViewer from "../PerformanceBodyViewer";
import type {
  PerformanceBodyModelType,
} from "../PerformanceBodyViewer";
import type {
  BodyProgressSnapshot,
} from "../progress/body-progress";
import {
  selectBeforeBodyState,
} from "./body-state-mapping";

interface BeforeBodyStateViewerProps {
  modelType: PerformanceBodyModelType;
  snapshots: readonly BodyProgressSnapshot[];
}

export default function BeforeBodyStateViewer({
  modelType,
  snapshots,
}: BeforeBodyStateViewerProps) {
  const before = selectBeforeBodyState(snapshots);

  return (
    <section aria-label="Before body state">
      <h2>Before state</h2>

      <p>
        Recorded at{" "}
        <time dateTime={before.recordedAt}>
          {before.recordedAt}
        </time>
      </p>

      <PerformanceBodyViewer
        modelType={modelType}
        measurements={before.measurements}
        muscleDevelopment={
          before.muscleDevelopment
        }
      />

      <p>
        This view reflects explicitly supplied historical
        records and is not a medical or diagnostic assessment.
      </p>
    </section>
  );
}
