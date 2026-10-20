import type { Subject, Upload } from './content';
export function repositoryUrl(value: string): string | null {
  const trimmed = value.trim().replace(/\/$/, '').replace(/\.git$/, '');
  const match = /^(?:https:\/\/github\.com\/)?([a-zA-Z0-9][a-zA-Z0-9-]*)\/([a-zA-Z0-9_.-]+)$/.exec(trimmed);
  if (!match || match[2] === '.' || match[2] === '..') return null;
  return `https://github.com/${match[1]}/${match[2]}`;
}
export function publishingFiles(upload: Upload, subjects: Subject[]) {
  const files = [{ path: `content/discussions/${upload.discussion.id}.json`, contents: JSON.stringify(upload.discussion, null, 2) + '\n' }];
  if (upload.subject && !subjects.some(s => s.id === upload.subject!.id)) files.push({ path: 'content/subjects.json', contents: JSON.stringify([...subjects, upload.subject], null, 2) + '\n' });
  return files;
}
export function downloadJson(filename: string, contents: string) {
  if (typeof document === 'undefined') return;
  const url = URL.createObjectURL(new Blob([contents], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
