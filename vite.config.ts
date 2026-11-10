// Front end: React + Astryx, built to dist/. In development the API runs inside the Vite server
// (same origin, no proxy), using the same handle() that the Vercel function in api/index.js uses.
import { defineConfig, type Plugin, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage } from 'node:http';
import { fileURLToPath } from 'node:url';

async function toRequest(req: IncomingMessage): Promise<Request> {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (v !== undefined) headers.set(k, Array.isArray(v) ? v.join(', ') : v);
  }
  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  return new Request(url, { method: req.method, headers, body: hasBody ? Buffer.concat(chunks) : undefined });
}

function devApi(): Plugin {
  return {
    name: 'dev-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next();
        try {
          // ssrLoadModule picks up server code changes without restarting Vite.
          const { handle } = await server.ssrLoadModule('/server/index.js');
          const response: Response = await handle(await toRequest(req));
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          const cookies = response.headers.getSetCookie?.() ?? [];
          if (cookies.length) res.setHeader('set-cookie', cookies);
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (e) {
          console.error(e);
          res.statusCode = 500;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ error: 'server', message: 'Something went wrong on the server.' }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), devApi()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { port: Number(process.env.PORT) || 3000 },
  build: { outDir: 'dist', sourcemap: true },
});
