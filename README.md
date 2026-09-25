# misa.lol — mini profile editor (trial exercise)

One fictional profile, one editor, one live preview. React + Tailwind frontend, Express backend, shared validation module.

## Stack

- **Frontend:** React 19 + Vite + Tailwind CSS v4 (plain JSX, no other UI libs)
- **Backend:** Node.js + Express, in-memory storage (per the exercise, restarts may lose data)
- **Runtime:** Node.js **>= 22** (verified on 22.x)

## Install & run

```bash
npm install        # or: bun install
npm run dev        # runs API on :3001 + Vite dev server (proxies /api)
```

Open the printed Vite URL (default http://localhost:5173).

Production-style build: `npm run build` (outputs `dist/`), then serve it with any static server that proxies `/api` to `node server/index.js`.

## Backend contract

| Request | Behavior |
|---|---|
| `GET /api/profile` | `200` with the current profile |
| `PUT /api/profile` | Validates the complete profile, saves it, returns `200` with the saved (trimmed) profile |
| Invalid update | `400` with `{ "errors": string[] }`; stored profile untouched |

Error shape: `{ "errors": ["human-readable message", ...] }` — one entry per violated rule, so the UI can show all problems at once.

Validation is enforced **only on the server** (`shared/validation.js`, imported by `server/routes.js`); the client imports the same module for early, friendly errors, but the server never trusts the client. Rules: all four values strings; trimmed lengths for display name 1–40, bio 0–160, link label 1–30; link URL must parse as an absolute `https://` URL with a hostname (`http:`, `javascript:`, `data:`, etc. rejected). Malformed JSON returns `400` instead of crashing.

## What I verified

`npm test` runs `server/verify.mjs`, which boots the API on a scratch port and checks: starting `GET`, a valid `PUT` (values saved trimmed), empty-bio acceptance, 11 invalid-update cases (missing field, wrong types, blank/over-length values, `http:`/`javascript:`/`data:` URLs, garbage URLs), malformed JSON → `400`, and finally a `GET` proving every rejected update left the stored profile unchanged.

Manual browser check: edit fields → preview updates as you type → Save shows "Saving…", button disabled while pending, "Saved." appears only after the server's `200` → refresh the browser → the saved profile loads from the backend. A failed save (e.g. stop the API server, save, restart it) keeps the form entries on screen for retry.

## Tradeoff & first production improvement

**Tradeoff:** one shared validation module for client and server. It guarantees the two never disagree, but couples them into one repo/build — fine for this exercise; separate services would need the rules duplicated or published as a package.

**First improvement for production:** persistence + concurrency — swap the in-memory object for a real datastore with per-user records and optimistic locking, so saves from two tabs can't silently clobber each other (and data survives restarts).

## Tools used

No starter code or templates beyond the libraries listed in the stack; all behaviors above were verified by running `server/verify.mjs` and the manual browser flow described.
