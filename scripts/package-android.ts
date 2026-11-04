import { readFile, mkdir, writeFile, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import config from '../app.config';
import { updateManifestSchema } from '../src/app-update';

async function main() {
const apk = process.argv[2];
if (!apk) throw new Error('Pass the verified APK path.');
const checksum = createHash('sha256').update(await readFile(apk)).digest('hex');
const manifest = updateManifestSchema.parse({ schemaVersion: 1, version: config.version,
  versionCode: config.android?.versionCode, packageId: config.android?.package,
  apkAsset: 'StudyIt.apk', sha256: checksum });
await mkdir('release-output', { recursive: true });
await copyFile(apk, 'release-output/StudyIt.apk');
await writeFile('release-output/android-update.json', JSON.stringify(manifest, null, 2) + '\n');
await writeFile('release-output/StudyIt.apk.sha256', `${checksum}  StudyIt.apk\n`);

}
main().catch(error => { console.error(error); process.exitCode = 1; });
