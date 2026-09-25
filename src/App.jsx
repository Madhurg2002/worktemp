import { useEffect, useState } from "react";
import ProfileForm from "./components/ProfileForm.jsx";
import ProfilePreview from "./components/ProfilePreview.jsx";

const EMPTY_FORM = {
  displayName: "",
  bio: "",
  linkLabel: "",
  linkUrl: "",
};

function profileToForm(p) {
  return {
    displayName: p.displayName,
    bio: p.bio,
    linkLabel: p.link.label,
    linkUrl: p.link.url,
  };
}

export default function App() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);
  const [notice, setNotice] = useState("");

  // Requirement 1: load the saved profile from the backend on mount.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/profile")
      .then((res) => {
        if (!res.ok) throw new Error(`Load failed (${res.status})`);
        return res.json();
      })
      .then((profile) => {
        if (!cancelled) setForm(profileToForm(profile));
      })
      .catch((err) => {
        if (!cancelled) setErrors([`Could not load profile: ${err.message}`]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setField = (name) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // Requirement 3: one save in flight at a time; success shows only after the
  // server responds 200 with the saved profile.
  async function handleSave(e) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setErrors([]);
    setNotice("");
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: form.displayName,
          bio: form.bio,
          link: { label: form.linkLabel, url: form.linkUrl },
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data && data.errors ? data.errors.join(" ") : `Save failed (${res.status})`);
      }
      setForm(profileToForm(data)); // server-confirmed, trimmed values
      setNotice("Saved.");
    } catch (err) {
      // Requirement 5: a failed save keeps every form entry untouched.
      setErrors([`Save failed: ${err.message}`]);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen grid place-items-center text-neutral-500">
        Loading profile…
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-100 text-neutral-900">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <header className="mb-8">
          <p className="text-sm font-medium tracking-wide text-neutral-500 uppercase">
            misa.lol · trial exercise
          </p>
          <h1 className="mt-1 text-2xl font-semibold">Mini profile editor</h1>
        </header>

        {errors.length > 0 && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <ul className="list-disc space-y-1 pl-4">
              {errors.map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
          </div>
        )}
        {notice && (
          <p
            role="status"
            className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
          >
            {notice}
          </p>
        )}

        <div className="grid gap-8 md:grid-cols-2">
          <ProfileForm
            form={form}
            setField={setField}
            onSubmit={handleSave}
            saving={saving}
          />
          <ProfilePreview
            displayName={form.displayName}
            bio={form.bio}
            linkLabel={form.linkLabel}
            linkUrl={form.linkUrl}
          />
        </div>
      </div>
    </main>
  );
}
