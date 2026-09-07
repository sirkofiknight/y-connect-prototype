import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";

// Bundles this Express app (already `export default app`-shaped, see app.ts) into a
// single, dependency-free CommonJS file at the repo root's api/index.js, for Vercel
// to run as a serverless function. This project's Vercel "Root Directory" is left at
// the repo root (Vercel's zero-touch default on import — no dashboard setting to get
// wrong). A flat, pre-bundled file there means Vercel has nothing left to resolve or
// trace (no TypeScript, no ESM source, no pnpm workspace packages to figure out) —
// it's called from y-connect's own "build" script (which vercel.json's buildCommand
// invokes directly, targeted at just that package, rather than the repo root's
// generic recursive build script that would otherwise also try, and fail, to build
// unrelated packages). The output IS committed to git (not git-ignored) despite being
// generated: every serving path under /api, including the bare path with no rewrite
// involved, came back as the static index.html until this file existed in the actual
// repository — Vercel's function detection for this project reads the checked-out
// repo rather than the post-buildCommand filesystem. It's also explicitly declared
// under "functions" in vercel.json rather than left to convention-based detection,
// since that alone did not get it recognized either. Re-run this script and commit
// the result after any change to app.ts or anything it imports — the frontend build
// alone will not pick it up.
//
// The extension is .js, not .cjs: switched from .cjs (needed to dodge a real bug when
// this briefly lived under artifacts/y-connect, whose package.json has
// "type": "module" — a CommonJS bundle named .js there loads as an ES module and
// crashes with "module is not defined in ES module scope") back to .js now that the
// output lives at the repo root, whose package.json has no "type" field (so .js
// defaults to CommonJS, matching this bundle's `format: "cjs"` output) — plain .js is
// also the more conventional extension for Vercel's own function-file recognition.
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
  // Bake "production" in at build time instead of trusting Vercel to set NODE_ENV (or
  // VERCEL) the same way at runtime as it does at build time for a custom serverless
  // function — that assumption was already tried and didn't hold. This replaces every
  // `process.env.NODE_ENV` reference in the bundle with the literal string, so the
  // dev-only pino-pretty transport branch (which crashed the whole function on boot,
  // since its worker-thread file isn't in this single bundled file) is compiled out
  // entirely — there is no environment check left at runtime to get wrong.
  define: { "process.env.NODE_ENV": '"production"' },
});
