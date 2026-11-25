import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Local dev/preview middleware that mounts the serverless `/api/chat` handler
 * so AI assistant requests work identically in local development and preview.
 */
function localApiPlugin(env: Record<string, string>): Plugin {
  const mountMiddleware = (middlewares: {
    use: (
      path: string,
      handler: (
        req: import('node:http').IncomingMessage,
        res: import('node:http').ServerResponse,
        next: () => void,
      ) => void,
    ) => void;
  }) => {
    if (env.GROQ_API_KEY && !process.env.GROQ_API_KEY) {
      process.env.GROQ_API_KEY = env.GROQ_API_KEY;
    }
    if (env.GROQ_MODEL && !process.env.GROQ_MODEL) {
      process.env.GROQ_MODEL = env.GROQ_MODEL;
    }

    middlewares.use('/api/chat', async (req, res, next) => {
      if (req.method !== 'POST') {
        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }
        next();
        return;
      }

      try {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        const rawBody = Buffer.concat(chunks).toString('utf8');
        const { handleChatRequest } = await import('./api/chat.ts');
        const webReq = new Request('http://localhost/api/chat', {
          method: 'POST',
          headers: {
            'content-type': req.headers['content-type'] ?? 'application/json',
            'x-forwarded-for':
              (typeof req.headers['x-forwarded-for'] === 'string'
                ? req.headers['x-forwarded-for']
                : req.socket.remoteAddress) ?? '127.0.0.1',
          },
          body: rawBody,
        });
        const webRes = await handleChatRequest(webReq);
        res.statusCode = webRes.status;
        webRes.headers.forEach((value, key) => {
          res.setHeader(key, value);
        });
        const text = await webRes.text();
        res.end(text);
      } catch (err) {
        res.statusCode = 500;
        res.setHeader('content-type', 'application/json');
        res.end(
          JSON.stringify({
            error: 'LOCAL_API_ERROR',
            message: err instanceof Error ? err.message : 'Unexpected server error',
          }),
        );
      }
    });
  };

  return {
    name: 'saansathi-local-api',
    configureServer(server) {
      mountMiddleware(server.middlewares);
    },
    configurePreviewServer(server) {
      mountMiddleware(server.middlewares);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      tailwindcss(),
      localApiPlugin(env),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: false,
        includeAssets: ['favicon.svg', 'manifest.webmanifest'],
        workbox: {
          cleanupOutdatedCaches: true,
          globPatterns: ['**/*.{js,css,html,svg,webmanifest}'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/air-quality-api\.open-meteo\.com\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'open-meteo-aq-cache-v1',
                networkTimeoutSeconds: 8,
                expiration: {
                  maxEntries: 16,
                  maxAgeSeconds: 60 * 60,
                },
                cacheableResponse: {
                  statuses: [200],
                },
              },
            },
          ],
        },
      }),
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('@radix-ui')) return 'radix';
            if (id.includes('zustand') || id.includes('idb') || id.includes('zod')) return 'state';
            return undefined;
          },
        },
      },
    },
  };
});
