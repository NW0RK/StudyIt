import { z } from 'zod';

export const RELEASES_API = 'https://api.github.com/repos/NW0RK/StudyIt/releases/latest';
export const PACKAGE_ID = 'app.studyit.reader';
export const updateManifestSchema = z.object({
  schemaVersion: z.literal(1), version: z.string().regex(/^\d+\.\d+\.\d+$/),
  versionCode: z.number().int().positive(), packageId: z.literal(PACKAGE_ID),
  apkAsset: z.literal('StudyIt.apk'), sha256: z.string().regex(/^[a-f0-9]{64}$/),
}).strict();
export type UpdateManifest = z.infer<typeof updateManifestSchema>;
export type AppUpdate = UpdateManifest & { url: string };
const releaseSchema = z.object({ draft: z.literal(false), prerelease: z.literal(false), tag_name: z.string(), assets: z.array(z.object({ name: z.string(), browser_download_url: z.string() })) });
export function officialAsset(url: string, name: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && !u.username && !u.password && !u.search && !u.hash &&
      new RegExp(`^/NW0RK/StudyIt/releases/download/[^/]+/${name.replaceAll('.', '\\.')}\u0024`).test(u.pathname) && u.hostname === 'github.com';
  } catch { return false; }
}
export async function checkAppUpdate(versionCode: number, getJson: (url: string) => Promise<unknown>): Promise<AppUpdate | null> {
  const raw = await getJson(RELEASES_API);
  // A repository with only previews does not yet have a stable update.
  const release = releaseSchema.parse(raw);
  const manifestAsset = release.assets.find(a => a.name === 'android-update.json');
  if (!manifestAsset) return null;
  if (!officialAsset(manifestAsset.browser_download_url, 'android-update.json')) throw new Error('Untrusted update manifest address.');
  if (decodeURIComponent(new URL(manifestAsset.browser_download_url).pathname.split('/').at(-2)!) !== release.tag_name) throw new Error('The update manifest belongs to another release.');
  const manifest = updateManifestSchema.parse(await getJson(manifestAsset.browser_download_url));
  if (release.tag_name !== `v${manifest.version}`) throw new Error('Update version does not match the release.');
  if (manifest.versionCode <= versionCode) return null;
  const apk = release.assets.find(a => a.name === manifest.apkAsset);
  if (!apk || !officialAsset(apk.browser_download_url, manifest.apkAsset)) throw new Error('The release has no trusted Android download.');
  if (new URL(apk.browser_download_url).pathname.split('/').at(-2) !== new URL(manifestAsset.browser_download_url).pathname.split('/').at(-2)) throw new Error('Update assets belong to different releases.');
  return { ...manifest, url: apk.browser_download_url };
}
export function checkDue(lastCheck: number, now: number, interval: number): boolean {
  return !lastCheck || now < lastCheck || now - lastCheck >= interval;
}
