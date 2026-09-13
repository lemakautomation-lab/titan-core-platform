import PerformanceBodyViewer from "../PerformanceBodyViewer";
import type {
  PerformanceBodyModelType,
} from "../PerformanceBodyViewer";
import type {
  BodyProgressSnapshot,
} from "../progress/body-progress";
import {
  selectCurrentBodyState,
} from "./body-state-mapping";

interface CurrentBodyStateViewerProps {
  modelType: PerformanceBodyModelType;
  snapshots: readonly BodyProgressSnapshot[];
}

export default function CurrentBodyStateViewer({
  modelType,
  snapshots,
}: CurrentBodyStateViewerProps) {
  const current = selectCurrentBodyState(snapshots);

  return (
    <section aria-label="Current body state">
      <h2>Current state</h2>

      <p>
        Recorded at{" "}
        <time dateTime={current.recordedAt}>
          {current.recordedAt}
        </time>
      </p>

      <PerformanceBodyViewer
        modelType={modelType}
        measurements={current.measurements}
        muscleDevelopment={
          current.muscleDevelopment
        }
      />

      <p>
        This view reflects explicitly supplied current records
        and is not a medical or diagnostic assessment.
      </p>
    </section>
  );
}
