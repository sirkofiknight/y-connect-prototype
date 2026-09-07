import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";

// Bundles this Express app (already `export default app`-shaped, see app.ts) into a
// single, dependency-free CommonJS file at artifacts/y-connect/api/index.cjs, for
// Vercel to run as a serverless function. Vercel's Root Directory for this project is
// artifacts/y-connect, so that's where its automatic function detection looks; a
// flat, pre-bundled file there means Vercel has nothing left to resolve or trace
// (no TypeScript, no ESM source, no pnpm workspace packages to figure out) — it's
// called from y-connect's own "build" script, and the output is git-ignored.
//
// The extension MUST be .cjs, not .js: y-connect's package.json has "type": "module",
// so Node (and Vercel's Node runtime) would otherwise interpret this CommonJS bundle
// (esbuild's `format: "cjs"` output, using `module.exports`) as ES module source and
// fail with "module is not defined in ES module scope" — confirmed by hitting exactly
// that error when this was still named index.js, before switching the extension.
const artifactDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(artifactDir, "..", "..");

await esbuild({
  entryPoints: [path.resolve(artifactDir, "src/app.ts")],
  platform: "node",
  bundle: true,
  format: "cjs",
  outfile: path.resolve(repoRoot, "artifacts/y-connect/api/index.cjs"),
  logLevel: "info",
  external: ["*.node"],
});
