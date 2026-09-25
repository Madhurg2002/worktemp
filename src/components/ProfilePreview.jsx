// Renders the profile card. All text is interpolated as plain text (React
// escapes it), and the URL is only linkified when it parses as an absolute
// https:// URL with a hostname, so invalid URLs can never become clickable.
export default function ProfilePreview({ displayName, bio, linkLabel, linkUrl }) {
  const link = safeLink(linkUrl);

  return (
    <div
      aria-label="Profile preview"
      className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
        Preview
      </p>
      <div className="mt-4">
        <h2 className="text-xl font-semibold text-neutral-900">
          {displayName.trim() || "Your name"}
        </h2>
        {bio.trim() !== "" && (
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">{bio}</p>
        )}
        {link && (
          <a
            href={link.href}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-4 inline-block rounded-full border border-neutral-300 px-4 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-100"
          >
            {linkLabel.trim() || link.href}
          </a>
        )}
      </div>
    </div>
  );
}

// Returns { href } for a safe link, or null when the URL is not a valid
// absolute https:// URL with a hostname.
function safeLink(url) {
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== "https:" || !parsed.hostname) return null;
    return { href: parsed.href };
  } catch {
    return null;
  }
}
