#!/usr/bin/env node
// Local dev orchestrator: starts the api-server and the y-connect web app together,
// wired to each other, so `pnpm dev` / `npm run dev` from the repo root just works
// outside of Replit (where a hosted router normally does this wiring for you).
//
// Deliberately dependency-free (plain Node, no pnpm/tsx child calls) so it can't
// fail because of PATH/shim quirks across shells (cmd, PowerShell, Git Bash).
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apiDir = path.join(root, "artifacts", "api-server");
const webDir = path.join(root, "artifacts", "y-connect");

const API_PORT = process.env.API_PORT ?? "8090";
const WEB_PORT = process.env.WEB_PORT ?? "5173";

const children = [];
let shuttingDown = false;

function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) child.kill();
  process.exit(code);
}

function prefixLines(name, chunk, stream) {
  const label = `[${name}]`;
  for (const line of chunk.toString("utf8").split(/\r?\n/)) {
    if (line.length > 0) stream.write(`${label} ${line}\n`);
  }
}

function run(name, command, args, options) {
  const child = spawn(command, args, options);
  children.push(child);
  child.stdout?.on("data", (chunk) => prefixLines(name, chunk, process.stdout));
  child.stderr?.on("data", (chunk) => prefixLines(name, chunk, process.stderr));
  return child;
}

// Prepend a package's own node_modules/.bin so a bare command name (e.g. "vite")
// resolves to its locally installed binary the same way `pnpm run <script>` does.
// `shell: true` is required here so Windows' cmd.exe applies PATHEXT and finds
// the generated `vite.cmd` shim; the plain `node ...` calls below don't need it.
function withLocalBin(cwd, extraEnv) {
  const bin = path.join(cwd, "node_modules", ".bin");
  return { cwd, shell: true, env: { ...process.env, ...extraEnv, PATH: `${bin}${path.delimiter}${process.env.PATH ?? ""}` } };
}

console.log(`Starting api-server on port ${API_PORT} and y-connect on port ${WEB_PORT}...`);

const build = run("api:build", "node", ["build.mjs"], { cwd: apiDir });
build.on("exit", (code) => {
  if (code !== 0) {
    console.error(`[api:build] failed with code ${code}`);
    shutdown(code ?? 1);
    return;
  }

  const api = run("api", "node", ["--enable-source-maps", "dist/index.mjs"], {
    cwd: apiDir,
    env: { ...process.env, PORT: API_PORT, NODE_ENV: "development" },
  });
  api.on("exit", (exitCode) => { if (!shuttingDown) { console.error(`[api] exited with code ${exitCode}`); shutdown(exitCode ?? 1); } });

  // A single string (not an args array) avoids Node's shell+args deprecation warning.
  const web = run("web", "vite --config vite.config.ts --host 0.0.0.0", [], withLocalBin(webDir, {
    PORT: WEB_PORT,
    BASE_PATH: "/",
    API_PROXY_TARGET: `http://localhost:${API_PORT}`,
  }));
  web.on("exit", (exitCode) => { if (!shuttingDown) { console.error(`[web] exited with code ${exitCode}`); shutdown(exitCode ?? 1); } });

  console.log(`Once both are ready, open http://localhost:${WEB_PORT}`);
});

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
