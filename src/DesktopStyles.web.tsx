import React from 'react';

export default function DesktopStyles({ dark }: { dark: boolean }) {
  return <style>{`
    @media(min-width:1060px) {
      [data-testid="desktop-app"] { --desktop-hover: ${dark ? '#181c1f' : '#f6f8f9'}; font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; }
      [data-testid="desktop-header"] { display:grid!important;grid-template-columns:240px minmax(320px,560px) 1fr;min-height:56px!important;height:56px!important;padding:0 16px!important;gap:16px!important; }
      [data-testid="header-actions"] { justify-self:end; }
      [data-testid="desktop-header"] [data-testid="brand-note"] { display:none!important; }
      [data-testid="desktop-header"] [data-testid="brand-logo"] { width:32px!important;height:32px!important;border-radius:50%!important;transform:none!important; }
      [data-testid="desktop-header"] [data-testid="wordmark"] { font-size:28px!important;letter-spacing:-1.1px!important; }
      [data-testid="header-actions"]>button:last-child { background:transparent!important;border:0!important;padding:8px 12px!important; }
      [data-testid="header-actions"]>button:last-child>* { color:${dark ? '#eef1f3' : '#181c1f'}!important; }
      [data-testid="desktop-search"] { width:min(42vw,560px)!important;height:40px!important;border:0!important; }
      [data-testid="desktop-search"] input { font-size:14px!important; }
      [data-testid="desktop-sidebar-shell"] { width:272px!important; }
      [data-testid="desktop-sidebar"] { width:272px!important;padding:20px 16px 12px!important; }
      [data-testid="desktop-sidebar"] [data-testid="sidebar-promo"] { display:none!important; }
      [data-testid="desktop-sidebar"] [data-testid="nav-link"] { min-height:40px!important;padding:9px 16px!important;border-radius:8px!important; }
      [data-testid="desktop-sidebar"] [data-testid="nav-link"]:hover { background:var(--desktop-hover)!important; }
      [data-testid="desktop-main"]>div { padding:24px 32px 48px!important; }
      [data-testid="desktop-columns"] { max-width:1120px!important;gap:24px!important; }
      [data-testid="desktop-hero"] { display:none!important; }
      [data-testid="desktop-community-hero"] { background:transparent!important;border-radius:0!important;padding:12px!important;margin-bottom:20px!important; }
      [data-testid="desktop-toolbar"] { padding:0 4px 14px!important;margin-bottom:0!important;min-height:42px!important; }
      [data-testid="desktop-toolbar"] [data-testid="section-title"] { font-size:13px!important;font-weight:500!important; }
      [data-testid="discussion-card"] { padding:16px 12px!important;margin-bottom:0!important;border-width:0!important;border-bottom-width:1px!important;border-radius:0!important; }
      [data-testid="discussion-card"]:hover { background:var(--desktop-hover)!important;border-radius:12px!important; }
      [data-testid="discussion-card"] [data-testid="card-title"] { font-size:18px!important;line-height:24px!important;letter-spacing:0!important;font-weight:600!important; }
      [data-testid="discussion-card"] [data-testid="card-excerpt"] { font-size:14px!important;line-height:21px!important;margin-top:8px!important; }
      [data-testid="discussion-card"] [data-testid="card-footer"] { border-top-width:0!important;padding-top:0!important;margin-top:16px!important;gap:8px!important; }
      [data-testid="discussion-card"] [data-testid="reply-pill"] { border-radius:24px!important;padding:8px 12px!important; }
      [data-testid="discussion-card"] [data-testid="reply-pill"] { background:${dark ? '#2a3236' : '#e5ebee'}!important; }
      [data-testid="discussion-card"] [data-testid="reply-pill"]>* { color:${dark ? '#eef1f3' : '#181c1f'}!important; }
      [data-testid="discussion-card"] [data-testid="subject-label"] { text-transform:lowercase; }
      [data-testid="discussion-card"] [data-testid="subject-label"]::before { content:'s/'; }
      [data-testid="discussion-card"] [data-testid="ai-label"] { margin-left:6px!important; }
      [data-testid="discussion-card"] [data-testid="subject-icon"] { border-radius:50%!important; }
      [data-testid="desktop-right-rail"] { width:300px!important;padding-top:3px!important; }
      [data-testid="desktop-right-rail"] [data-testid="rail-about"] { border-width:0!important;border-radius:8px!important;padding:16px!important; }
      [data-testid="desktop-right-rail"] [data-testid="rail-quote"] { display:none!important; }
      [data-testid="desktop-right-rail"] [data-testid="rail-subject"] { border:0!important;padding:12px 10px!important;border-radius:8px!important; }
      [data-testid="desktop-right-rail"] [data-testid="rail-subject"]:hover { background:var(--desktop-hover)!important; }
      [data-testid="desktop-app"] button:focus-visible,[data-testid="desktop-app"] input:focus-visible { outline:2px solid #648efc!important; }
      [data-testid="desktop-app"] [data-testid="subject-icon"] { border-radius:50%!important; }
      [data-testid="thread-question"],[data-testid="thread-replies"] { border-width:0!important;padding:16px 12px!important;border-radius:0!important; }
      [data-testid="desktop-app"] .study-markdown { font-size:14px;line-height:1.55; }
    }
  `}</style>;
}
