import MarkdownIt from 'markdown-it';
import katex from 'katex';
import { safeUrl } from './content';

const md = new MarkdownIt({ html: false, linkify: false, breaks: true });
md.validateLink = safeUrl;
md.inline.ruler.before('escape', 'math', (state, silent) => {
  if (state.src[state.pos] !== '$') return false;
  const display = state.src[state.pos + 1] === '$';
  const delimiter = display ? '$$' : '$';
  const end = state.src.indexOf(delimiter, state.pos + delimiter.length);
  if (end < 0) return false;
  if (!silent) {
    const token = state.push('math', '', 0);
    token.content = state.src.slice(state.pos + delimiter.length, end);
    token.meta = { display };
  }
  state.pos = end + delimiter.length;
  return true;
});
md.renderer.rules.math = (tokens, idx) => {
  try { return katex.renderToString(tokens[idx].content, { displayMode: tokens[idx].meta.display, output: 'mathml', throwOnError: false, trust: false, strict: 'ignore', maxExpand: 1000 }); }
  catch { return md.utils.escapeHtml(tokens[idx].content); }
};
const originalLink = md.renderer.rules.link_open || ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  tokens[idx].attrSet('target', '_blank');
  tokens[idx].attrSet('rel', 'noopener noreferrer');
  return originalLink(tokens, idx, options, env, self);
};
export function renderMarkdown(value: string) { return md.render(value); }
export const markdownCss = `
  .study-markdown { font: 15px/1.8 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; overflow-wrap:anywhere; }
  .study-markdown p { margin: 0 0 14px; } .study-markdown p:last-child { margin-bottom:0; }
  .study-markdown strong { font-weight:650; } .study-markdown h1,.study-markdown h2,.study-markdown h3 { line-height:1.35; }
  .study-markdown pre { background:rgba(100,120,130,.1); border:1px solid rgba(100,120,130,.2); padding:16px; border-radius:10px; overflow:auto; }
  .study-markdown code { font: .88em/1.7 ui-monospace,Consolas,monospace; } .study-markdown :not(pre)>code { background:rgba(100,120,130,.12); padding:2px 5px; border-radius:4px; }
  .study-markdown a { color:#277caa; text-decoration:underline; } .study-markdown blockquote { margin-left:0; border-left:3px solid #82ad9d; padding-left:16px; opacity:.85; }
  .study-markdown math[display=block] { overflow-x:auto; padding:12px 0; } .study-markdown table { border-collapse:collapse; } .study-markdown td,.study-markdown th { border:1px solid #aaa; padding:8px; }
`;
