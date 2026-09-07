import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

// PORT/BASE_PATH only matter for `vite dev`/`vite preview` (serving the app under a
// path prefix behind Replit's proxy, or locally). A production `vite build` (e.g. on
// Vercel, which serves the app at the domain root and never sets these) doesn't need
// either, so only require them for the serve commands rather than failing every build.
export default defineConfig(async ({ command }) => {
  const basePath = process.env.BASE_PATH ?? '/';

  let port: number | undefined;
  if (command === 'serve') {
    const rawPort = process.env.PORT;
    if (!rawPort) {
      throw new Error(
        'PORT environment variable is required but was not provided.',
      );
    }
    port = Number(rawPort);
    if (Number.isNaN(port) || port <= 0) {
      throw new Error(`Invalid PORT value: "${rawPort}"`);
    }
  }

  return {
    base: basePath,
    plugins: [
      react(),
      tailwindcss(),
      runtimeErrorOverlay(),
      ...(process.env.NODE_ENV !== 'production' &&
      process.env.REPL_ID !== undefined
        ? [
            await import('@replit/vite-plugin-cartographer').then((m) =>
              m.cartographer({
                root: path.resolve(import.meta.dirname, '..'),
              }),
            ),
            await import('@replit/vite-plugin-dev-banner').then((m) =>
              m.devBanner(),
            ),
          ]
        : []),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, 'src'),
        '@assets': path.resolve(
          import.meta.dirname,
          '..',
          '..',
          'attached_assets',
        ),
      },
      dedupe: ['react', 'react-dom'],
    },
    root: path.resolve(import.meta.dirname),
    build: {
      outDir: path.resolve(import.meta.dirname, 'dist/public'),
      emptyOutDir: true,
    },
    server: {
      port,
      strictPort: true,
      host: '0.0.0.0',
      allowedHosts: true,
      fs: {
        strict: true,
      },
      // Local `vite dev` only: Replit's own router proxies /api in the hosted workspace,
      // but this lets `node scripts/dev.mjs` (the root `npm run dev`) work against a
      // locally running api-server outside of Replit. Defaults to the port that
      // orchestrator starts the api-server on.
      proxy: {
        '/api': {
          target: process.env.API_PROXY_TARGET ?? 'http://localhost:8090',
          changeOrigin: true,
        },
      },
    },
    preview: {
      port,
      host: '0.0.0.0',
      allowedHosts: true,
    },
  };
});
