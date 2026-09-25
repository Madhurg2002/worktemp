const FIELDS = [
  {
    name: "displayName",
    label: "Display name",
    type: "text",
    required: true,
    maxLength: 40,
    hint: "1–40 characters",
  },
  {
    name: "bio",
    label: "Bio",
    type: "textarea",
    maxLength: 160,
    hint: "Up to 160 characters (optional)",
  },
  {
    name: "linkLabel",
    label: "Link label",
    type: "text",
    required: true,
    maxLength: 30,
    hint: "1–30 characters",
  },
  {
    name: "linkUrl",
    label: "Link URL",
    type: "url",
    required: true,
    hint: "Must be an https:// URL",
  },
];

const inputClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200";

export default function ProfileForm({ form, setField, onSubmit, saving }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4" aria-label="Profile editor">
      {FIELDS.map((f) => (
        <div key={f.name}>
          <label
            htmlFor={f.name}
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            {f.label}
          </label>
          {f.type === "textarea" ? (
            <textarea
              id={f.name}
              value={form[f.name]}
              onChange={setField(f.name)}
              rows={3}
              maxLength={f.maxLength}
              className={inputClass}
            />
          ) : (
            <input
              id={f.name}
              type={f.type}
              value={form[f.name]}
              onChange={setField(f.name)}
              required={f.required}
              maxLength={f.maxLength}
              className={inputClass}
            />
          )}
          <p className="mt-1 text-xs text-neutral-400">{f.hint}</p>
        </div>
      ))}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
