// Reproducible backend-contract check from task.md. Boots the API server on a
// scratch port, runs the contract checks, and prints PASS/FAIL per check.
// Run with: npm test  (or: bun run test)

import { spawn } from "node:child_process";

const PORT = 3100;
const BASE = `http://localhost:${PORT}/api/profile`;
const PUT = { "Content-Type": "application/json" };

const server = spawn(process.execPath, ["server/index.js"], {
  // Pin both PORT and API_PORT so the precedence in server/index.js is
  // deterministic even when the outer environment injects its own PORT.
  env: { ...process.env, PORT: String(PORT), API_PORT: String(PORT) },
  stdio: "ignore",
});

async function waitForServer() {
  for (let i = 0; i < 50; i++) {
    try {
      await fetch(BASE);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  throw new Error("Server did not start");
}

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

const validProfile = {
  displayName: "Nova",
  bio: "Music, late nights, and things I make.",
  link: { label: "My website", url: "https://example.com" },
};

try {
  await waitForServer();

  // 1. GET returns the starting profile.
  let res = await fetch(BASE);
  let body = await res.json();
  check(
    "GET /api/profile → 200 with starting data",
    res.status === 200 && body.displayName === "Nova",
    `status ${res.status}`,
  );

  // 2. Valid PUT is saved (and trimmed).
  res = await fetch(BASE, {
    method: "PUT",
    headers: PUT,
    body: JSON.stringify({
      displayName: "  Orion  ",
      bio: "  padded bio  ",
      link: { label: "  Blog  ", url: "  https://orion.dev/post  " },
    }),
  });
  body = await res.json();
  check(
    "Valid PUT → 200, saved trimmed",
    res.status === 200 &&
      body.displayName === "Orion" &&
      body.bio === "padded bio" &&
      body.link.label === "Blog" &&
      body.link.url === "https://orion.dev/post",
    JSON.stringify(body),
  );

  // 3. Empty bio is allowed.
  res = await fetch(BASE, {
    method: "PUT",
    headers: PUT,
    body: JSON.stringify({
      ...validProfile,
      bio: "",
      displayName: "Orion",
    }),
  });
  check(
    "PUT with empty bio → 200 (bio optional)",
    res.status === 200 && (await res.json()).bio === "",
  );
  // restore a non-empty bio for the rest of the run
  await fetch(BASE, {
    method: "PUT",
    headers: PUT,
    body: JSON.stringify(validProfile),
  });

  // 4. Invalid updates → 400 with error info, several rule violations.
  const invalidCases = [
    ["missing bio", { displayName: "X", link: { label: "L", url: "https://a.com" } }],
    ["non-string displayName", { ...validProfile, displayName: 42 }],
    ["blank displayName (trims to 0)", { ...validProfile, displayName: "   " }],
    ["displayName too long", { ...validProfile, displayName: "x".repeat(41) }],
    ["bio too long", { ...validProfile, bio: "x".repeat(161) }],
    ["link label too long", { ...validProfile, link: { ...validProfile.link, label: "x".repeat(31) } }],
    ["http:// URL", { ...validProfile, link: { ...validProfile.link, url: "http://example.com" } }],
    ["javascript: URL", { ...validProfile, link: { ...validProfile.link, url: "javascript:alert(1)" } }],
    ["data: URL", { ...validProfile, link: { ...validProfile.link, url: "data:text/html,hi" } }],
    ["not a URL at all", { ...validProfile, link: { ...validProfile.link, url: "not a url" } }],
    ["https:// but no hostname", { ...validProfile, link: { ...validProfile.link, url: "https://" } }],
  ];
  for (const [name, payload] of invalidCases) {
    res = await fetch(BASE, {
      method: "PUT",
      headers: PUT,
      body: JSON.stringify(payload),
    });
    body = await res.json().catch(() => null);
    check(
      `PUT invalid (${name}) → 400 + errors[]`,
      res.status === 400 && Array.isArray(body?.errors) && body.errors.length > 0,
      `status ${res.status}`,
    );
  }

  // 5. Malformed JSON is a 400, not a crash.
  res = await fetch(BASE, {
    method: "PUT",
    headers: PUT,
    body: "{oops not json",
  });
  body = await res.json().catch(() => null);
  check(
    "PUT malformed JSON → 400",
    res.status === 400 && Array.isArray(body?.errors),
    `status ${res.status}`,
  );

  // 6. The stored profile is unchanged after all the rejected PUTs.
  res = await fetch(BASE);
  body = await res.json();
  check(
    "Rejected updates left stored profile unchanged",
    body.displayName === validProfile.displayName &&
      body.bio === validProfile.bio &&
      body.link.url === validProfile.link.url,
    JSON.stringify(body),
  );

  // 7. Server still healthy after the malformed body.
  res = await fetch(BASE);
  check("Server still responds after malformed JSON", res.status === 200);
} catch (err) {
  check("Test run completed", false, String(err));
} finally {
  server.kill();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
