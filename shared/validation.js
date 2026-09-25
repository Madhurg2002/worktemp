// Shared validation for the profile editor, used by the server (authoritative)
// and the client (early, friendly errors). Rules come from task.md.

export const LIMITS = {
  displayName: { min: 1, max: 40 },
  bio: { min: 0, max: 160 },
  linkLabel: { min: 1, max: 30 },
};

// The exact profile shape the API accepts/returns.
export function normalizeProfile(body) {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { error: "Request body must be a JSON object." };
  }
  const { displayName, bio, link } = body;
  if (
    typeof displayName !== "string" ||
    typeof bio !== "string" ||
    typeof link !== "object" ||
    link === null ||
    Array.isArray(link) ||
    typeof link.label !== "string" ||
    typeof link.url !== "string"
  ) {
    return {
      error:
        "All four values must be strings: displayName, bio, link.label, link.url.",
    };
  }
  // Trim once; every rule below checks trimmed values and we save trimmed values.
  return {
    profile: {
      displayName: displayName.trim(),
      bio: bio.trim(),
      link: { label: link.label.trim(), url: link.url.trim() },
    },
  };
}

// Returns { ok: true } or { ok: false, errors: string[] } for a trimmed profile.
export function validateProfile(profile) {
  const errors = [];
  const { displayName, bio, link } = profile;
  const { displayName: dn, bio: b, linkLabel: ll } = LIMITS;

  if (displayName.length < dn.min || displayName.length > dn.max) {
    errors.push(
      `Display name must be ${dn.min}-${dn.max} characters (got ${displayName.length}).`,
    );
  }
  if (bio.length < b.min || bio.length > b.max) {
    errors.push(`Bio must be at most ${b.max} characters (got ${bio.length}).`);
  }
  if (link.label.length < ll.min || link.label.length > ll.max) {
    errors.push(
      `Link label must be ${ll.min}-${ll.max} characters (got ${link.label.length}).`,
    );
  }

  let parsed = null;
  try {
    parsed = new URL(link.url);
  } catch {
    errors.push("Link URL must be a valid absolute URL (e.g. https://example.com).");
  }
  if (parsed) {
    // protocol "https:" is enforced; URL parsing guarantees a non-empty hostname
    // unless someone sneaks one in via whitespace inside the string, so check it.
    if (parsed.protocol !== "https:") {
      errors.push("Link URL must use the https:// scheme.");
    } else if (!parsed.hostname) {
      errors.push("Link URL must include a hostname.");
    }
  }

  return errors.length ? { ok: false, errors } : { ok: true };
}
