import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import PerformanceBodyViewer from "../performance-body/PerformanceBodyViewer";
import {
  createBodyMeasurements,
} from "../performance-body/measurements/body-measurements";
import {
  createBodyProgressSnapshot,
} from "../performance-body/progress/body-progress";
import {
  type AthletePerformanceBodyProfileDto,
  type BodyFatMethod,
  getMyPerformanceBodyProfile,
  recordMyBodyMeasurement,
  type PerformanceBodyModelType,
  updateMyPerformanceBodyModel,
} from "./athlete-performance-body.api";

interface Props {
  athleteId: string;
}

export default function AthletePerformanceBodyPanel({
  athleteId,
}: Props) {
  const [profile, setProfile] =
    useState<AthletePerformanceBodyProfileDto | null>(
      null,
    );
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [savingMeasurement, setSavingMeasurement] = useState(false);
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [bodyFatPercentage, setBodyFatPercentage] = useState("");
  const [bodyFatMethod, setBodyFatMethod] = useState<BodyFatMethod | "">("");
  const [measurementMessage, setMeasurementMessage] =
    useState<string | null>(null);
  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        const result =
          await getMyPerformanceBodyProfile();

        if (!mounted) {
          return;
        }

        if (result.athleteId !== athleteId) {
          setError(
            "This performance body does not belong to the requested Athlete.",
          );
          return;
        }

        setProfile(result);
      } catch {
        if (mounted) {
          setError(
            "Unable to load the performance body. Please try again.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, [athleteId]);

  async function selectModel(
    modelType: PerformanceBodyModelType,
  ) {
    if (!profile || updating) {
      return;
    }

    setUpdating(true);
    setError(null);

    try {
      const result =
        await updateMyPerformanceBodyModel(
          modelType,
        );

      if (result.athleteId !== athleteId) {
        throw new Error("Athlete mismatch.");
      }

      setProfile({
        ...profile,
        modelType: result.modelType,
      });
    } catch {
      setError(
        "Unable to update the performance-body model.",
      );
    } finally {
      setUpdating(false);
    }
  }

  async function saveMeasurement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile || savingMeasurement) return;

    const height = Number(heightCm);
    const weight = Number(weightKg);
    const bodyFat = bodyFatPercentage.trim() === ""
      ? undefined
      : Number(bodyFatPercentage);

    if (!Number.isFinite(height) || height <= 0 || height > 300 ||
        !Number.isFinite(weight) || weight <= 0 || weight > 1000 ||
        (bodyFat !== undefined &&
          (!Number.isFinite(bodyFat) || bodyFat < 0 || bodyFat > 100 || !bodyFatMethod))) {
      setMeasurementMessage("Enter valid height, weight and optional body fat values.");
      return;
    }

    setSavingMeasurement(true);
    setMeasurementMessage(null);
    try {
      await recordMyBodyMeasurement({
        heightCm: height,
        weightKg: weight,
        ...(bodyFat === undefined ? {} : { bodyFatPercentage: bodyFat, bodyFatMethod: bodyFatMethod as BodyFatMethod }),
      });
      const refreshed = await getMyPerformanceBodyProfile();
      if (refreshed.athleteId !== athleteId) throw new Error("Athlete mismatch.");
      setProfile(refreshed);
      setHeightCm("");
      setWeightKg("");
      setBodyFatPercentage("");
      setBodyFatMethod("");
      setMeasurementMessage("Measurement recorded. BMI was calculated from height and weight.");
    } catch {
      setMeasurementMessage("Unable to record the measurement. Please try again.");
    } finally {
      setSavingMeasurement(false);
    }
  }

  if (loading) {
    return (
      <section aria-label="Performance body">
        <p>Loading performance body...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section aria-label="Performance body">
        <p role="alert">{error}</p>
      </section>
    );
  }

  if (!profile) {
    return null;
  }

  if (!profile.modelType) {
    return (
      <section aria-label="Performance body">
        <h3>Select your performance-body model</h3>

        <p>
          Choose the explicit model that should represent
          your Athlete profile. TITAN will not infer or
          default this selection.
        </p>

        <button
          type="button"
          disabled={updating}
          onClick={() => void selectModel("MALE")}
        >
          Use male model
        </button>{" "}

        <button
          type="button"
          disabled={updating}
          onClick={() => void selectModel("FEMALE")}
        >
          Use female model
        </button>
      </section>
    );
  }

  const snapshots =
    profile.measurements.map((measurement) =>
      createBodyProgressSnapshot(
        measurement.recordedAt,
        createBodyMeasurements({
          height: measurement.heightCm,
        }),
        [],
      ),
    );

  const latest =
    profile.measurements[
      profile.measurements.length - 1
    ];

  const currentMeasurements = latest
    ? createBodyMeasurements({
        height: latest.heightCm,
      })
    : [];

  return (
    <section className="titan-body-profile" aria-label="Performance body">
      <div className="titan-users-header">
        <div>
          <span className="titan-eyebrow">
            PERFORMANCE BODY
          </span>

          <h3>3D Athlete body</h3>
        </div>
      </div>

      {latest && (
        <dl className="titan-body-profile__metrics" aria-label="Current body metrics">
          <div>
            <dt>Weight</dt>
            <dd>{latest.weightKg} kg</dd>
          </div>

          <div>
            <dt>BMI</dt>
            <dd>{latest.bmi}</dd>
          </div>

          <div>
            <dt>Body fat</dt>
            <dd>
              {latest.bodyFatPercentage === null
                ? "Not supplied"
                : `${latest.bodyFatPercentage}%`}
            </dd>
          </div>

          {latest.bodyFatPercentage !== null && (
            <div><dt>Body-fat method</dt><dd>{latest.bodyFatMethod ?? "Unknown (historical entry)"}</dd>
              <dt>Source</dt><dd>{latest.bodyFatSource ?? "Unknown (historical entry)"}</dd></div>
          )}
          <div>
            <dt>Recorded</dt>
            <dd>
              <time dateTime={latest.recordedAt}>
                {latest.recordedAt}
              </time>
            </dd>
          </div>
        </dl>
      )}

      <form className="performance-body-measurement-form"
        onSubmit={(event) => void saveMeasurement(event)}
        aria-label="Record body measurement">
        <h4>Record your body measurement</h4>
        <p>BMI is calculated from height and weight. It does not show muscle growth or where fat is stored.</p>
        <label htmlFor="body-height">Height (cm)</label>
        <input id="body-height" type="number" min="0.01" max="300"
          step="0.01" required value={heightCm}
          onChange={(event) => setHeightCm(event.target.value)} />
        <label htmlFor="body-weight">Weight (kg)</label>
        <input id="body-weight" type="number" min="0.001" max="1000"
          step="0.001" required value={weightKg}
          onChange={(event) => setWeightKg(event.target.value)} />
        <label htmlFor="body-fat">Body fat (%) — optional, measured value</label>
        <input id="body-fat" type="number" min="0" max="100"
          step="0.01" value={bodyFatPercentage}
          onChange={(event) => setBodyFatPercentage(event.target.value)} />
        {bodyFatPercentage.trim() !== "" && (
          <>
            <label htmlFor="body-fat-method">Body-fat measurement method</label>
            <select id="body-fat-method" required value={bodyFatMethod}
              onChange={(event) => setBodyFatMethod(event.target.value as BodyFatMethod | "")}>
              <option value="">Select method</option>
              <option value="BIOELECTRICAL_IMPEDANCE">Bioelectrical impedance (BIA)</option>
              <option value="DEXA">DEXA</option>
              <option value="SKINFOLD_CALIPER">Skinfold caliper</option>
              <option value="CLINICAL_ASSESSMENT">Clinical assessment</option>
            </select>
            <p>Source: Athlete reported. The selected method is not independently verified.</p>
          </>
        )}
        <button type="submit" disabled={savingMeasurement}>
          {savingMeasurement ? "Saving..." : "Save measurement"}
        </button>
        {measurementMessage && <p role="status">{measurementMessage}</p>}
      </form>

      <PerformanceBodyViewer
        modelType={profile.modelType}
        measurements={currentMeasurements}
        progressSnapshots={snapshots}
      />

      <p>
        This visualisation reflects explicitly supplied
        profile and measurement data. It is not a medical
        or diagnostic assessment.
      </p>
    </section>
  );
}
