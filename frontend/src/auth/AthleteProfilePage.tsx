import { type FormEvent, useEffect, useState } from "react";
import {
  getMyPersonalDetails,
  updateMyPersonalDetails,
  type PersonalDetailsUpdate,
} from "./athlete-profile.api";

export default function AthleteProfilePage() {
  const [form, setForm] = useState<PersonalDetailsUpdate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let mounted = true;
    void getMyPersonalDetails().then((details) => {
      if (mounted) setForm({
        firstName: details.firstName,
        lastName: details.lastName,
        email: details.email,
        contactNumber: details.contactNumber,
        countryCode: details.countryCode ?? "",
        dateOfBirth: details.dateOfBirth?.slice(0, 10) ?? null,
      });
    }).catch(() => {
      if (mounted) setError("Unable to load your profile.");
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  function setField<K extends keyof PersonalDetailsUpdate>(
    key: K, value: PersonalDetailsUpdate[K],
  ) {
    setForm((current) => current ? { ...current, [key]: value } : null);
    setSaved(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form || saving) return;
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await updateMyPersonalDetails(form);
      setSaved(true);
    } catch {
      setError("Unable to save your profile. Check the details and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="titan-panel titan-athlete-profile">
      <span className="titan-eyebrow">YOUR ACCOUNT</span>
      <h2>My Athlete profile</h2>
      {loading && <p role="status">Loading your profile...</p>}
      {error && <p role="alert">{error}</p>}
      {form && <form onSubmit={(event) => void submit(event)}>
        <label>First name<input required value={form.firstName} onChange={(e) => setField("firstName", e.target.value)} /></label>
        <label>Last name<input required value={form.lastName} onChange={(e) => setField("lastName", e.target.value)} /></label>
        <label>Email<input required type="email" autoComplete="email" value={form.email} onChange={(e) => setField("email", e.target.value)} /></label>
        <label>Contact number<input type="tel" value={form.contactNumber ?? ""} onChange={(e) => setField("contactNumber", e.target.value || null)} /></label>
        <label>Country code<input required maxLength={2} value={form.countryCode} onChange={(e) => setField("countryCode", e.target.value.toUpperCase())} /></label>
        <label>Date of birth<input type="date" value={form.dateOfBirth ?? ""} onChange={(e) => setField("dateOfBirth", e.target.value || null)} /></label>
        <button type="submit" disabled={saving}>{saving ? "Saving..." : "Save profile"}</button>
      </form>}
      {saved && <p role="status">Profile saved.</p>}
    </section>
  );
}
