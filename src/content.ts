import { z } from 'zod';

const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and single hyphens').max(100);
const text = z.string().trim().min(1).max(100000);
export const safeUrl = (value: string) => { try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password; } catch { return false; } };
const source = z.object({ id, title: z.string().min(1).max(300), url: z.string().refine(safeUrl, 'Use an http or https URL') }).strict();
export const subjectSchema = z.object({ id, name: z.string().min(1).max(80), description: z.string().min(1).max(500), color: z.string().regex(/^#[0-9a-fA-F]{6}$/), icon: z.enum(['calculator-outline', 'code-slash-outline', 'planet-outline', 'book-outline', 'flask-outline', 'leaf-outline']) }).strict();
export const discussionSchema = z.object({
  schemaVersion: z.literal(1), id, subjectId: id, title: z.string().min(1).max(200),
  tags: z.array(z.string().min(1).max(40)).max(12), difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  publishedAt: z.iso.datetime(), updatedAt: z.iso.datetime(),
  question: z.object({ learnerName: z.string().min(1).max(80), body: text, priorKnowledge: text, interests: text }).strict(),
  personas: z.array(z.object({ id, name: z.string().min(1).max(80), role: z.string().min(1).max(120) }).strict()).min(1).max(30),
  replies: z.array(z.object({ id, parentId: id.nullable(), personaId: id, body: text, sourceIds: z.array(id).default([]) }).strict()).min(1).max(250),
  sources: z.array(source).max(100),
}).strict().superRefine((d, ctx) => {
  const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
  for (const [label, entries] of [['persona', d.personas], ['reply', d.replies], ['source', d.sources]] as const) {
    if (new Set(entries.map(x => x.id)).size !== entries.length) fail(`Duplicate ${label} IDs`);
  }
  const replies = new Map(d.replies.map(r => [r.id, r]));
  const personas = new Set(d.personas.map(p => p.id));
  const sources = new Set(d.sources.map(s => s.id));
  for (const reply of d.replies) {
    if (!personas.has(reply.personaId)) fail(`Reply ${reply.id}: unknown persona ${reply.personaId}`);
    if (reply.sourceIds.some(s => !sources.has(s))) fail(`Reply ${reply.id}: unknown source`);
    const seen = new Set([reply.id]);
    let parent = reply.parentId;
    while (parent) {
      if (seen.has(parent)) { fail(`Reply ${reply.id}: cyclic reply relationship`); break; }
      seen.add(parent);
      const ancestor = replies.get(parent);
      if (!ancestor) { fail(`Reply ${reply.id}: missing parent ${parent}`); break; }
      parent = ancestor.parentId;
    }
  }
  if (Date.parse(d.updatedAt) < Date.parse(d.publishedAt)) fail('updatedAt cannot precede publishedAt');
});
export type Subject = z.infer<typeof subjectSchema>;
export type Discussion = z.infer<typeof discussionSchema>;
export const uploadSchema = z.object({ schemaVersion: z.literal(1), subject: subjectSchema.optional(), discussion: discussionSchema }).strict().superRefine((d, ctx) => {
  if (d.subject && d.subject.id !== d.discussion.subjectId) ctx.addIssue({ code: 'custom', message: 'Subject ID must match the discussion subjectId' });
});
export type Upload = z.infer<typeof uploadSchema>;
export function parseUpload(raw: string, subjects: Subject[]): Upload {
  if (raw.length > 2_000_000) throw new Error('File exceeds the 2 MB limit.');
  let json: unknown;
  try { json = JSON.parse(raw); } catch { throw new Error('This file is not valid JSON. Check commas, quotes, and brackets.'); }
  const result = uploadSchema.safeParse(json);
  if (!result.success) throw new Error(result.error.issues.map(i => `${i.path.join('.') || 'File'}: ${i.message}`).join('\n'));
  if (!result.data.subject && !subjects.some(s => s.id === result.data.discussion.subjectId)) throw new Error('Unknown subject. Include a subject definition in this upload.');
  const existing = subjects.find(s => s.id === result.data.discussion.subjectId);
  if (existing && result.data.subject && JSON.stringify(existing) !== JSON.stringify(result.data.subject)) throw new Error('This subject already exists with a different definition. Omit subject to use the existing community; edit subject metadata separately in GitHub.');
  return result.data;
}
export const catalogSchema = z.object({ schemaVersion: z.literal(1), version: z.string(), subjects: z.array(subjectSchema), discussions: z.array(z.object({ id, revision: z.string(), title: z.string(), subjectId: id, tags: z.array(z.string()), difficulty: z.enum(['Beginner','Intermediate','Advanced']), publishedAt: z.iso.datetime(), updatedAt: z.iso.datetime(), searchText: z.string() })) });
export type Catalog = z.infer<typeof catalogSchema>;
export function selectDiscussions(discussions: Discussion[], query: string, subject: string | null, subjects: Subject[] = []) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  return discussions.filter(d => (!subject || d.subjectId === subject) && terms.every(t => `${subjects.find(s => s.id === d.subjectId)?.name || d.subjectId} ${d.title} ${d.tags.join(' ')} ${d.question.body} ${d.question.priorKnowledge} ${d.question.interests} ${d.replies.map(r => r.body).join(' ')}`.toLowerCase().includes(t))).sort((a,b) => b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id));
}
