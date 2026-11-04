import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkAppUpdate, checkDue, officialAsset, RELEASES_API } from '../src/app-update';
const base = 'https://github.com/NW0RK/StudyIt/releases/download/v1.0.3/';
const manifest = { schemaVersion: 1, version: '1.0.3', versionCode: 4, packageId: 'app.studyit.reader', apkAsset: 'StudyIt.apk', sha256: 'a'.repeat(64) };
const release = { draft: false, prerelease: false, tag_name: 'v1.0.3', assets: [
  { name: 'android-update.json', browser_download_url: base + 'android-update.json' },
  { name: 'StudyIt.apk', browser_download_url: base + 'StudyIt.apk' },
] };
const get = (r: unknown = release, m: unknown = manifest) => async (url: string) => url === RELEASES_API ? r : m;
test('only a greater Android version code offers an update', async () => {
  assert.equal((await checkAppUpdate(3, get()))?.versionCode, 4);
  assert.equal(await checkAppUpdate(4, get()), null);
  assert.equal(await checkAppUpdate(5, get()), null);
  assert.equal(await checkAppUpdate(3, get({ ...release, assets: [] })), null);
});
test('update checks reject previews, incorrect identity and malformed checksums', async () => {
  await assert.rejects(checkAppUpdate(3, get({ ...release, prerelease: true })));
  await assert.rejects(checkAppUpdate(3, get(release, { ...manifest, packageId: 'another.app' })));
  await assert.rejects(checkAppUpdate(3, get(release, { ...manifest, sha256: 'bad' })));
  await assert.rejects(checkAppUpdate(3, get(release, { ...manifest, version: '1.0.4' })));
});
test('downloads are confined to the official release and matching assets', async () => {
  for (const url of ['http://github.com/NW0RK/StudyIt/releases/download/v1.0.3/StudyIt.apk',
    base.replace('github.com', 'github.com.evil.example') + 'StudyIt.apk',
    base.replace('NW0RK', 'other') + 'StudyIt.apk', base + 'StudyIt.apk?redirect=evil',
    base.replace('github.com', 'user@github.com') + 'StudyIt.apk']) assert.equal(officialAsset(url, 'StudyIt.apk'), false);
  const wrong = structuredClone(release);
  wrong.assets[1].browser_download_url = base.replace('v1.0.3', 'v1.0.4') + 'StudyIt.apk';
  await assert.rejects(checkAppUpdate(3, get(wrong)), /different releases/);
  wrong.assets[0].browser_download_url = 'https://evil.example/android-update.json';
  await assert.rejects(checkAppUpdate(3, get(wrong)), /Untrusted/);
});
test('offline checks fail without inventing an update; intervals handle clock rollback', async () => {
  await assert.rejects(checkAppUpdate(3, async () => { throw new Error('offline'); }), /offline/);
  assert.equal(checkDue(0, 100, 300), true);
  assert.equal(checkDue(100, 200, 300), false);
  assert.equal(checkDue(100, 400, 300), true);
  assert.equal(checkDue(500, 100, 300), true);
});
