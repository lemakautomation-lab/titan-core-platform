import type {
  BodyMeasurement,
} from "../measurements/body-measurements";
import {
  mapBodyMeasurements,
} from "./measurement-mapping";

interface BodyMeasurementMappingPanelProps {
  measurements: readonly BodyMeasurement[];
}

function segmentLabel(segment: string): string {
  return segment
    .split("-")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

export default function BodyMeasurementMappingPanel({
  measurements,
}: BodyMeasurementMappingPanelProps) {
  const mappings =
    mapBodyMeasurements(measurements);

  if (mappings.length === 0) {
    return (
      <p role="status">
        No body measurements are available for mapping.
      </p>
    );
  }

  return (
    <section aria-label="Body measurement mapping">
      <h2>Measurement mapping</h2>

      <dl>
        {mappings.map((mapping) => (
          <div key={mapping.measurement}>
            <dt>{mapping.label}</dt>
            <dd>
              {mapping.valueCm} cm mapped to{" "}
              {mapping.measurement === "height"
                ? "Whole body"
                : mapping.segments
                    .map(segmentLabel)
                    .join(", ")}
            </dd>
          </div>
        ))}
      </dl>

      <p>
        Mapping identifies display regions only and is not a
        medical, diagnostic or anatomical assessment.
      </p>
    </section>
  );
}
