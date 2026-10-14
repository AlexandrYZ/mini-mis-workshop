// Локальный статический сервер: из file:// браузер не грузит ES-модули.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

createServer(async (req, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  } catch {
    res.writeHead(400).end(); // битый URL (например, /%) не должен ронять сервер
    return;
  }
  const file = normalize(join(ROOT, urlPath === '/' ? 'index.html' : urlPath));
  // Не отдаём файлы вне папки проекта
  if (!file.startsWith(ROOT.endsWith(sep) ? ROOT : ROOT + sep)) {
    res.writeHead(403).end();
    return;
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Не найдено');
  }
})
  .on('error', (e) => {
    console.error(e.code === 'EADDRINUSE'
      ? `Порт ${PORT} занят. Запустите на другом: PORT=3001 npm start (Windows: set PORT=3001 && npm start)`
      : e.message);
    process.exit(1);
  })
  .listen(PORT, '127.0.0.1', () => {
    console.log(`Мини-МИС: http://localhost:${PORT}  (остановить — Ctrl+C)`);
  });
