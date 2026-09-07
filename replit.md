# Y-Connect prototype

Y-Connect is a discreet, synthetic-data support navigator for young people and the staff teams coordinating care.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080 in this workspace)
- `pnpm --filter @workspace/y-connect run dev` — run the Y-Connect web app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- Web production build: `PORT=23825 BASE_PATH=/y-connect/ pnpm --filter @workspace/y-connect run build`
- The current prototype uses in-memory synthetic API data; no real person or service data is loaded.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- Persistence: in-memory synthetic collections for the prototype
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/y-connect/` — public learning, self-check, directory, support, safeguarding, staff dashboards, and PWA shell
- `artifacts/api-server/src/routes/yconnect.ts` — synthetic API data, role permissions, deterministic scoring, mutations, and audit entries
- `lib/api-spec/openapi.yaml` — source of truth for the generated Y-Connect client and Zod types
- `artifacts/y-connect/src/index.css` — Y-Connect visual tokens and responsive styles

## Architecture decisions

- The fixed PHP/MySQL specification is adapted to the existing pnpm React/Express workspace so the prototype can run in Replit.
- Public flows are usable without an account; staff routes use a synthetic cookie session and role permissions.
- Self-assessment is deterministic and explicitly framed as a reflection tool, not a diagnosis or HIV test.
- All current records are synthetic and in memory; durable PostgreSQL/Drizzle persistence is intentionally deferred.
- Mutating API handlers append audit entries so operational changes remain reviewable in the prototype.

## Product

Public users can read discreet health resources, complete a deterministic self-check, browse synthetic service points, request a human connection, submit a safeguarding concern, and read plain-language rights information. Staff can sign in to role-aware dashboards for cases, follow-ups, referrals, EID milestones, requests, safeguarding, reports, audit history, and synthetic staff access.

## User preferences

- Use synthetic data only in this prototype.
- Keep wording discreet and include clear non-diagnosis language around self-assessment.

## Gotchas

- API routes mount under `/api` and generated hooks in `@workspace/api-client-react` should be regenerated after OpenAPI changes.
- The web build requires `PORT` and `BASE_PATH` because the artifact is proxied by path.
- Refresh the API workflow after changing server code; the web workflow hot-reloads frontend changes.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
