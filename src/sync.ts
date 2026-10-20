import { catalogSchema, discussionSchema, type Catalog, type Discussion } from './content';
export type Library = { catalog: Catalog; discussions: Discussion[]; lastUpdated: string | null };
export async function syncLibrary(current: Library, base: string, getJson: (url: string) => Promise<unknown>, persist: (next: Library) => Promise<void>): Promise<Library> {
  const catalog = catalogSchema.parse(await getJson(`${base}/catalog.json?t=${Date.now()}`));
  if (new Set(catalog.subjects.map(s => s.id)).size !== catalog.subjects.length || new Set(catalog.discussions.map(d => d.id)).size !== catalog.discussions.length) throw new Error('The published catalog contains duplicate IDs.');
  const discussions: Discussion[] = [];
  for (let i = 0; i < catalog.discussions.length; i += 6) {
    discussions.push(...await Promise.all(catalog.discussions.slice(i, i + 6).map(async entry => {
      const cached = current.discussions.find(d => d.id === entry.id);
      if (cached && current.catalog.discussions.find(d => d.id === entry.id)?.revision === entry.revision) return cached;
      const discussion = discussionSchema.parse(await getJson(`${base}/discussions/${entry.id}.json?v=${entry.revision}`));
      if (discussion.id !== entry.id || discussion.subjectId !== entry.subjectId || !catalog.subjects.some(s => s.id === discussion.subjectId)) throw new Error('The published discussion does not match its catalog entry.');
      return discussion;
    })));
  }
  const next = { catalog, discussions, lastUpdated: new Date().toISOString() };
  await persist(next);
  return next;
}
