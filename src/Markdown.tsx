import React, { useState } from 'react';
import { Linking, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { renderMarkdown, markdownCss } from './render-markdown';
import { safeUrl } from './content';
export default function Markdown({ body, color }: { body: string; color: string }) {
  const [height, setHeight] = useState(150);
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;padding:0;background:transparent;color:${color};}${markdownCss}</style></head><body><div class="study-markdown">${renderMarkdown(body)}</div><script>function report(){window.ReactNativeWebView.postMessage(String(Math.ceil(document.body.getBoundingClientRect().height)));}new ResizeObserver(report).observe(document.body);report();</script></body></html>`;
  return <View style={{ height, width: '100%' }}><WebView originWhitelist={['about:*']} source={{ html }} style={{ backgroundColor: 'transparent' }} scrollEnabled={false} onMessage={e => { const n = Number(e.nativeEvent.data); if (Number.isFinite(n) && n > 0) setHeight(Math.min(n + 4, 100000)); }} onShouldStartLoadWithRequest={r => { if (r.url === 'about:blank') return true; if (safeUrl(r.url)) void Linking.openURL(r.url); return false; }} /></View>;
}
