import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4174);
const mimeTypes = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

const server = http.createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host || 'localhost'}`).pathname);
  const requestedPath = pathname === '/' ? '/index.html' : pathname;
  const safePath = path.normalize(path.join(root, requestedPath));
  if (!safePath.startsWith(root + path.sep) && safePath !== path.join(root, 'index.html')) {
    response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' }); response.end('Forbidden'); return;
  }
  try {
    const body = await readFile(safePath);
    response.writeHead(200, { 'Content-Type': mimeTypes[path.extname(safePath)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'Cache-Control': 'no-cache' });
    response.end(body);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); response.end('Not found');
  }
});
server.listen(port, '127.0.0.1', () => console.log(`HelpNest is running at http://127.0.0.1:${port}`));
