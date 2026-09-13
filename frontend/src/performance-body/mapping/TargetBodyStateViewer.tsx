import PerformanceBodyViewer from "../PerformanceBodyViewer";
import type {
  PerformanceBodyModelType,
} from "../PerformanceBodyViewer";
import type {
  BodyMeasurement,
} from "../measurements/body-measurements";
import type {
  MuscleDevelopment,
} from "../muscle-development/muscle-development";
import {
  createTargetBodyState,
} from "./body-state-mapping";

interface TargetBodyStateViewerProps {
  modelType: PerformanceBodyModelType;
  currentAt: string;
  targetAt: string;
  measurements: readonly BodyMeasurement[];
  muscleDevelopment: readonly MuscleDevelopment[];
}

export default function TargetBodyStateViewer({
  modelType,
  currentAt,
  targetAt,
  measurements,
  muscleDevelopment,
}: TargetBodyStateViewerProps) {
  const target = createTargetBodyState(
    currentAt,
    targetAt,
    measurements,
    muscleDevelopment,
  );

  return (
    <section aria-label="Target body state">
      <h2>Target state</h2>

      <p>
        Target date{" "}
        <time dateTime={target.targetAt}>
          {target.targetAt}
        </time>
      </p>

      <PerformanceBodyViewer
        modelType={modelType}
        measurements={target.measurements}
        muscleDevelopment={
          target.muscleDevelopment
        }
      />

      <p>
        This target reflects explicitly supplied goals. It is
        not inferred, guaranteed, medical or diagnostic advice.
      </p>
    </section>
  );
}
