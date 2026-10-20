import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { syncLibrary, type Library } from '../src/sync';
import { catalogSchema, discussionSchema } from '../src/content';
const seed = JSON.parse(readFileSync('src/generated/seed.json', 'utf8'));
function current(): Library { return { catalog: catalogSchema.parse(seed.catalog), discussions: discussionSchema.array().parse(seed.discussions), lastUpdated: null }; }
test('unchanged revisions reuse cached discussions without network downloads', async () => {
  const calls: string[] = []; let saved = false;
  const before = current();
  const after = await syncLibrary(before, 'https://example.com/library', async url => { calls.push(url); return before.catalog; }, async () => { saved = true; });
  assert.equal(calls.length, 1); assert.equal(saved, true); assert.ok(after.lastUpdated);
  assert.equal(after.discussions[0], before.discussions[0]);
});
test('changed content replaces the same ID; removed content disappears after successful refresh', async () => {
  const before = current(); const next = structuredClone(before.catalog);
  next.discussions = [next.discussions[0]]; next.discussions[0].revision = 'new-version';
  const changed = { ...before.discussions[0], title: 'Updated title' };
  const after = await syncLibrary(before, 'https://example.com/library', async url => url.includes('catalog') ? next : changed, async () => {});
  assert.equal(after.discussions.length, 1); assert.equal(after.discussions[0].id, before.discussions[0].id); assert.equal(after.discussions[0].title, 'Updated title');
  assert.equal(before.discussions.length, seed.discussions.length);
});
test('failed or malformed refresh never persists a partial library', async () => {
  const before = current(); const next = structuredClone(before.catalog); next.discussions[0].revision = 'new';
  let persisted = false;
  await assert.rejects(syncLibrary(before, 'https://example.com/library', async url => { if (url.includes('catalog')) return next; throw new Error('offline'); }, async () => { persisted = true; }), /offline/);
  assert.equal(persisted, false); assert.equal(before.lastUpdated, null);
  await assert.rejects(syncLibrary(before, 'https://example.com/library', async () => ({ schemaVersion: 999 }), async () => { persisted = true; }));
  assert.equal(persisted, false);
});
test('discussion/catalog identity mismatch and duplicate catalog IDs are rejected', async () => {
  const before = current(); const next = structuredClone(before.catalog); next.discussions[0].revision = 'new';
  await assert.rejects(syncLibrary(before, 'https://example.com/library', async url => url.includes('catalog') ? next : { ...before.discussions[0], id: 'wrong-id' }, async () => {}), /does not match/);
  next.discussions.push(next.discussions[0]);
  await assert.rejects(syncLibrary(before, 'https://example.com/library', async () => next, async () => {}), /duplicate/);
});
test('an unknown community is rejected even when discussion revisions are cached', async () => {
  const before = current(); const next = structuredClone(before.catalog); next.subjects = [];
  await assert.rejects(syncLibrary(before, 'https://example.com/library', async () => next, async () => {}), /unknown subject/);
});
