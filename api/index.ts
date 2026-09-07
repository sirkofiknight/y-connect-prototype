// Vercel serverless entry point: re-exports the existing Express app so the whole
// API runs as a single function. Vercel invokes exported Express apps directly as
// request handlers. `vercel.json` rewrites every /api/* request here, and Vercel's
// Node runtime preserves the original request path, so Express's own
// `app.use("/api", router)` routing still works unmodified.
//
// Caveat: unlike the persistent process this app also supports (`npm run dev`,
// Render, etc.), a Vercel serverless function has no guaranteed single instance —
// concurrent or cold-started requests may land on different instances, each with
// its own copy of the in-memory demo data. Reads/writes made in one request are not
// guaranteed to be visible in another. That's an accepted trade-off for this
// prototype rather than standing up a real database.
import app from "../artifacts/api-server/src/app";

export default app;
