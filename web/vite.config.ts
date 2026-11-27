import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cpSync } from "node:fs";
import { resolve } from "node:path";

// The older pages the new site still links to (Pocket Wilds), copied from the repo root as they are.
const LEGACY = ["pocket-wilds"];

// Each page is its own entry: index.html (home) and portfolio.html.
// base "./" keeps every link relative, so the built site works from any folder.
export default defineConfig({
  base: "./",
  plugins: [
    react(),
    {
      name: "copy-legacy-pages",
      apply: "build",
      closeBundle() {
        for (const p of LEGACY) cpSync(resolve(__dirname, "..", p), resolve(__dirname, "dist", p), { recursive: true });
      },
    },
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    assetsDir: "static", // keeps Vite's bundles apart from the older pages' assets/ folder
    rollupOptions: { input: { home: resolve(__dirname, "index.html"), portfolio: resolve(__dirname, "portfolio.html"), world: resolve(__dirname, "world.html") } },
  },
});
