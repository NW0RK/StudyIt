import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { discussionSchema, parseUpload, selectDiscussions, type Subject } from '../src/content';
import { publishingFiles, repositoryUrl } from '../src/publishing';
import { renderMarkdown } from '../src/render-markdown';
const example = JSON.parse(readFileSync('content/discussions/derivatives-as-speed.json', 'utf8'));
const subjects: Subject[] = JSON.parse(readFileSync('content/subjects.json', 'utf8'));
const upload = () => ({ schemaVersion: 1, discussion: structuredClone(example) });
test('complete sample validates and retains nested replies', () => {
  const parsed = parseUpload(JSON.stringify(upload()), subjects);
  assert.equal(parsed.discussion.replies[2].parentId, 'r2');
});
test('invalid JSON, unsupported versions, unknown subjects, and oversized files are rejected', () => {
  assert.throws(() => parseUpload('{bad', subjects), /valid JSON/);
  assert.throws(() => parseUpload('x'.repeat(2_000_001), subjects), /2 MB/);
  const value = upload(); value.schemaVersion = 2;
  assert.throws(() => parseUpload(JSON.stringify(value), subjects), /schemaVersion/);
  value.schemaVersion = 1; value.discussion.subjectId = 'unknown';
  assert.throws(() => parseUpload(JSON.stringify(value), subjects), /Unknown subject/);
});
for (const scenario of ['duplicate reply', 'duplicate persona', 'missing parent', 'cycle', 'unknown persona', 'unknown source', 'unsafe source', 'date order']) {
  test(`rejects ${scenario}`, () => {
    const d = structuredClone(example);
    if (scenario === 'duplicate reply') d.replies.push(d.replies[0]);
    if (scenario === 'duplicate persona') d.personas.push(d.personas[0]);
    if (scenario === 'missing parent') d.replies[0].parentId = 'missing';
    if (scenario === 'cycle') d.replies[0].parentId = 'r3';
    if (scenario === 'unknown persona') d.replies[0].personaId = 'missing';
    if (scenario === 'unknown source') d.replies[0].sourceIds = ['missing'];
    if (scenario === 'unsafe source') d.sources[0].url = 'javascript:alert(1)';
    if (scenario === 'date order') d.updatedAt = '2020-01-01T00:00:00Z';
    assert.equal(discussionSchema.safeParse(d).success, false);
  });
}
test('new subject upload prepares both files and existing subject updates preserve IDs', () => {
  const value = { ...upload(), subject: { ...subjects[0], id: 'biology', name: 'Biology' } };
  value.discussion.subjectId = 'biology';
  const files = publishingFiles(parseUpload(JSON.stringify(value), subjects), subjects);
  assert.equal(files.length, 2);
  assert.equal(JSON.parse(files[1].contents).length, subjects.length + 1);
  const existing = publishingFiles(parseUpload(JSON.stringify(upload()), subjects), subjects);
  assert.equal(existing.length, 1);
  assert.equal(existing[0].path, `content/discussions/${example.id}.json`);
  assert.throws(() => parseUpload(JSON.stringify({ ...upload(), subject: { ...subjects[0], name: 'Renamed' } }), subjects), /different definition/);
});
test('search includes reply bodies and learner context, filters subjects, and sorts newest first', () => {
  const other = JSON.parse(readFileSync('content/discussions/orbits-and-falling.json', 'utf8'));
  assert.equal(selectDiscussions([example, other], 'speedometer', null)[0].id, example.id);
  assert.equal(selectDiscussions([example], 'algebra', null).length, 1);
  assert.equal(selectDiscussions([example], 'speedometer', 'physics').length, 0);
  assert.equal(selectDiscussions([example, other], '', null)[0].id, other.id);
});
test('Markdown renders code and math while escaping HTML and rejecting unsafe links', () => {
  const html = renderMarkdown('**Hello** $x^2$\n\n```js\nconst a = 1;\n```\n\n<script>alert(1)</script>\n\n[bad](javascript:alert(1))');
  assert.match(html, /<strong>Hello<\/strong>/);
  assert.match(html, /<math/);
  assert.match(html, /<pre><code/);
  assert.doesNotMatch(html, /<script>/);
  assert.doesNotMatch(html, /href="javascript:/);
});
test('repository destinations accept GitHub repositories only', () => {
  assert.equal(repositoryUrl('NW0RK/StudyIt'), 'https://github.com/NW0RK/StudyIt');
  assert.equal(repositoryUrl('https://github.com/NW0RK/StudyIt.git'), 'https://github.com/NW0RK/StudyIt');
  assert.equal(repositoryUrl('https://evil.example/NW0RK/StudyIt'), null);
  assert.equal(repositoryUrl('owner/../other'), null);
});
