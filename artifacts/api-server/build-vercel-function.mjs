import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";

// Bundles this Express app (already `export default app`-shaped, see app.ts) into a
// single, dependency-free CommonJS file at api/index.js for Vercel to run as a
// serverless function. Vercel's automatic Node.js function detection has to resolve
// TypeScript, ESM source, and pnpm workspace packages together for a function file in
// this monorepo, which is a known trouble spot; shipping one flat, generated bundle
// sidesteps all of that — there is nothing left for Vercel to trace or resolve. The
// output is git-ignored and produced fresh by this build step on every deploy.
const artifactDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(artifactDir, "..", "..");

await esbuild({
  entryPoints: [path.resolve(artifactDir, "src/app.ts")],
  platform: "node",
  bundle: true,
  format: "cjs",
  outfile: path.resolve(repoRoot, "api/index.js"),
  logLevel: "info",
  external: ["*.node"],
});
