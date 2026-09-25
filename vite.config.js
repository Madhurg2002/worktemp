import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const apiPort = process.env.API_PORT || 3001;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: Number(process.env.PORT) || 5173,
    // Forward /api requests to the Express server during development.
    proxy: {
      "/api": `http://localhost:${apiPort}`,
    },
  },
});
