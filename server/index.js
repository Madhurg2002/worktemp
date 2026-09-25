import express from "express";
import { existsSync } from "node:fs";
import { apiRoutes } from "./routes.js";

const app = express();
app.disable("x-powered-by");
app.use(express.json());

app.use("/api", apiRoutes);

// Single-port mode: when a frontend build exists, serve it from this same
// server (used by `npm start` / hosted previews). During `npm run dev` the
// Vite dev server serves the UI instead and proxies /api here.
const distDir = new URL("../dist", import.meta.url).pathname;
if (existsSync(distDir)) {
  app.use(express.static(distDir));
  // No-path fallback middleware (Express 5 removed the "*" route string).
  app.use((_req, res) => {
    res.sendFile(new URL("../dist/index.html", import.meta.url).pathname);
  });
}

// Malformed JSON bodies land here via express.json's error callback.
app.use((err, _req, res, _next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ errors: ["Request body is not valid JSON."] });
  }
  console.error(err);
  res.status(500).json({ errors: ["Internal server error."] });
});

// Precedence: PORT (injected by hosting previews), then API_PORT (dev default
// for the API in `npm run dev`), then 3001.
const port = process.env.PORT || process.env.API_PORT || 3001;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on http://0.0.0.0:${port}`);
});
