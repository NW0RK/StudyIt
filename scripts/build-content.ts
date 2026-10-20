import { readdir, readFile, mkdir, writeFile, unlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { discussionSchema, subjectSchema, type Discussion } from '../src/content';

async function main() {
const check = process.argv.includes('--check');
const subjects = subjectSchema.array().parse(JSON.parse(await readFile('content/subjects.json', 'utf8')));
if (new Set(subjects.map(s => s.id)).size !== subjects.length) throw new Error('Duplicate subject IDs');
const discussions: Discussion[] = [];
for (const file of (await readdir('content/discussions')).filter(f => f.endsWith('.json')).sort()) {
  const d = discussionSchema.parse(JSON.parse(await readFile(`content/discussions/${file}`, 'utf8')));
  if (file !== `${d.id}.json`) throw new Error(`${file}: filename must match discussion ID`);
  if (!subjects.some(s => s.id === d.subjectId)) throw new Error(`${file}: unknown subject`);
  if (discussions.some(x => x.id === d.id)) throw new Error(`${file}: duplicate discussion ID`);
  discussions.push(d);
}
const hash = (s: string) => createHash('sha256').update(s).digest('hex');
const entries = discussions.map(d => ({ id: d.id, revision: hash(JSON.stringify(d)), title: d.title, subjectId: d.subjectId, tags: d.tags, difficulty: d.difficulty, publishedAt: d.publishedAt, updatedAt: d.updatedAt, searchText: [d.title, ...d.tags, d.question.body, d.question.priorKnowledge, d.question.interests, ...d.replies.map(r => r.body)].join(' ').toLowerCase() }));
const catalog = { schemaVersion: 1, version: hash(JSON.stringify({ subjects, entries })), subjects, discussions: entries };
if (!check) {
  await mkdir('public/library/discussions', { recursive: true });
  for (const file of await readdir('public/library/discussions')) {
    if (/^[a-z0-9]+(?:-[a-z0-9]+)*\.json$/.test(file) && !discussions.some(d => file === `${d.id}.json`)) await unlink(`public/library/discussions/${file}`);
  }
  await mkdir('src/generated', { recursive: true });
  await mkdir('docs', { recursive: true });
  for (const d of discussions) await writeFile(`public/library/discussions/${d.id}.json`, JSON.stringify(d));
  await writeFile('public/library/catalog.json', JSON.stringify(catalog));
  await writeFile('src/generated/seed.json', JSON.stringify({ catalog, discussions }));
  await writeFile('docs/upload.schema.json', JSON.stringify((await import('zod')).z.toJSONSchema((await import('../src/content')).uploadSchema), null, 2));
}
console.log(`Validated ${subjects.length} subjects and ${discussions.length} discussions${check ? '' : '; generated shared library and offline seed'}.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
