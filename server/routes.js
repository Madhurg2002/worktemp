import { Router } from "express";
import { normalizeProfile, validateProfile } from "../shared/validation.js";

// In-memory storage is sufficient per the exercise; restarts may lose data.
const profile = {
  displayName: "Nova",
  bio: "Music, late nights, and things I make.",
  link: { label: "My website", url: "https://example.com" },
};

export const apiRoutes = Router();

apiRoutes.get("/profile", (_req, res) => {
  res.json(profile);
});

apiRoutes.put("/profile", (req, res) => {
  const normalized = normalizeProfile(req.body);
  if (normalized.error) {
    return res.status(400).json({ errors: [normalized.error] });
  }
  const verdict = validateProfile(normalized.profile);
  if (!verdict.ok) {
    // Nothing has been written yet, so the stored profile is untouched.
    return res.status(400).json({ errors: verdict.errors });
  }
  Object.assign(profile, normalized.profile);
  res.json(profile);
});
