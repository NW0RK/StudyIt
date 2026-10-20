import React from 'react';
import { renderMarkdown, markdownCss } from './render-markdown';
export default function Markdown({ body, color }: { body: string; color: string }) {
  return <div className="study-markdown" style={{ color }}><style>{markdownCss}</style><div dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }} /></div>;
}
