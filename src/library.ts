import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import seed from './generated/seed.json';
import { catalogSchema, discussionSchema } from './content';
import { syncLibrary, type Library } from './sync';

export type { Library } from './sync';
export type Preferences = { saved: string[]; read: string[]; followed: string[]; theme: 'light' | 'dark'; repository: string };
export const initialLibrary: Library = { catalog: catalogSchema.parse(seed.catalog), discussions: discussionSchema.array().parse(seed.discussions), lastUpdated: null };
export const defaultPreferences: Preferences = { saved: [], read: [], followed: seed.catalog.subjects.map(s => s.id), theme: Platform.OS !== 'web' || (typeof window !== 'undefined' && window.innerWidth >= 1060) ? 'dark' : 'light', repository: 'NW0RK/StudyIt' };
export const storage = { get: (key: string) => AsyncStorage.getItem(key), set: (key: string, value: string) => AsyncStorage.setItem(key, value) };
export async function loadCached(): Promise<Library | null> {
  try {
    const raw = await storage.get('studyit.library.v1');
    if (!raw) return null;
    const data = JSON.parse(raw);
    const catalog = catalogSchema.parse(data.catalog);
    const discussions = discussionSchema.array().parse(data.discussions);
    if (catalog.discussions.some(e => !discussions.some(d => d.id === e.id))) return null;
    return { catalog, discussions, lastUpdated: typeof data.lastUpdated === 'string' ? data.lastUpdated : null };
  } catch { return null; }
}
export async function loadPreferences(): Promise<Preferences> {
  try {
    const value = JSON.parse(await storage.get('studyit.preferences.v1') || '{}');
    return {
      saved: Array.isArray(value.saved) ? value.saved.filter((s: unknown) => typeof s === 'string') : [],
      read: Array.isArray(value.read) ? value.read.filter((s: unknown) => typeof s === 'string') : [],
      followed: Array.isArray(value.followed) ? value.followed.filter((s: unknown) => typeof s === 'string') : defaultPreferences.followed,
      theme: value.theme === 'dark' ? 'dark' : value.theme === 'light' ? 'light' : defaultPreferences.theme, repository: typeof value.repository === 'string' ? value.repository : defaultPreferences.repository,
    };
  } catch { return defaultPreferences; }
}
export function libraryBase(): string | null {
  const configured = process.env.EXPO_PUBLIC_LIBRARY_URL;
  if (configured) return configured.replace(/\/$/, '');
  if (Platform.OS === 'web' && typeof window !== 'undefined') return new URL('./library', window.location.href.split('#')[0]).href.replace(/\/$/, '');
  return null;
}
async function fetchJson(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try { const response = await fetch(url, { signal: controller.signal, cache: 'no-store' }); if (!response.ok) throw new Error(`Library request failed (${response.status}).`); return await response.json(); }
  finally { clearTimeout(timeout); }
}
export async function refreshLibrary(current: Library): Promise<Library> {
  const base = libraryBase();
  if (!base) throw new Error('This Android build has no published library address. The bundled library is available; configure EXPO_PUBLIC_LIBRARY_URL when building to enable syncing.');
  return syncLibrary(current, base, fetchJson, next => storage.set('studyit.library.v1', JSON.stringify(next)));
}
