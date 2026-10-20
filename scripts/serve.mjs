import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(process.env.STUDYIT_PREVIEW_ROOT || 'dist');
const port = Number(process.env.PORT || 4173);
const prefix = process.env.STUDYIT_BASE_PATH || '';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf', '.png': 'image/png', '.css': 'text/css' };
http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    let pathname = decodeURIComponent(url.pathname);
    if (prefix && !pathname.startsWith(prefix + '/') && pathname !== prefix) { res.writeHead(404); res.end('Not found'); return; }
    if (prefix) pathname = pathname.slice(prefix.length);
    let target = path.resolve(root, '.' + (pathname || '/'));
    if (target !== root && !target.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
    if ((await stat(target)).isDirectory()) target = path.join(target, 'index.html');
    const data = await readFile(target);
    res.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); res.end(data);
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`StudyIt preview: http://localhost:${port}${prefix}/`));
