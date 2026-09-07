import pino from "pino";

// `VERCEL` is set by Vercel itself on every deployment (preview and production alike);
// `NODE_ENV` is not reliably set to "production" for a custom serverless function the
// way it is for frameworks Vercel builds itself, so checking only NODE_ENV left this
// on in deployment, where pino-pretty's worker-thread transport isn't available in the
// single bundled function file and crashes the whole app before it can serve anything.
const isProduction = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']",
  ],
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }),
});
