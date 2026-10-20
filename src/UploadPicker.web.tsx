import React from 'react';
export default function UploadPicker({ onFile, onError }: { onFile: (raw: string) => void; onError: (message: string) => void }) {
  return <input aria-label="Upload discussion JSON" type="file" accept=".json,application/json" style={{ fontFamily: 'inherit', fontSize: 14, maxWidth: '100%', padding: 12 }} onChange={async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2_000_000) { onError('File exceeds the 2 MB limit.'); return; }
    try { onFile(await file.text()); } catch { onError('Could not read this file. Try selecting it again.'); }
    e.target.value = '';
  }} />;
}
