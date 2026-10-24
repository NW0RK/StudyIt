import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const file = 'dist/index.html';
let html = await readFile(file, 'utf8');
html = html.replace('<head>', '<head><meta name="theme-color" content="#0e1113"><meta name="description" content="A quieter corner of the internet for learning. Explore AI-written discussions, one subject at a time.">');
html = html.replace('</head>', '<style>:focus-visible{outline:2px solid #45897a!important;outline-offset:3px}html{color-scheme:light dark}body{background:#f5f6f3}</style></head>');
html = html.replace('</body>', `<script>if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));}</script></body>`);
await writeFile(file, html);
await writeFile('dist/.nojekyll', '');
async function list(dir, prefix = '') {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === 'library' || entry.name === 'sw.js' || entry.name.endsWith('.map')) continue;
    const relative = prefix + entry.name;
    if (entry.isDirectory()) files.push(...await list(`${dir}/${entry.name}`, `${relative}/`));
    else files.push(`./${relative}`);
  }
  return files;
}
const assets = await list('dist');
const version = createHash('sha256').update(html + assets.join()).digest('hex').slice(0, 16);
await writeFile('dist/sw.js', `const CACHE='studyit-shell-${version}';const ASSETS=${JSON.stringify(assets)};
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('studyit-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.includes('/library/'))return;if(event.request.mode==='navigate'){event.respondWith(fetch(event.request).catch(()=>caches.match(new URL('./index.html',self.location.href))));return;}event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));});`);
