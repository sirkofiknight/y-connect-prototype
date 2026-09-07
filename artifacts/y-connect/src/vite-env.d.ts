/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Absolute URL of the API server, only needed when it's hosted on a different origin than this app (e.g. Vercel + Render). */
  readonly VITE_API_BASE_URL?: string;
}
