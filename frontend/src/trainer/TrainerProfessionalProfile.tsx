import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import {
  getMyTrainerProfile,
  updateMyTrainerProfile,
} from "./trainer-profile.api";

interface TrainerProfileForm {
  professionalTitle: string;
  bio: string;
  qualifications: string;
  specialisations: string;
  yearsExperience: string;
  countryCode: string;
  websiteUrl: string;
}

const emptyProfile: TrainerProfileForm = {
  professionalTitle: "",
  bio: "",
  qualifications: "",
  specialisations: "",
  yearsExperience: "",
  countryCode: "",
  websiteUrl: "",
};

function nullable(
  value: string,
): string | null {
  const trimmed = value.trim();

  return trimmed.length > 0
    ? trimmed
    : null;
}

export default function TrainerProfessionalProfile() {
  const [form, setForm] =
    useState<TrainerProfileForm>(emptyProfile);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [loadError, setLoadError] =
    useState(false);

  const [saveError, setSaveError] =
    useState<string | null>(null);

  const [saved, setSaved] =
    useState(false);

  useEffect(() => {
    let mounted = true;

    void getMyTrainerProfile()
      .then((profile) => {
        if (!mounted || !profile) {
          return;
        }

        setForm({
          professionalTitle:
            profile.professionalTitle ?? "",
          bio:
            profile.bio ?? "",
          qualifications:
            profile.qualifications ?? "",
          specialisations:
            profile.specialisations ?? "",
          yearsExperience:
            profile.yearsExperience === null
              ? ""
              : String(profile.yearsExperience),
          countryCode:
            profile.countryCode ?? "",
          websiteUrl:
            profile.websiteUrl ?? "",
        });
      })
      .catch(() => {
        if (mounted) {
          setLoadError(true);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  function updateField(
    field: keyof TrainerProfileForm,
    value: string,
  ) {
    setSaved(false);
    setSaveError(null);

    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSaving(true);
    setSaved(false);
    setSaveError(null);

    const yearsExperience =
      form.yearsExperience.trim() === ""
        ? null
        : Number(form.yearsExperience);

    if (
      yearsExperience !== null &&
      (
        !Number.isInteger(yearsExperience) ||
        yearsExperience < 0 ||
        yearsExperience > 100
      )
    ) {
      setSaveError(
        "Years of experience must be a whole number between 0 and 100.",
      );
      setSaving(false);
      return;
    }

    try {
      const profile =
        await updateMyTrainerProfile({
          professionalTitle:
            nullable(form.professionalTitle),
          bio:
            nullable(form.bio),
          qualifications:
            nullable(form.qualifications),
          specialisations:
            nullable(form.specialisations),
          yearsExperience,
          countryCode:
            nullable(form.countryCode),
          websiteUrl:
            nullable(form.websiteUrl),
        });

      setForm({
        professionalTitle:
          profile.professionalTitle ?? "",
        bio:
          profile.bio ?? "",
        qualifications:
          profile.qualifications ?? "",
        specialisations:
          profile.specialisations ?? "",
        yearsExperience:
          profile.yearsExperience === null
            ? ""
            : String(profile.yearsExperience),
        countryCode:
          profile.countryCode ?? "",
        websiteUrl:
          profile.websiteUrl ?? "",
      });

      setSaved(true);
    }
    catch {
      setSaveError(
        "Your professional profile could not be saved.",
      );
    }
    finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section
        className="titan-panel"
        aria-label="Professional profile"
      >
        <h2>Professional profile</h2>
        <p role="status">
          Loading your professional profile...
        </p>
      </section>
    );
  }

  if (loadError) {
    return (
      <section
        className="titan-panel"
        aria-label="Professional profile"
      >
        <h2>Professional profile</h2>
        <p role="alert">
          Your professional profile is temporarily
          unavailable.
        </p>
      </section>
    );
  }

  return (
    <section
      className="titan-panel titan-trainer-profile"
      aria-label="Professional profile"
    >
      <span className="titan-eyebrow">
        PROFESSIONAL IDENTITY
      </span>

      <h2>Professional profile</h2>

      <p>
        Build the professional identity your clients
        will associate with your coaching.
      </p>

      <form onSubmit={submit}>
        <div className="titan-form-grid">
          <label>
            Professional title
            <input
              name="professionalTitle"
              maxLength={120}
              value={form.professionalTitle}
              onChange={(event) =>
                updateField(
                  "professionalTitle",
                  event.target.value,
                )
              }
              placeholder="Performance Coach"
            />
          </label>

          <label>
            Years of experience
            <input
              name="yearsExperience"
              type="number"
              min="0"
              max="100"
              step="1"
              value={form.yearsExperience}
              onChange={(event) =>
                updateField(
                  "yearsExperience",
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            Country code
            <input
              name="countryCode"
              maxLength={2}
              value={form.countryCode}
              onChange={(event) =>
                updateField(
                  "countryCode",
                  event.target.value.toUpperCase(),
                )
              }
              placeholder="ZA"
            />
          </label>

          <label>
            Website
            <input
              name="websiteUrl"
              type="url"
              maxLength={500}
              value={form.websiteUrl}
              onChange={(event) =>
                updateField(
                  "websiteUrl",
                  event.target.value,
                )
              }
              placeholder="https://example.com"
            />
          </label>
        </div>

        <label>
          Professional bio
          <textarea
            name="bio"
            maxLength={2000}
            rows={5}
            value={form.bio}
            onChange={(event) =>
              updateField(
                "bio",
                event.target.value,
              )
            }
            placeholder="Tell clients about your coaching background and approach."
          />
        </label>

        <label>
          Qualifications
          <textarea
            name="qualifications"
            maxLength={2000}
            rows={4}
            value={form.qualifications}
            onChange={(event) =>
              updateField(
                "qualifications",
                event.target.value,
              )
            }
            placeholder="Professional qualifications and certifications"
          />
        </label>

        <label>
          Specialisations
          <textarea
            name="specialisations"
            maxLength={1000}
            rows={3}
            value={form.specialisations}
            onChange={(event) =>
              updateField(
                "specialisations",
                event.target.value,
              )
            }
            placeholder="Strength, conditioning, endurance..."
          />
        </label>

        {saveError && (
          <p role="alert">
            {saveError}
          </p>
        )}

        {saved && (
          <p role="status">
            Professional profile saved.
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
        >
          {saving
            ? "Saving..."
            : "Save professional profile"}
        </button>
      </form>
    </section>
  );
}
