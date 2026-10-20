import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { avatarHash, avatarSvg, learnerAvatarSeed, personaAvatarSeed } from '../src/avatar';
import { discussionSchema } from '../src/content';

async function main() {
const identities = new Map<string, string>();
for (const file of (await readdir('content/discussions')).filter(name => name.endsWith('.json')).sort()) {
  const discussion = discussionSchema.parse(JSON.parse(await readFile(`content/discussions/${file}`, 'utf8')));
  identities.set(learnerAvatarSeed(discussion.question.learnerName), discussion.question.learnerName);
  for (const persona of discussion.personas) identities.set(personaAvatarSeed(persona.id, persona.name), `${persona.name} · AI persona`);
}
await mkdir('public/avatars', { recursive: true });
const manifest = [];
for (const [seed, name] of identities) {
  const file = `avatar-${avatarHash(seed).toString(16).padStart(8, '0')}.svg`;
  await writeFile(`public/avatars/${file}`, avatarSvg(seed) + '\n');
  manifest.push({ seed, name, file });
}
await writeFile('public/avatars/manifest.json', JSON.stringify(manifest, null, 2) + '\n');
const escape = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
await writeFile('public/avatars/index.html', `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>StudyIt generated avatars</title><style>body{background:#0e1113;color:#eef1f3;font:16px system-ui;margin:40px}h1{font-size:28px}p{color:#b7cad4}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:20px;max-width:1100px}figure{margin:0;padding:20px;background:#181c1f;border-radius:16px;text-align:center}img{width:100px;height:100px}figcaption{margin-top:12px;font-size:13px;line-height:1.5}</style><h1>Meet the conversation</h1><p>Automatically generated StudyIt profile pictures. Each identity keeps its own character and background.</p><div class="grid">${manifest.map(item => `<figure><img src="${item.file}" alt=""><figcaption>${escape(item.name)}</figcaption></figure>`).join('')}</div></html>`);
console.log(`Generated ${manifest.length} deterministic profile pictures and public/avatars/index.html.`);
}
void main().catch(error => { console.error(error); process.exitCode = 1; });
