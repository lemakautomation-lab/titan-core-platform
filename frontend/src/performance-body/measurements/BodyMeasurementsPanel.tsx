import type {
  BodyMeasurement,
} from "./body-measurements";

interface BodyMeasurementsPanelProps {
  measurements: readonly BodyMeasurement[];
}

export default function BodyMeasurementsPanel({
  measurements,
}: BodyMeasurementsPanelProps) {
  if (measurements.length === 0) {
    return null;
  }

  return (
    <section
      className="performance-body-measurements"
      aria-label="Body measurements"
    >
      <h2>Measurements</h2>

      <dl>
        {measurements.map((measurement) => (
          <div key={measurement.name}>
            <dt>{measurement.label}</dt>
            <dd>{measurement.valueCm} cm</dd>
          </div>
        ))}
      </dl>

      <p>
        Recorded measurements are displayed as supplied and
        are not medical or diagnostic assessments.
      </p>
    </section>
  );
}
