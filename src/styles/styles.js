export const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;450;500;600;700&display=swap');

.ps-root{
  --paper:#EAEEF4; --card:#FFFFFF; --ink:#131A24; --muted:#667180;
  --faint:#8896A4; --line:#D9E0E9; --line-soft:#E9EDF3;
  --accent:#2B4CF0; --accent-ink:#1D33B0; --accent-bg:#EAEEFE;
  --amber:#B5720F; --amber-bg:#FBF1DE;
  --consultative:#0E8C7C; --assertive:#2B4CF0; --aggressive:#D23B3F; --methodical:#7A46C9;
  --ok:#1E9E6A;
  --surface:#F6F8FB;
  --say:#0B7A5B; --say-bg:#E8F6EF; --say-line:#12A374;
  --instr:#9A5B08; --instr-bg:#FBF1DE; --instr-line:#D89B3A;
  font-family:'Inter',system-ui,sans-serif; color:var(--ink);
  background:var(--paper); min-height:100%;
  -webkit-font-smoothing:antialiased;
}
.ps-root *{box-sizing:border-box}
.ps-root h1,.ps-root h2,.ps-root h3,.ps-root .display{font-family:'Space Grotesk',sans-serif;letter-spacing:-0.02em}

/* P6.5: dark mode */
.ps-root[data-theme="dark"]{
  --paper:#0F1724; --card:#1E293B; --ink:#E2E8F0; --muted:#94A3B8;
  --faint:#64748B; --line:#334155; --line-soft:#1E293B;
  --accent:#60A5FA; --accent-ink:#93C5FD; --accent-bg:#1E3A5F;
  --amber:#FDBA74; --amber-bg:#7C2D12;
  --ok:#4ADE80;
  --surface:#1E293B;
  --say:#34D399; --say-bg:#064E3B; --say-line:#34D399;
  --instr:#FDBA74; --instr-bg:#7C2D12; --instr-line:#FDBA74;
}
.ps-root[data-theme="dark"] .ps-side{background:#0B1120;color:#94A3B8}
.ps-root[data-theme="dark"] .ps-brand{color:#E2E8F0}
.ps-root[data-theme="dark"] .ps-nav:hover{background:#1E293B;color:#fff}
.ps-root[data-theme="dark"] .ps-nav.on{background:var(--accent);color:#fff}
.ps-root[data-theme="dark"] .script-head{background:#1E293B}
.ps-root[data-theme="dark"] .call-cockpit{background:#0B1120}
.ps-root[data-theme="dark"] .loading-box .ring{border-color:rgba(96,165,250,.25);border-top-color:var(--accent)}
.ps-root[data-theme="dark"] .finp,.ps-root[data-theme="dark"] .ftext,.ps-root[data-theme="dark"] .fsel{background:#1E293B;border-color:#334155;color:#E2E8F0}
.ps-root[data-theme="dark"] .finp:focus,.ps-root[data-theme="dark"] .ftext:focus,.ps-root[data-theme="dark"] .fsel:focus{background:#0F1724;border-color:var(--accent)}
.ps-root[data-theme="dark"] .spinner.dark{border-color:rgba(96,165,250,.25);border-top-color:var(--accent)}
.ps-root[data-theme="dark"] .ps-input,.ps-root[data-theme="dark"] .ps-select{background:#1E293B;border-color:#334155;color:#E2E8F0}
.ps-root[data-theme="dark"] .ps-input:focus,.ps-root[data-theme="dark"] .ps-select:focus{background:#0F1724;border-color:var(--accent)}
.ps-root[data-theme="dark"] .obj.open{background:#1E2936}
.ps-root[data-theme="dark"] .ps-textarea{background:#1E293B;border-color:#334155;color:#E2E8F0}
.ps-root[data-theme="dark"] .ps-textarea:focus{background:#0F1724;border-color:var(--accent)}
.ps-root[data-theme="dark"] .ps-stat-card{background:#1E293B;border-color:#334155}
.ps-root[data-theme="dark"] .char-count{color:#64748B}
.ps-root[data-theme="dark"] .char-count.warn{color:var(--amber)}
.ps-root[data-theme="dark"] .char-count.over{color:#F87171}

/* shell */
.ps-shell{display:flex;min-height:100vh}
.ps-side{display:none}

/* ============================================================
   Enterprise Sidebar (es-) — Premium redesign
   ============================================================ */
.es-sidebar{position:fixed;left:0;top:0;height:100vh;width:264px;background:linear-gradient(180deg,#0F1724 0%,#0B1221 100%);color:#94A3B8;display:flex;flex-direction:column;z-index:50;transition:width .35s cubic-bezier(.4,0,.2,1),transform .3s ease;border-right:1px solid rgba(30,41,59,.6);overflow:hidden;box-shadow:4px 0 24px rgba(0,0,0,.15)}
.es-sidebar.es-collapsed{width:72px}
.es-sidebar.es-collapsed .es-brand-text,.es-sidebar.es-collapsed .es-workspace-name,.es-sidebar.es-collapsed .es-group-label,.es-sidebar.es-collapsed .es-nav-label,.es-sidebar.es-collapsed .es-user-info,.es-sidebar.es-collapsed .es-footer-btn span{display:none}

/* Brand */
.es-brand{display:flex;align-items:center;justify-content:space-between;padding:18px 16px 14px;flex-shrink:0;border-bottom:1px solid rgba(30,41,59,.5)}
.es-brand-mark{display:flex;align-items:center;gap:11px;min-width:0}
.es-brand-dot{width:10px;height:10px;border-radius:3px;background:linear-gradient(135deg,var(--accent) 0%,#6366F1 100%);box-shadow:0 0 0 3px rgba(99,102,241,.2);flex-shrink:0}
.es-brand-text{font-family:'Space Grotesk';font-weight:700;font-size:18px;color:#F1F5F9;letter-spacing:-0.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.es-collapse-btn{width:30px;height:30px;border-radius:8px;border:none;background:rgba(30,41,59,.4);color:#64748B;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:.15s;flex-shrink:0}
.es-collapse-btn:hover{background:rgba(51,65,85,.6);color:#CBD5E1}
.es-sidebar.es-collapsed .es-collapse-btn{margin-left:auto;margin-right:auto}

/* Workspace */
.es-workspace{display:flex;align-items:center;gap:10px;padding:10px 14px;margin:10px 10px 6px;border-radius:10px;cursor:pointer;transition:.15s;flex-shrink:0;background:rgba(30,41,59,.35);border:1px solid rgba(51,65,85,.3)}
.es-workspace:hover{background:rgba(51,65,85,.5);border-color:rgba(71,85,105,.5)}
.es-workspace-icon{width:18px;height:18px;color:#64748B;flex-shrink:0;display:flex;align-items:center;justify-content:center}
.es-workspace-name{font-size:12.5px;font-weight:600;color:#E2E8F0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:.01em}

/* Nav scroll */
.es-nav-scroll{flex:1;overflow-y:auto;overflow-x:hidden;padding:4px 10px 10px;margin-right:0}
.es-nav-scroll::-webkit-scrollbar{width:4px}
.es-nav-scroll::-webkit-scrollbar-thumb{background:#2A3A50;border-radius:10px}
.es-nav-scroll::-webkit-scrollbar-track{background:transparent}

/* Section */
.es-section{display:flex;flex-direction:column;margin-bottom:6px}
.es-section:not(:first-child){margin-top:2px}

/* Group header */
.es-group-header{display:flex;align-items:center;gap:7px;width:100%;padding:7px 10px;border-radius:8px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#55667A;cursor:pointer;transition:.15s;background:transparent;border:none;text-align:left;margin-bottom:2px}
.es-group-header:hover{color:#788AA3;background:rgba(30,41,59,.35)}
.es-group-chevron{width:15px;height:15px;display:flex;align-items:center;justify-content:center;transition:transform .2s ease;color:#55667A;flex-shrink:0}
.es-group-chevron.es-rotated{transform:rotate(90deg)}
.es-group-label{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

/* Section items */
.es-section-items{display:flex;flex-direction:column;gap:2px;padding-left:0;margin-top:1px}

/* Nav item */
.es-nav-item{display:flex;align-items:center;gap:11px;width:100%;padding:8px 12px;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;color:#94A3B8;background:transparent;border:none;text-align:left;transition:.15s;position:relative;margin-bottom:1px}
.es-nav-item:hover{background:rgba(30,41,59,.55);color:#E2E8F0}
.es-nav-item.es-active{background:rgba(43,76,240,.14);color:#60A5FA;font-weight:600}
.es-nav-item.es-active::before{content:'';position:absolute;left:0;top:8px;bottom:8px;width:3px;border-radius:0 4px 4px 0;background:linear-gradient(180deg,var(--accent) 0%,#818CF8 100%);opacity:.9}
.es-nav-icon{width:18px;height:18px;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:currentColor;opacity:.75}
.es-nav-item:hover .es-nav-icon{opacity:.9}
.es-nav-item.es-active .es-nav-icon{opacity:1;color:#60A5FA}
.es-nav-label{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;font-size:13px}

/* Footer */
.es-footer{flex-shrink:0;padding:12px 14px 16px;border-top:1px solid rgba(30,41,59,.5);margin-top:auto;background:rgba(11,18,33,.35)}
.es-user{display:flex;align-items:center;gap:10px;padding:7px 9px;border-radius:9px;margin-bottom:8px;transition:.15s}
.es-user:hover{background:rgba(30,41,59,.4)}
.es-user-avatar{width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,var(--accent-bg) 0%,rgba(99,102,241,.15) 100%);color:var(--accent);font-family:'Space Grotesk';font-weight:700;font-size:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid rgba(99,102,241,.2)}
.es-user-info{min-width:0;overflow:hidden}
.es-user-name{font-size:13px;font-weight:600;color:#F1F5F9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.es-user-email{font-size:11px;color:#64748B;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px}
.es-footer-actions{display:flex;flex-direction:column;gap:2px}
.es-footer-btn{display:flex;align-items:center;gap:10px;width:100%;padding:7px 10px;border-radius:8px;font-size:13px;font-weight:500;color:#788AA3;background:transparent;border:none;cursor:pointer;transition:.12s;text-align:left}
.es-footer-btn:hover{background:rgba(30,41,59,.5);color:#E2E8F0}
.es-footer-btn svg{width:17px;height:17px;flex-shrink:0;opacity:.7}
.es-footer-btn:hover svg{opacity:.9}

/* Mobile */
.es-mobile-overlay{display:none}
.es-mobile-toggle{display:none}

/* Bottom tab bar (mobile only) */
.bt-bar{display:none}
.bt-item{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 0;border:none;background:none;color:var(--muted);font-size:10px;font-family:'Inter',system-ui,sans-serif;cursor:pointer;transition:.12s;line-height:1.2}
.bt-item:active{background:var(--accent-bg)}
.bt-item.es-active{color:var(--accent)}
.bt-icon{display:flex;align-items:center;justify-content:center}

/* Responsive */
@media(max-width:1024px){
  .es-sidebar{width:72px}
  .es-sidebar .es-brand-text,.es-sidebar .es-workspace-name,.es-sidebar .es-group-label,.es-sidebar .es-nav-label,.es-sidebar .es-user-info,.es-sidebar .es-footer-btn span{display:none}
  .es-sidebar .es-collapse-btn{display:none}
  .es-workspace{justify-content:center;padding:10px}
  .es-workspace-icon{margin:0}
}
@media(max-width:768px){
  .es-sidebar{transform:translateX(-100%);width:280px}
  .es-sidebar.es-mobile-open{transform:translateX(0);box-shadow:8px 0 40px rgba(0,0,0,.35)}
  .es-sidebar.es-mobile-open .es-brand-text,.es-sidebar.es-mobile-open .es-workspace-name,.es-sidebar.es-mobile-open .es-group-label,.es-sidebar.es-mobile-open .es-nav-label,.es-sidebar.es-mobile-open .es-user-info,.es-sidebar.es-mobile-open .es-footer-btn span{display:block}
  .es-sidebar.es-mobile-open .es-collapse-btn{display:flex}
  .es-mobile-overlay{display:block;position:fixed;inset:0;background:rgba(2,6,23,.55);z-index:40;backdrop-filter:blur(2px)}
  .es-mobile-toggle{display:none}
  .bt-bar{display:flex;position:fixed;bottom:0;left:0;right:0;z-index:45;background:var(--card);border-top:1px solid var(--line);padding:4px 0 env(safe-area-inset-bottom,0px)}
  .ps-root:has(.es-mobile-open) .bt-bar{display:none!important}
  .ps-main{padding-bottom:60px}
  .ps-top{flex-wrap:wrap;gap:10px}
  .ps-header{flex-wrap:wrap}
  .ds-stepper{overflow-x:auto;flex-wrap:nowrap;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:4px}
  .ds-stepper::-webkit-scrollbar{display:none}
  .ds-step{white-space:nowrap;flex-shrink:0}
}

/* Dark mode sidebar */
.ps-root[data-theme="dark"] .es-sidebar{background:linear-gradient(180deg,#0B1120 0%,#080C17 100%);border-color:rgba(30,41,59,.5)}
.ps-root[data-theme="dark"] .bt-bar{background:#0F1724;border-color:#1E293B}
.ps-root[data-theme="dark"] .bt-item{color:#64748B}
.ps-root[data-theme="dark"] .bt-item.es-active{color:#60A5FA}

/* Focus visible (accessibility) */
.es-group-header:focus-visible,.es-nav-item:focus-visible,.es-footer-btn:focus-visible,.es-collapse-btn:focus-visible{outline:2px solid var(--accent);outline-offset:-2px}

/* Reduced motion */
@media(prefers-reduced-motion:reduce){
  .es-sidebar,.es-group-chevron,.es-nav-item,.es-collapse-btn{transition:none!important}
}

/* Legacy nav fallback */
.ps-nav{display:none}
.ps-nav-group{display:none}
.ps-nav-group-h{display:none}
.ps-nav-group-items{display:none}
.ps-side-foot{display:none}
.ps-co{display:none}

.ps-main{flex:1;min-width:0;display:flex;flex-direction:column;transition:padding-left .35s cubic-bezier(.4,0,.2,1);background:var(--paper);min-height:100vh}
.ps-top{padding:22px 34px 0;display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap}

/* Desktop: sidebar visible */
@media(min-width:1025px){
  .ps-main{padding-left:264px}
  .es-sidebar.es-collapsed ~ .ps-main{padding-left:72px}
}
/* Tablet: auto-collapsed */
@media(max-width:1024px) and (min-width:769px){
  .ps-main{padding-left:72px}
}
/* Mobile: sidebar hidden */
@media(max-width:768px){
  .ps-main{padding-left:0}
  .ps-top{padding-left:0}
  .pd-tabs{overflow-x:auto;flex-wrap:nowrap;-webkit-overflow-scrolling:touch;scrollbar-width:none}
  .pd-tabs::-webkit-scrollbar{display:none}
  .pd-tab{white-space:nowrap;flex-shrink:0}
}
.ps-eyebrow{font-size:11.5px;font-weight:700;letter-spacing:.11em;text-transform:uppercase;color:var(--accent);margin-bottom:5px}
.ps-title{font-size:27px;font-weight:700}
.ps-sub{color:var(--muted);font-size:14px;margin-top:4px}
.ps-body{padding:24px 34px 60px;flex:1;min-width:0}

/* buttons */
.ps-btn{font-family:'Inter';font-weight:600;font-size:13.5px;border:none;border-radius:9px;padding:10px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;transition:.13s;line-height:1}
.ps-btn.pri{background:var(--accent);color:#fff}
.ps-btn.pri:hover{background:var(--accent-ink)}
.ps-btn.ghost{background:#fff;color:var(--ink);border:1px solid var(--line)}
.ps-btn.ghost:hover{border-color:var(--faint);background:var(--surface)}
.ps-btn.subtle{background:var(--accent-bg);color:var(--accent-ink)}
.ps-btn.subtle:hover{background:#DEE5FD}
.ps-btn:disabled{opacity:.5;cursor:not-allowed}
.ps-btn.sm{padding:7px 12px;font-size:12.5px}
.ps-btn-sm{font-family:'Inter';font-weight:600;font-size:12px;border:none;border-radius:8px;padding:6px 12px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:.13s;line-height:1;background:var(--accent-bg);color:var(--accent-ink)}
.ps-top-actions{display:flex;gap:9px;align-items:center;flex-wrap:wrap}
.ps-btn-sm:hover{background:#DEE5FD}
.ps-btn-ghost{font-family:'Inter';font-weight:600;font-size:12.5px;border:none;border-radius:8px;padding:6px 10px;cursor:pointer;display:inline-flex;align-items:center;gap:5px;transition:.13s;background:transparent;color:var(--faint)}
.ps-btn-ghost:hover{color:var(--ink);background:rgba(43,76,240,.06)}
.ps-btn.danger{background:#fff;color:var(--aggressive);border:1px solid #F0C9CA}
.ps-btn.danger:hover{background:#FDF2F2}

/* ---- Dark theme: buttons ---- */
.ps-root[data-theme="dark"] .ps-btn.ghost{background:#1E293B;color:#E2E8F0;border-color:#334155}
.ps-root[data-theme="dark"] .ps-btn.ghost:hover{background:#334155;border-color:#475569;color:#fff}
.ps-root[data-theme="dark"] .ps-btn.subtle{background:#1E3A5F;color:#93C5FD}
.ps-root[data-theme="dark"] .ps-btn.subtle:hover{background:#2B4CF0;color:#fff}
.ps-root[data-theme="dark"] .ps-btn-sm:hover{background:#2B4CF0;color:#fff}
.ps-root[data-theme="dark"] .ps-btn-ghost:hover{color:#E2E8F0;background:rgba(96,165,250,.1)}
.ps-root[data-theme="dark"] .ps-btn.danger{background:#1E293B;color:#F87171;border-color:#7F1D1D}
.ps-root[data-theme="dark"] .ps-btn.danger:hover{background:#7F1D1D;color:#FCA5A5}

/* cards / grid */
.ps-grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(270px,1fr))}
.ps-card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px}
.pcard{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:20px;cursor:pointer;transition:.14s;display:flex;flex-direction:column;gap:10px}
.pcard:hover{border-color:var(--accent);box-shadow:0 8px 24px -14px rgba(43,76,240,.4);transform:translateY(-2px)}
.pcard .cat{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--accent)}
.pcard .nm{font-family:'Space Grotesk';font-weight:600;font-size:18px}
.pcard .ln{color:var(--muted);font-size:13px;line-height:1.5;flex:1}
.pcard .foot{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--faint);border-top:1px solid var(--line-soft);padding-top:11px;margin-top:2px}
.chip{display:inline-flex;align-items:center;gap:6px;background:var(--surface);border-radius:20px;padding:4px 11px;font-size:12px;font-weight:600;color:var(--muted)}
.chip.n{background:var(--accent-bg);color:var(--accent-ink)}

/* empty state */
.ps-empty{background:var(--card);border:1.5px dashed var(--line);border-radius:16px;padding:56px 24px;text-align:center}
.ps-empty .big{font-family:'Space Grotesk';font-weight:600;font-size:20px;margin-bottom:8px}
.ps-empty p{color:var(--muted);max-width:420px;margin:0 auto 20px;line-height:1.55;font-size:14px}

/* forms */
.ps-form{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:26px;max-width:760px}
.frow{margin-bottom:17px}
.frow.two{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.flab{display:block;font-size:12.5px;font-weight:600;color:var(--ink);margin-bottom:6px}
.flab .opt{color:var(--faint);font-weight:500}
.finp,.ftext,.fsel{width:100%;border:1px solid var(--line);border-radius:9px;padding:10px 12px;font-family:'Inter';font-size:14px;color:var(--ink);background:#FBFCFE;transition:.12s}
.finp:focus,.ftext:focus,.fsel:focus{outline:none;border-color:var(--accent);background:#fff;box-shadow:0 0 0 3px rgba(43,76,240,.12)}
.ftext{resize:vertical;min-height:74px;line-height:1.5}
.fhint{font-size:11.5px;color:var(--faint);margin-top:5px}
.limited-field{width:100%;min-width:0}
.limited-field textarea,.limited-field input{width:100%}
.char-count{font-size:11px;color:var(--faint);text-align:right;margin-top:1px;transition:.12s;line-height:1}
.char-count.warn{color:var(--amber)}
.char-count.over{color:var(--aggressive)}

/* voice recorder */
.vr-container{display:inline-flex;flex-direction:column;gap:4px}
.vr-row{display:flex;align-items:center;gap:8px}
.vr-btn{display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;border:2px solid var(--line);background:var(--card);color:var(--text);cursor:pointer;transition:.15s}
.vr-btn:hover{border-color:var(--accent);color:var(--accent)}
.vr-btn-compact{width:28px;height:28px}
.vr-btn-recording{border-color:#EF4444;color:#EF4444;animation:vr-pulse 1.2s ease-in-out infinite}
@keyframes vr-pulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.4)}50%{box-shadow:0 0 0 8px rgba(239,68,68,0)}}
.vr-timer{font-size:13px;font-weight:600;color:#EF4444;font-variant-numeric:tabular-nums}
.vr-lang{font-size:12px;padding:2px 6px;border:1px solid var(--line);border-radius:6px;background:var(--card);color:var(--text);cursor:pointer}
.vr-status{font-size:12px;color:var(--muted)}
.vr-spin{animation:vr-spin 1s linear infinite}
@keyframes vr-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
.vr-error{font-size:11px;color:#EF4444;margin-top:2px}

/* diarized transcript */
.dt-panel{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px;margin-top:8px;max-height:320px;overflow-y:auto}
.dt-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.dt-title{font-weight:700;font-size:13px;color:var(--text)}
.dt-actions{display:flex;gap:6px}
.dt-action{display:flex;align-items:center;gap:4px;font-size:11px;padding:4px 8px;border:1px solid var(--line);border-radius:6px;background:none;color:var(--muted);cursor:pointer;transition:.12s}
.dt-action:hover{border-color:var(--accent);color:var(--accent)}
.dt-notice{font-size:12px;color:var(--amber);background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.25);border-radius:8px;padding:8px 12px;margin-bottom:10px}
.dt-speaker-labels{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px}
.dt-speaker-row{display:flex;align-items:center;gap:6px}
.dt-speaker-dot{width:10px;height:10px;border-radius:50%}
.dt-speaker-select{font-size:11px;padding:2px 6px;border:1px solid var(--line);border-radius:6px;background:var(--card);color:var(--text);cursor:pointer}
.dt-segments{display:flex;flex-direction:column;gap:8px}
.dt-segment{padding:8px 10px;border-radius:8px;background:var(--bg);border:1px solid var(--line)}
.dt-segment-meta{display:flex;align-items:center;gap:8px;margin-bottom:4px}
.dt-segment-speaker{font-size:12px;font-weight:600}
.dt-segment-time{font-size:10px;color:var(--faint);font-variant-numeric:tabular-nums}
.dt-segment-conf{font-size:10px;color:var(--faint);margin-left:auto}
.dt-segment-text{font-size:13px;line-height:1.5;color:var(--text)}

.ps-root[data-theme="dark"] .vr-btn{border-color:var(--line);color:var(--text)}
.ps-root[data-theme="dark"] .vr-btn:hover{border-color:var(--accent);color:var(--accent)}
.ps-root[data-theme="dark"] .vr-lang{border-color:var(--line);background:#1e293b;color:var(--text)}
.ps-root[data-theme="dark"] .dt-panel{border-color:#334155}
.ps-root[data-theme="dark"] .dt-action{border-color:#334155;color:#94A3B8}
.ps-root[data-theme="dark"] .dt-action:hover{border-color:var(--accent);color:var(--accent)}
.ps-root[data-theme="dark"] .dt-segment{background:#1e293b;border-color:#334155}
.ps-root[data-theme="dark"] .dt-speaker-select{background:#1e293b;border-color:#334155;color:var(--text)}

/* ---- Dark theme: force visibility on hardcoded inline text ---- */
.ps-root[data-theme="dark"] .obj-head .s{color:#FDBA74}
.ps-root[data-theme="dark"] .obj-q{color:#E2E8F0}
.ps-root[data-theme="dark"] .obj-a{color:#CBD5E1}
.ps-root[data-theme="dark"] .obj-more{background:#1E3A5F;color:#93C5FD;border-color:#334155}
.ps-root[data-theme="dark"] .obj-more:hover{background:#60A5FA;color:#fff}
.ps-root[data-theme="dark"] .obj-search{background:#1E293B;border-color:#334155;color:#E2E8F0}
.ps-root[data-theme="dark"] .obj-search:focus{border-color:#60A5FA}
.ps-root[data-theme="dark"] .obj-q:hover{background:#334155}
.ps-root[data-theme="dark"] .call-timer-label{color:#94A3B8}
.ps-root[data-theme="dark"] .call-seg-time{color:#94A3B8}
.ps-root[data-theme="dark"] .call-section-label{color:#94A3B8}
.ps-root[data-theme="dark"] .call-line.checked{color:#64748B;text-decoration:line-through}
.ps-root[data-theme="dark"] .call-bottom{color:#64748B;border-color:#334155}
.ps-root[data-theme="dark"] .battle-card .bc-body{color:#94A3B8}
.ps-root[data-theme="dark"] .ps-sub{color:#94A3B8}
.ps-root[data-theme="dark"] .ps-eyebrow{color:#94A3B8}
.ps-root[data-theme="dark"] .chip.n{background:#1E3A5F;color:#93C5FD}
.ps-root[data-theme="dark"] .ps-muted{color:#94A3B8}

/* ---- Dark theme: force dark backgrounds on light-only elements ---- */
.ps-root[data-theme="dark"] .ctcard,
.ps-root[data-theme="dark"] .method,
.ps-root[data-theme="dark"] .pill,
.ps-root[data-theme="dark"] .ls-chip,
.ps-root[data-theme="dark"] .lang-mode,
.ps-root[data-theme="dark"] .step,
.ps-root[data-theme="dark"] .ph-row,
.ps-root[data-theme="dark"] .ai-row,
.ps-root[data-theme="dark"] .ai-variant,
.ps-root[data-theme="dark"] .lb-row,
.ps-root[data-theme="dark"] .ds-dim-card,
.ps-root[data-theme="dark"] .ds-insight-block{background:#1E293B;border-color:#334155}

.ps-root[data-theme="dark"] .speak-item{background:#0F1724;border-color:#064E3B;color:#6EE7B7}
.ps-root[data-theme="dark"] .listen-item{background:#0F1724;border-color:#334155;color:#93C5FD}
.ps-root[data-theme="dark"] .coach-note{background:#1E293B;border-color:#92400E;color:#FDBA74}

.ps-root[data-theme="dark"] .finp,
.ps-root[data-theme="dark"] .ftext,
.ps-root[data-theme="dark"] .fsel{background:#1E293B;border-color:#334155;color:#E2E8F0}
.ps-root[data-theme="dark"] .finp:focus,
.ps-root[data-theme="dark"] .ftext:focus,
.ps-root[data-theme="dark"] .fsel:focus{background:#0F1724;border-color:#60A5FA}

.ps-root[data-theme="dark"] .rp-input,
.ps-root[data-theme="dark"] .rp-suggestion,
.ps-root[data-theme="dark"] .ds-input,
.ps-root[data-theme="dark"] .comment-input textarea,
.ps-root[data-theme="dark"] .pv-search{background:#1E293B;border-color:#334155;color:#E2E8F0}
.ps-root[data-theme="dark"] .rp-input:focus,
.ps-root[data-theme="dark"] .ds-input:focus{background:#0F1724;border-color:#60A5FA}

.ps-root[data-theme="dark"] .modal{background:#1E293B;color:#E2E8F0}
.ps-root[data-theme="dark"] .overlay{background:rgba(0,0,0,.6)}

.ps-root[data-theme="dark"] .ptbl th{background:#1E293B;color:#94A3B8;border-color:#334155}
.ps-root[data-theme="dark"] .ptbl tr:hover td{background:#1E293B}

.ps-root[data-theme="dark"] .dt-search input{background:#1E293B;border-color:#334155;color:#E2E8F0}
.ps-root[data-theme="dark"] .dt-date-preset{background:#1E293B;border-color:#334155;color:#94A3B8}

.ps-root[data-theme="dark"] .pv-toggle-btn.on{background:#1E293B;color:#60A5FA}
.ps-root[data-theme="dark"] .ck{background:#1E293B;border-color:#475569}

.ps-root[data-theme="dark"] .dt-table tbody tr:hover{background:#1E293B}
.ps-root[data-theme="dark"] .dt-table tbody tr.archived:hover{background:#1E293B}

.ps-root[data-theme="dark"] .pv-del-float{background:#1E293B;border-color:#334155;color:#E2E8F0}

.ps-root[data-theme="dark"] .ds-section-header:hover{background:#1E293B}

.ps-root[data-theme="dark"] .ai-variant .vcontent{background:#0F1724;border-color:#334155;color:#E2E8F0}

/* studio selectors */
.studio-wrap{display:grid;grid-template-columns:1fr;gap:18px}
.sel-block{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px}
.sel-head{font-size:12px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--muted);margin-bottom:13px}
.sel-note{font-weight:600;letter-spacing:0;text-transform:none;color:var(--faint)}
.method-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(215px,1fr));gap:11px}
.ct-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:11px}
.ctcard{border:1.5px solid var(--line);border-radius:11px;padding:13px 14px;cursor:pointer;transition:.13s;background:#FBFCFE}
.ctcard:hover{border-color:var(--faint)}
.ctcard.on{border-color:var(--accent);background:var(--accent-bg)}
.ctnm{font-family:'Space Grotesk';font-weight:600;font-size:14.5px}
.ctd{font-size:12px;color:var(--muted);line-height:1.45;margin-top:6px}
.method{border:1.5px solid var(--line);border-radius:11px;padding:13px 14px;cursor:pointer;transition:.13s;background:#FBFCFE}
.method:hover{border-color:var(--faint)}
.method.on{border-color:var(--accent);background:var(--accent-bg)}
.method .mnm{font-family:'Space Grotesk';font-weight:600;font-size:14.5px;display:flex;justify-content:space-between;align-items:center;gap:8px}
.method .mbl{font-size:12px;color:var(--muted);line-height:1.45;margin-top:6px}
.tone-tag{font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:3px 8px;border-radius:20px;white-space:nowrap;flex:0 0 auto}
.pill-row{display:flex;flex-wrap:wrap;gap:9px}
.pill{border:1.5px solid var(--line);background:#FBFCFE;border-radius:9px;padding:9px 15px;font-size:13.5px;font-weight:600;cursor:pointer;transition:.13s;color:var(--muted)}
.pill:hover{border-color:var(--faint)}
.pill.on{border-color:var(--accent);background:var(--accent);color:#fff}

/* generate bar */
.genbar{position:sticky;bottom:0;background:linear-gradient(0deg,var(--paper) 60%,transparent);padding:16px 0 4px;display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.genbar .summary{font-size:13.5px;color:var(--muted);flex:1;min-width:200px}
.genbar .summary b{color:var(--ink);font-weight:600}
.saved-tag{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--ok);background:#E6F6EF;padding:5px 11px;border-radius:20px}

/* ===== script cockpit ===== */
.cockpit{display:grid;grid-template-columns:1fr 340px;gap:20px;align-items:start}
.script-col{min-width:0}
.script-head{background:var(--ink);color:#fff;border-radius:16px;padding:20px 22px;margin-bottom:16px}
.script-head .lbl{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#8AA0FF;margin-bottom:9px}
.opening{font-family:'Space Grotesk';font-size:20px;line-height:1.4;font-weight:500}
.tone-line{display:flex;align-items:center;gap:10px;margin-top:15px;flex-wrap:wrap}
.tone-badge{font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:4px 11px;border-radius:20px;color:#fff}
.tone-guide{font-size:12.5px;color:#AEB8C4;line-height:1.45;flex:1;min-width:180px}

/* timeline signature */
.timeline-card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px 18px;margin-bottom:16px}
.timer-row{display:flex;align-items:center;gap:14px;margin-bottom:14px}
.clock{font-family:'Space Grotesk';font-weight:700;font-size:30px;font-variant-numeric:tabular-nums;letter-spacing:-0.01em}
.clock.over{color:var(--aggressive)}
.timeline{position:relative;height:46px;border-radius:9px;overflow:hidden;background:var(--line-soft);display:flex}
.tl-seg{position:relative;border-right:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:var(--muted);transition:.2s;min-width:0;overflow:hidden;padding:0 4px;text-align:center;line-height:1.1}
.tl-seg.active{background:var(--accent-bg);color:var(--accent-ink)}
.tl-seg.done{background:#E8EBF0;color:var(--faint)}
.tl-seg:last-child{border-right:none}
.playhead{position:absolute;top:0;bottom:0;width:2px;background:var(--aggressive);z-index:3;transition:left .9s linear}
.playhead::before{content:'';position:absolute;top:-4px;left:-4px;width:10px;height:10px;border-radius:50%;background:var(--aggressive)}

/* segments */
.seg{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:0;margin-bottom:13px;overflow:hidden;transition:.15s}
.seg.active{border-color:var(--accent);box-shadow:0 6px 22px -14px rgba(43,76,240,.5)}
.seg-top{display:flex;align-items:center;gap:12px;padding:15px 18px;cursor:pointer}
.seg-num{width:30px;height:30px;flex:0 0 auto;border-radius:8px;background:var(--accent-bg);color:var(--accent-ink);font-family:'Space Grotesk';font-weight:700;font-size:14px;display:flex;align-items:center;justify-content:center}
.seg.active .seg-num{background:var(--accent);color:#fff}
.seg-label{font-family:'Space Grotesk';font-weight:600;font-size:16px;flex:1}
.seg-time{font-size:12px;font-weight:600;color:var(--muted);background:var(--surface);padding:4px 10px;border-radius:20px;font-variant-numeric:tabular-nums}
.seg-caret{color:var(--faint);font-size:13px;transition:.2s}
.seg-body{padding:0 18px 18px;border-top:1px solid var(--line-soft)}
/* multi-language cockpit */
.opening-row{display:grid;gap:12px;margin-bottom:16px}
.opening-row.cols-1{grid-template-columns:1fr}
.opening-row.cols-2{grid-template-columns:1fr 1fr}
.opening-row.cols-3{grid-template-columns:1fr 1fr 1fr}
.opening-row .script-head{margin-bottom:0}
.opening-row .script-head.empty{background:#1E2836}
.col-lang-tag{display:inline-block;background:var(--accent);color:#fff;font-size:10.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:3px 10px;border-radius:20px;margin-right:8px}
.meta-chips.inline{display:inline-flex;margin-top:0;vertical-align:middle}
.seg-body-row{display:grid;gap:14px;padding:12px 18px 18px;border-top:1px solid var(--line-soft)}
.seg-body-row.cols-1{grid-template-columns:1fr}
.seg-body-row.cols-2{grid-template-columns:1fr 1fr}
.seg-body-row.cols-3{grid-template-columns:1fr 1fr 1fr}
.seg-col{min-width:0}
.seg-col.loading{padding:20px;color:var(--faint);font-style:italic;font-size:13px}
.seg-col-lang{font-family:'Space Grotesk';font-weight:700;font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--accent);background:var(--accent-bg);padding:5px 10px;border-radius:20px;display:inline-block;margin-bottom:10px}
@media(max-width:900px){
  .opening-row.cols-2,.opening-row.cols-3,
  .seg-body-row.cols-2,.seg-body-row.cols-3{grid-template-columns:1fr}
}
/* language switcher bar */
.lang-switcher{display:flex;flex-wrap:wrap;gap:8px;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin-bottom:14px}
.ls-label{font-size:12.5px;font-weight:700;color:var(--muted);letter-spacing:.03em}
.ls-chip{font-size:13px;font-weight:600;padding:6px 12px;border-radius:9px;cursor:pointer;border:1.5px solid var(--line);background:#FBFCFE;color:var(--muted);transition:.13s;user-select:none}
.ls-chip:hover{border-color:var(--faint)}
.ls-chip.on{background:var(--accent);color:#fff;border-color:var(--accent)}
.ls-chip.missing{border-style:dashed;color:var(--amber);background:#FBF6EA;border-color:#E9C888}
.ls-chip.missing:hover{background:#F8ECCE}
.ls-chip.disabled{opacity:.4;cursor:not-allowed}
.ls-chip.primary.on{outline:2px solid rgba(255,255,255,.35);outline-offset:-4px}
.ls-gen{font-weight:500;opacity:.85;margin-left:3px}
.ls-hint{font-size:11.5px;color:var(--faint);width:100%;margin-top:2px}

/* language modes on Studio */
.lang-modes{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}
.lang-mode{border:1.5px solid var(--line);background:#FBFCFE;border-radius:11px;padding:13px 14px;cursor:pointer;transition:.13s}
.lang-mode:hover{border-color:var(--faint)}
.lang-mode.on{border-color:var(--accent);background:var(--accent-bg)}
.lang-mode.dis{opacity:.55;cursor:not-allowed}
.lm-h{font-family:'Space Grotesk';font-weight:600;font-size:14.5px;display:flex;align-items:center}
.lm-b{font-size:12px;color:var(--muted);line-height:1.45;margin-top:5px}
.pill.primary{background:var(--accent);color:#fff;border-color:var(--accent);cursor:default}
.lang-summary{font-size:12.5px;color:var(--muted);margin-top:12px;padding:9px 12px;background:var(--surface);border-radius:8px;line-height:1.5}

.seg-goal{font-size:13px;color:var(--muted);font-style:italic;margin:14px 0 16px;line-height:1.5;padding-left:12px;border-left:2px solid var(--accent-bg)}
.sub-h{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin:16px 0 9px}
.say-item,.ask-item{display:flex;gap:10px;padding:8px 0;font-size:14px;line-height:1.5;border-bottom:1px solid var(--line-soft)}
.say-item:last-child,.ask-item:last-child{border-bottom:none}
.ck{width:18px;height:18px;flex:0 0 auto;border:1.5px solid var(--line);border-radius:5px;margin-top:1px;cursor:pointer;transition:.12s;display:flex;align-items:center;justify-content:center;color:transparent;font-size:11px}
.ck.on{background:var(--ok);border-color:var(--ok);color:#fff}
.say-item.checked span,.ask-item.checked span{color:var(--faint);text-decoration:line-through}
.qmark{color:var(--accent);font-weight:700;flex:0 0 auto}

/* meta chips + legend + say/coach colouring */
.meta-chips{display:flex;flex-wrap:wrap;gap:7px;margin-top:14px}
.mchip{font-size:11.5px;font-weight:600;color:#C3CBD6;background:#1E2836;border:1px solid #2A3646;padding:4px 10px;border-radius:20px}
.legend{display:flex;flex-wrap:wrap;gap:16px;padding:11px 16px;background:var(--card);border:1px solid var(--line);border-radius:11px;margin-bottom:16px}
.legend .lg{display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:600;color:var(--muted)}
.dotc{width:12px;height:12px;border-radius:4px;flex:0 0 auto}
.dotc.say{background:var(--say-line)}
.dotc.instr{background:var(--instr-line)}
.sub-h.say-h{color:var(--say)}
.sub-h.coach-h{color:var(--instr)}
.speak-item{display:flex;gap:10px;padding:11px 12px;margin:7px 0;font-size:15px;line-height:1.5;background:var(--say-bg);border-left:3px solid var(--say-line);border-radius:0 8px 8px 0;color:#0A3F30;font-weight:500}
.speak-item .qmark{color:var(--say);background:#D6EEE3;border-radius:5px;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:12px}
.speak-item.checked>span{color:var(--faint);text-decoration:line-through;font-weight:400}
.coach-note{display:flex;gap:9px;align-items:flex-start;padding:9px 12px;margin:7px 0;font-size:13px;line-height:1.5;background:var(--instr-bg);border-left:3px solid var(--instr-line);border-radius:0 8px 8px 0;color:var(--instr);font-style:italic}
.coach-note.goal{margin-top:14px;font-style:normal}
.coach-tag{font-style:normal;font-weight:700;font-size:10px;letter-spacing:.06em;text-transform:uppercase;background:var(--instr);color:#fff;padding:2px 7px;border-radius:5px;margin-right:2px;flex:0 0 auto}
.coach-dot{width:6px;height:6px;border-radius:50%;background:var(--instr-line);margin-top:6px;flex:0 0 auto}
.two-sel{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.pill.toggle{border-style:dashed}
.pill.toggle.on{border-style:solid;background:var(--say-line);border-color:var(--say-line)}
@media(max-width:640px){.two-sel{grid-template-columns:1fr}}

/* objections panel */
.obj-panel{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:0;position:sticky;top:16px;max-height:calc(100vh - 32px);overflow:hidden}
.obj-head{padding:16px 18px;border-bottom:1px solid var(--line-soft);background:var(--amber-bg)}
.obj-head .t{font-family:'Space Grotesk';font-weight:700;font-size:15px;color:var(--amber);display:flex;align-items:center;gap:8px}
.obj-head .s{font-size:12px;color:#9A7A3E;margin-top:3px}
.obj-search{width:100%;border:1px solid var(--line);border-radius:8px;padding:8px 11px;font-size:13px;margin:12px 0 2px;font-family:'Inter'}
.obj-search:focus{outline:none;border-color:var(--amber)}
.obj-list{max-height:calc(100vh - 180px);overflow-y:auto}
.obj{border-bottom:1px solid var(--line-soft);transition:.15s}
.obj.open{background:#FFFDF7}
.obj-q{padding:13px 18px;cursor:pointer;display:flex;gap:10px;align-items:flex-start;font-size:13.5px;font-weight:600;line-height:1.45}
.obj-q:hover{background:#FBFCFE}
.obj-q .q{color:var(--amber);flex:0 0 auto;font-weight:700}
.obj-a{padding:0 18px 15px 40px;font-size:13.5px;line-height:1.6;color:var(--muted)}
.obj-a b{color:var(--ink)}
.obj-more{display:block;width:100%;padding:14px 18px;font-size:13px;font-weight:600;color:var(--accent);background:var(--accent-bg);border:none;border-top:1px solid var(--line-soft);cursor:pointer;transition:.13s;text-align:center;border-radius:0 0 12px 12px}
.obj-more:hover{background:var(--accent);color:#fff}

/* Legacy page wrappers (used by analytics/leaderboard/dealscore/heatmap) */
.ps-container{flex:1;min-width:0;display:flex;flex-direction:column;padding:0 34px 60px}
.ps-header{padding:22px 0 0;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;flex-direction:column}
.ps-header h1{font-family:'Space Grotesk';font-weight:700;font-size:24px;letter-spacing:-0.02em;margin:0;display:flex;align-items:center}
.ps-muted{color:var(--muted);font-size:14px;margin:4px 0 0}
@media(max-width:860px){
  .ps-container{padding:0 18px 40px}
  .ps-header{padding:18px 0 0}
}
@media(max-width:560px){
  .ps-header h1{font-size:20px}
}

/* ===== Call Studio refinements ===== */

/* Call state indicator */
.call-state{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:5px 11px;border-radius:20px;background:var(--surface);color:var(--faint);border:1.5px solid var(--line-soft);transition:.2s}
.call-state.live{background:#E8F6EF;color:#1A7F5B;border-color:#B9E1CA;animation:pulseState 2s ease-in-out infinite}
.call-state.paused{background:#FBF1DE;color:#B5720F;border-color:#F0D9A6}
.call-state.ready{background:var(--accent-bg);color:var(--accent-ink);border-color:#C4D0F9}
@keyframes pulseState{0%,100%{opacity:1}50%{opacity:.75}}

/* Stepper replaces timeline */
.stepper{display:flex;gap:0;align-items:stretch;background:var(--card);border:1px solid var(--line);border-radius:10px;overflow:hidden;margin-top:10px}
.step{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 6px;cursor:pointer;transition:.15s;border-right:1px solid var(--line-soft);position:relative;background:#FBFCFE}
.step:last-child{border-right:none}
.step:hover{background:var(--surface)}
.step.done{background:#E8F6EF;color:#0B7A5B}
.step.done .step-num{background:#0B7A5B;color:#fff}
.step.active{background:var(--accent-bg);color:var(--accent-ink)}
.step.active .step-num{background:var(--accent);color:#fff;box-shadow:0 0 0 3px rgba(43,76,240,.15)}
.step.current::after{content:'';position:absolute;bottom:0;left:20%;right:20%;height:3px;border-radius:3px 3px 0 0;background:var(--accent)}
.step-num{width:26px;height:26px;border-radius:50%;background:var(--line-soft);color:var(--faint);font-family:'Space Grotesk';font-weight:700;font-size:12px;display:flex;align-items:center;justify-content:center;transition:.15s}
.step-label{font-size:11.5px;font-weight:700;text-align:center;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%;padding:0 2px}
.step-time{font-size:10px;font-weight:600;color:var(--faint);text-align:center}
.step.done .step-time{color:#0B7A5B}
.step.active .step-time{color:var(--accent-ink)}

/* Playhead track below stepper */
.playhead-track{position:relative;height:3px;background:var(--line);border-radius:2px;margin:8px 0 0;overflow:hidden}
.playhead{position:absolute;top:0;bottom:0;width:3px;background:var(--aggressive);border-radius:2px;z-index:2;transition:left .9s linear}
.playhead::before{content:'';position:absolute;top:-3px;left:-4px;width:10px;height:10px;border-radius:50%;background:var(--aggressive)}

/* Say This — dominant */
.say-block{background:#E8F6EF;border:1.5px solid #C6E9D8;border-radius:10px;padding:14px 16px;margin:12px 0}
.say-head{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#0B7A5B;margin-bottom:10px;display:flex;align-items:center;gap:7px}
.say-head::before{content:'';width:18px;height:18px;border-radius:5px;background:#0B7A5B;display:inline-block;mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z'/%3E%3Cpath d='M19 10v2a7 7 0 0 1-14 0v-2'/%3E%3Cpath d='M12 19v3'/%3E%3C/svg%3E") center/contain no-repeat;-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z'/%3E%3Cpath d='M19 10v2a7 7 0 0 1-14 0v-2'/%3E%3Cpath d='M12 19v3'/%3E%3C/svg%3E") center/contain no-repeat}
.say-head.ask{color:var(--accent)}
.say-head.ask::before{background:var(--accent);mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpath d='M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3'/%3E%3Cpath d='M12 17h.01'/%3E%3C/svg%3E") center/contain no-repeat;-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpath d='M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3'/%3E%3Cpath d='M12 17h.01'/%3E%3C/svg%3E") center/contain no-repeat}

/* Speak items inside say-block */
.speak-item{padding:9px 11px;margin:6px 0;font-size:15px;line-height:1.5;background:#fff;border:1.5px solid #D6EEE3;border-radius:8px;color:#0A3F30;font-weight:500;display:flex;align-items:flex-start;gap:10px;cursor:pointer;transition:.12s}
.speak-item:hover{border-color:#9ED5BC}
.speak-item.checked{border-color:var(--faint);background:var(--surface);color:var(--faint);text-decoration:line-through;font-weight:400}
.speak-item.q{border-color:#DEE5FD;color:var(--accent-ink)}
.speak-item.q:hover{border-color:#A8B8EC}
.speak-item.q .qmark{color:var(--accent);background:var(--accent-bg);border-radius:5px;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:12px;flex:0 0 auto;font-weight:700}

/* Listen For — new section */
.listen-block{background:#EAEEFE;border:1.5px solid #C4D0F9;border-radius:10px;padding:14px 16px;margin:12px 0}
.listen-head{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--accent-ink);margin-bottom:10px;display:flex;align-items:center;gap:7px}
.listen-head::before{content:'';width:18px;height:18px;border-radius:5px;background:var(--accent);display:inline-block;mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M18.8 4A6.3 8.3 0 0 1 20 9'/%3E%3Cpath d='M18.8 4A6.3 8.3 0 0 0 16 2'/%3E%3Cpath d='M20 9a6.3 8.3 0 0 1-1.8 5'/%3E%3Cpath d='M16 2a6.3 8.3 0 0 1-2.3 5.4'/%3E%3Cpath d='M16 2a6.3 8.3 0 0 0-5.8 3.7'/%3E%3Cpath d='M18.8 4a6.3 8.3 0 0 1-5.8 3.7'/%3E%3Cpath d='M20 9a6.3 8.3 0 0 0-5.8-3.7'/%3E%3Cpath d='M16 7.4V22'/%3E%3Cpath d='M16 7.4a6.3 8.3 0 0 1-1.8-1.4'/%3E%3Cpath d='M16 7.4a6.3 8.3 0 0 0-1.8-1.4'/%3E%3Cpath d='M13.8 9a6.3 8.3 0 0 0-5.8 3.7'/%3E%3Cpath d='M13.8 9a6.3 8.3 0 0 1-1.8 1.4'/%3E%3Cpath d='M13.8 9a6.3 8.3 0 0 1 2.2.4'/%3E%3Cpath d='M13.8 9a6.3 8.3 0 0 0 2.2.4'/%3E%3Cpath d='M14 22h-2a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h2'/%3E%3Cpath d='M18 22h2a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2h-2'/%3E%3Cpath d='M8 14v3'/%3E%3Cpath d='M20 14v3'/%3E%3C/svg%3E") center/contain no-repeat;-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M18.8 4A6.3 8.3 0 0 1 20 9'/%3E%3Cpath d='M18.8 4A6.3 8.3 0 0 0 16 2'/%3E%3Cpath d='M20 9a6.3 8.3 0 0 1-1.8 5'/%3E%3Cpath d='M16 2a6.3 8.3 0 0 1-2.3 5.4'/%3E%3Cpath d='M16 2a6.3 8.3 0 0 0-5.8 3.7'/%3E%3Cpath d='M18.8 4a6.3 8.3 0 0 1-5.8 3.7'/%3E%3Cpath d='M20 9a6.3 8.3 0 0 0-5.8-3.7'/%3E%3Cpath d='M16 7.4V22'/%3E%3Cpath d='M16 7.4a6.3 8.3 0 0 1-1.8-1.4'/%3E%3Cpath d='M16 7.4a6.3 8.3 0 0 0-1.8-1.4'/%3E%3Cpath d='M13.8 9a6.3 8.3 0 0 0-5.8 3.7'/%3E%3Cpath d='M13.8 9a6.3 8.3 0 0 1-1.8 1.4'/%3E%3Cpath d='M13.8 9a6.3 8.3 0 0 1 2.2.4'/%3E%3Cpath d='M13.8 9a6.3 8.3 0 0 0 2.2.4'/%3E%3Cpath d='M14 22h-2a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h2'/%3E%3Cpath d='M18 22h2a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2h-2'/%3E%3Cpath d='M8 14v3'/%3E%3Cpath d='M20 14v3'/%3E%3C/svg%3E") center/contain no-repeat}
.listen-item{display:flex;align-items:flex-start;gap:10px;padding:8px 10px;margin:5px 0;font-size:14px;line-height:1.5;color:var(--accent-ink);background:#fff;border:1.5px solid #DEE5FD;border-radius:8px;font-weight:500}
.listen-dot{width:8px;height:8px;border-radius:50%;background:var(--accent);flex:0 0 auto;margin-top:5px}

/* Coaching — secondary, reduced visual weight */
.coach-block{background:#FBF1DE;border:1.5px solid #F0D9A6;border-radius:10px;padding:14px 16px;margin:12px 0;opacity:.95}
.coach-head{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--instr);margin-bottom:10px;display:flex;align-items:center;gap:7px}
.coach-head::before{content:'';width:18px;height:18px;border-radius:5px;background:var(--instr);display:inline-block;mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z'/%3E%3Cpath d='M12 16v-4'/%3E%3Cpath d='M12 8h.01'/%3E%3C/svg%3E") center/contain no-repeat;-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z'/%3E%3Cpath d='M12 16v-4'/%3E%3Cpath d='M12 8h.01'/%3E%3C/svg%3E") center/contain no-repeat}
.coach-note{padding:8px 11px;margin:5px 0;font-size:13px;line-height:1.5;background:#fff;border:1.5px solid #F0D9A6;border-radius:8px;color:var(--instr);font-style:italic;display:flex;align-items:flex-start;gap:9px}
.coach-note.goal{margin-top:14px;font-style:normal;border-color:var(--line)}
.coach-dot{width:6px;height:6px;border-radius:50%;background:var(--instr-line);flex:0 0 auto;margin-top:6px}

/* Responsive stepper */
@media(max-width:860px){
  .stepper{overflow-x:auto;scrollbar-width:none}
  .stepper::-webkit-scrollbar{display:none}
  .step{min-width:70px}
}

/* team */

/* ============================================================
   Enterprise DataTable (dt-)
   ============================================================ */
.dt-wrap{position:relative}
.dt-header{display:flex;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap}
.dt-search{flex:1;min-width:220px;position:relative}
.dt-search input{width:100%;padding:9px 12px 9px 36px;border:1px solid var(--line);border-radius:10px;font-size:13.5px;background:#FBFCFE;transition:.12s}
.dt-search input:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px rgba(43,76,240,.1)}
.dt-search-icon{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--faint);pointer-events:none}
.dt-search-clear{position:absolute;right:8px;top:50%;transform:translateY(-50%);display:flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;border:none;background:transparent;color:var(--faint);cursor:pointer;padding:0}
.dt-search-clear:hover{background:var(--line-soft);color:var(--muted)}
.dt-view-toggle{display:flex;align-items:center;gap:0;background:var(--card);border:1px solid var(--line);border-radius:9px;overflow:hidden}
.dt-view-toggle button{padding:7px 12px;font-size:12.5px;font-weight:600;border:none;background:transparent;color:var(--muted);cursor:pointer;transition:.12s;display:flex;align-items:center;gap:6px}
.dt-view-toggle button.on{background:var(--accent);color:#fff}
.dt-view-toggle button:not(.on):hover{color:var(--ink);background:var(--line-soft)}

/* KPI bar */
.dt-kpi{display:flex;align-items:center;gap:18px;flex-wrap:wrap;padding:14px 18px;background:var(--card);border:1px solid var(--line);border-radius:14px;margin-bottom:14px}
.dt-kpi-label{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:4px}
.dt-kpi-value{font-family:'Space Grotesk';font-weight:700;font-size:22px;letter-spacing:-0.02em;color:var(--ink)}
.dt-kpi-stat{display:flex;flex-direction:column;cursor:pointer;transition:.12s;padding:4px 8px;border-radius:8px}
.dt-kpi-stat:hover{background:var(--line-soft)}
.dt-kpi-stat.on{background:rgba(43,76,240,.08)}
.dt-kpi-stat .lbl{font-size:12px;font-weight:600;color:var(--muted);margin-top:2px}
.dt-kpi-dot{width:8px;height:8px;border-radius:50%;display:inline-block;margin-right:5px}

/* Filter panel */
.dt-filter-bar{display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap}
.dt-filter-btn{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;color:var(--muted);background:var(--card);border:1px solid var(--line);border-radius:9px;padding:7px 12px;cursor:pointer;transition:.12s}
.dt-filter-btn:hover{border-color:var(--faint);color:var(--ink)}
.dt-filter-btn.on{background:var(--accent-bg);color:var(--accent-ink);border-color:rgba(43,76,240,.2)}
.dt-filter-btn .count{font-size:10px;font-weight:700;background:var(--accent);color:#fff;padding:1px 5px;border-radius:10px;margin-left:2px}
.dt-filter-panel{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px;margin-bottom:14px;display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px}
.dt-filter-group{display:flex;flex-direction:column;gap:5px}
.dt-filter-group label{font-size:12px;font-weight:600;color:var(--muted)}
.dt-filter-group .fsel,.dt-filter-group .finp{font-size:13px;padding:8px 10px}
.dt-date-presets{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
.dt-date-preset{font-size:11.5px;font-weight:600;padding:4px 10px;border-radius:20px;border:1px solid var(--line);background:#FBFCFE;color:var(--muted);cursor:pointer;transition:.12s}
.dt-date-preset:hover{border-color:var(--faint);color:var(--ink)}
.dt-date-preset.on{background:var(--accent);color:#fff;border-color:var(--accent)}
.dt-filter-actions{display:flex;gap:8px;justify-content:flex-end;grid-column:1/-1;padding-top:8px;border-top:1px solid var(--line-soft)}

/* Table */
.dt-table{width:100%;border-collapse:separate;border-spacing:0;font-size:13px;table-layout:auto}
.dt-table th{background:var(--bg);border-bottom:1.5px solid var(--line);padding:10px 12px;text-align:left;font-size:11.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--muted);white-space:nowrap;user-select:none;cursor:pointer;transition:.12s}
.dt-table th:hover{color:var(--ink);background:var(--card)}
.dt-table th .sort{opacity:.5;margin-left:4px;font-size:10px}
.dt-table th.sort-asc .sort,.dt-table th.sort-desc .sort{opacity:1;color:var(--accent)}
.dt-table td{padding:12px;border-bottom:1px solid var(--line-soft);vertical-align:middle;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px}
.dt-table tr{transition:.12s}
.dt-table tbody tr:hover{background:var(--card)}
.dt-table tbody tr.sel{background:var(--accent-bg)}
.dt-table .dt-empty-cell{padding:40px;text-align:center;color:var(--muted)}
.dt-table .dt-script-name{font-family:'Space Grotesk';font-weight:600;font-size:14px;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dt-table .dt-script-meta{font-size:12px;color:var(--muted);margin-top:2px}
.dt-table .dt-pill{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;padding:3px 9px;border-radius:20px;background:var(--card);color:var(--muted)}
.dt-table .dt-pill.ok{background:#E6F6EF;color:var(--ok)}
.dt-table .dt-pill.warn{background:var(--amber-bg);color:var(--amber)}
.dt-table .dt-pill.bad{background:#FDF2F2;color:var(--aggressive)}
.dt-table .dt-pill.accent{background:var(--accent-bg);color:var(--accent-ink)}

/* Bulk toolbar */
.dt-bulk{position:sticky;top:0;z-index:20;display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--accent-bg);border:1px solid #C4D0F9;border-radius:10px;margin-bottom:12px;font-size:13px}
.dt-bulk-count{font-weight:700;color:var(--accent-ink)}
.dt-bulk-actions{display:flex;gap:8px;align-items:center;margin-left:auto}
.dt-bulk-btn{font-size:12.5px;font-weight:600;padding:6px 12px;border-radius:8px;border:none;cursor:pointer;transition:.12s;display:inline-flex;align-items:center;gap:5px;background:transparent;color:var(--accent-ink)}
.dt-bulk-btn:hover{background:rgba(43,76,240,.12)}
.dt-bulk-btn.danger{color:var(--aggressive)}
.dt-bulk-btn.danger:hover{background:#FDF2F2}

/* Row action dropdown */
.dt-actions{position:relative}
.dt-more-btn{width:28px;height:28px;border-radius:7px;border:none;background:transparent;color:var(--faint);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:.12s}
.dt-more-btn:hover{background:var(--line-soft);color:var(--ink)}
.dt-dropdown{position:fixed;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:6px;box-shadow:0 8px 24px rgba(0,0,0,.12);z-index:100;min-width:180px}
.dt-dropdown-item{display:flex;align-items:center;gap:8px;width:100%;padding:7px 10px;border-radius:7px;font-size:13px;font-weight:500;color:var(--ink);background:transparent;border:none;cursor:pointer;transition:.12s;text-align:left}
.dt-dropdown-item:hover{background:var(--line-soft)}
.dt-dropdown-item.danger{color:var(--aggressive)}
.dt-dropdown-item.danger:hover{background:#FDF2F2}
.dt-dropdown-sep{height:1px;background:var(--line-soft);margin:5px 0}
.dt-dropdown-label{font-size:10.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--faint);padding:4px 10px}

/* Column visibility popover */
.dt-col-popover{position:absolute;right:0;top:100%;margin-top:6px;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px;box-shadow:0 10px 30px rgba(0,0,0,.14);z-index:30;min-width:220px}
.dt-col-popover-title{font-family:'Space Grotesk';font-weight:700;font-size:14px;margin-bottom:10px}
.dt-col-item{display:flex;align-items:center;gap:10px;padding:6px 0;font-size:13px;color:var(--ink);cursor:pointer;user-select:none}
.dt-col-item input{margin:0}

/* Density */
.dt-dense .dt-table td{padding:8px 12px;font-size:12.5px}
.dt-dense .dt-table th{padding:8px 12px;font-size:11px}
.dt-dense .dt-script-name{font-size:13px}
.dt-dense .dt-kpi{padding:10px 14px;gap:12px}
.dt-dense .dt-kpi-value{font-size:18px}

/* Empty states */
.dt-empty{background:var(--card);border:1.5px dashed var(--line);border-radius:16px;padding:48px 24px;text-align:center}
.dt-empty .title{font-family:'Space Grotesk';font-weight:600;font-size:18px;margin-bottom:8px}
.dt-empty p{color:var(--muted);max-width:420px;margin:0 auto 18px;line-height:1.55;font-size:14px}
.dt-empty .sub{font-size:12px;color:var(--faint);margin-top:8px}

/* Table skeleton */
.dt-skeleton-row{display:grid;grid-template-columns:40px 1fr 120px 100px 90px 100px 60px;gap:12px;align-items:center;padding:12px;border-bottom:1px solid var(--line-soft)}
.dt-skeleton-cell{height:14px;border-radius:6px;background:var(--line-soft);animation:dtPulse 1.6s ease-in-out infinite}
.dt-skeleton-cell.wide{grid-column:span 2}
.dt-skeleton-cell.short{width:60%}
@keyframes dtPulse{0%,100%{opacity:.6}50%{opacity:.3}}

/* scripts library */
.lib-filters{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px}
.lib-filters .fsel{width:auto;min-width:150px}
.lib-search{width:auto;flex:1;min-width:180px}
.lib-toolbar{display:flex;align-items:center;gap:16px;padding:8px 4px;margin-bottom:10px;border-bottom:1px solid var(--line-soft)}
.lib-selall{display:flex;align-items:center;gap:9px;font-size:13px;font-weight:600;color:var(--muted);cursor:pointer;user-select:none}
.lib-count{font-size:12.5px;color:var(--muted);font-weight:600}
.lib-list{display:flex;flex-direction:column;gap:10px}
.lib-row{display:flex;align-items:center;gap:14px;background:var(--card);border:1px solid var(--line);border-radius:13px;padding:15px 17px;transition:.12s}
.lib-row.sel{border-color:var(--accent);background:var(--accent-bg)}
.lib-lead{display:flex;align-items:center;gap:10px;flex:0 0 auto}
.lib-num{font-family:'Space Grotesk';font-weight:700;font-size:14px;color:var(--faint);min-width:20px;text-align:right}
.lib-main{flex:1;min-width:0}
.lib-prod{font-family:'Space Grotesk';font-weight:600;font-size:16px;margin-bottom:9px}
.lib-chips{display:flex;flex-wrap:wrap;gap:7px}
.lib-date{font-size:11.5px;color:var(--faint);margin-top:9px}
.lib-actions{display:flex;align-items:center;gap:8px;flex:0 0 auto}
@media(max-width:640px){.lib-row{flex-wrap:wrap}.lib-actions{width:100%;justify-content:flex-end}}
.chip.miss{background:var(--instr-bg);color:var(--instr);border:1px dashed var(--instr-line)}
.sync-progress{display:flex;align-items:center;gap:10px;padding:11px 14px;background:var(--accent-bg);border:1px solid #C4D0F9;border-radius:10px;font-size:13.5px;color:var(--accent-ink);margin-bottom:12px}

/* training */
.tr-tabs{display:flex;gap:4px;border-bottom:1px solid var(--line);margin-bottom:22px;flex-wrap:wrap}
.tr-tab{padding:11px 18px;font-size:14px;font-weight:600;color:var(--muted);cursor:pointer;border-bottom:2px solid transparent;transition:.13s}
.tr-tab:hover{color:var(--ink)}
.tr-tab.on{color:var(--accent);border-bottom-color:var(--accent)}
.tr-intro{color:var(--muted);font-size:14px;line-height:1.55;margin:0 0 18px;max-width:720px}
.tr-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}
.tr-card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px;cursor:pointer;transition:.14s;display:flex;flex-direction:column;gap:11px;min-height:180px}
.tr-card:hover{border-color:var(--accent);transform:translateY(-2px);box-shadow:0 10px 26px -14px rgba(43,76,240,.35)}
.tr-card-top{display:flex;justify-content:space-between;align-items:center;gap:8px}
.tr-emoji{font-size:26px;line-height:1}
.stage-tag{font-size:10.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);background:var(--card);padding:3px 9px;border-radius:20px;border:1px solid var(--line)}
.tr-card-name{font-family:'Space Grotesk';font-weight:700;font-size:19px;letter-spacing:-0.02em}
.tr-card-idea{font-size:13.5px;color:var(--muted);line-height:1.5;flex:1}
.tr-card-foot{font-size:12px;color:var(--accent);font-weight:600;border-top:1px solid var(--line-soft);padding-top:11px}

.tr-detail{max-width:820px}
.tr-hero{display:flex;gap:18px;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:22px;margin:6px 0 20px}
.tr-hero-emoji{font-size:52px;line-height:1;flex:0 0 auto}
.tr-hero-name{font-family:'Space Grotesk';font-weight:700;font-size:28px;letter-spacing:-0.02em}
.tr-hero-origin{color:var(--muted);font-size:13.5px;margin-top:3px}
.tr-hero-tags{display:flex;gap:8px;margin-top:11px;flex-wrap:wrap}
.tr-block{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:18px 20px;margin-bottom:14px}
.tr-block p{margin:0;line-height:1.65;font-size:14.5px}
.tr-block ul{margin:6px 0 0;padding-left:20px}
.tr-block li{line-height:1.6;font-size:14px;margin:5px 0}
.tr-block.warn{background:var(--amber-bg);border-color:#F0D9A6}
.tr-h{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:9px}
.tr-lead{font-family:'Space Grotesk';font-size:17px !important;font-weight:500;color:var(--ink);line-height:1.5 !important}
.tr-two{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}
.tr-side{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px 18px}
.tr-side.good{background:#EDF9F2;border-color:#B9E1CA}
.tr-side.bad{background:#FDF2F2;border-color:#F0C9CA}
.tr-side-h{font-family:'Space Grotesk';font-weight:700;font-size:14.5px;margin-bottom:8px}
.tr-side ul{margin:0;padding-left:20px}
.tr-side li{line-height:1.55;font-size:13.5px;margin:5px 0}
.tr-ol{margin:6px 0 0;padding-left:22px;counter-reset:step}
.tr-ol li{line-height:1.6;font-size:14px;margin:8px 0;padding-left:4px}
.tr-signature{background:var(--ink);color:#fff;border-radius:14px;padding:22px;margin-top:8px}
.tr-signature .tr-h{color:#8AA0FF !important}
@media(max-width:640px){.tr-two{grid-template-columns:1fr}.tr-hero-emoji{font-size:40px}.tr-hero-name{font-size:22px}}

/* comparison tables */
.guide-tabs{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px}
.gtab{padding:8px 14px;font-size:13px;font-weight:600;background:var(--card);border:1px solid var(--line);border-radius:8px;cursor:pointer;color:var(--muted);transition:.12s}
.gtab:hover{border-color:var(--faint);color:var(--ink)}
.gtab.on{background:var(--accent);color:#fff;border-color:var(--accent)}
.tbl-wrap{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:22px;margin-bottom:16px}
.tbl-title{font-family:'Space Grotesk';font-weight:700;font-size:20px;letter-spacing:-0.02em;margin-bottom:5px}
.tbl-sub{color:var(--muted);font-size:13.5px;line-height:1.5;margin-bottom:16px}
.tbl-scroll{overflow-x:auto;margin:0 -6px;padding:0 6px}
.ptbl{width:100%;border-collapse:collapse;font-size:13.5px;min-width:640px}
.ptbl th{text-align:left;padding:11px 12px;font-weight:700;color:var(--muted);text-transform:uppercase;font-size:11px;letter-spacing:.06em;border-bottom:1.5px solid var(--line);background:var(--bg);position:sticky;top:0}
.ptbl td{padding:12px;border-bottom:1px solid var(--line-soft);line-height:1.55;vertical-align:top}
.ptbl tr:hover td{background:var(--card)}
.ptbl td.q{font-style:italic;color:var(--accent-ink)}
.ptbl.matrix td:first-child{white-space:nowrap}
.mx-yes{color:var(--ok);font-size:18px;font-weight:700}
.mx-no{color:var(--faint)}

.staff{display:flex;align-items:center;gap:14px;padding:14px 16px;border:1px solid var(--line);border-radius:12px;background:var(--card);margin-bottom:10px}
.avatar{width:40px;height:40px;flex:0 0 auto;border-radius:10px;background:var(--accent-bg);color:var(--accent-ink);font-family:'Space Grotesk';font-weight:700;display:flex;align-items:center;justify-content:center;font-size:15px}
.staff .info{flex:1;min-width:0}
.staff .nm{font-weight:600;font-size:14.5px}
.staff .rl{font-size:12.5px;color:var(--muted)}
.staff .acc{font-size:12px;color:var(--faint)}

/* misc */
/* mobile / PWA */
@media(max-width:860px){
  .ps-shell{flex-direction:column}
  .ps-side{width:100%;flex:none;height:auto;position:static;padding:14px 14px 6px;flex-direction:row;align-items:center;flex-wrap:wrap;gap:6px;overflow:visible}
  .ps-nav-scroll{flex-direction:row;flex-wrap:wrap;overflow:visible;padding-right:0;margin-right:0}
  .ps-brand{margin-bottom:0;padding:0}
  .ps-co{margin-bottom:0;padding:0;font-size:10px}
  .ps-nav{padding:7px 10px;font-size:13px}
  .ps-nav .ic{font-size:14px}
  .ps-nav-label{display:none}
  .ps-side-foot{display:none}
  .ps-top{padding:18px 18px 0}
  .ps-body{padding:16px 18px 40px}
  .pd-top{padding:18px 18px 0}
  .pd-tabs{padding:0 18px}
  .cockpit{grid-template-columns:1fr}
  .obj-panel{position:static}
  .method-grid,.ct-grid{grid-template-columns:1fr}
  .ps-grid{grid-template-columns:1fr}
  .tr-grid{grid-template-columns:1fr}
  .lib-filters .fsel{min-width:120px}
  .lib-search{min-width:140px}
}
@media(max-width:560px){
  .ps-top{flex-direction:column;align-items:flex-start}
  .ps-title{font-size:22px}
  .ps-top-actions{gap:6px}
  .ps-top-actions .ps-btn{padding:6px 10px;font-size:12px}
  .ps-body{padding:14px 14px 32px}
  .pd-top{padding:14px 14px 0}
  .pd-tabs{padding:0 14px}
  .lib-filters .fsel,.lib-filters .lib-search{width:100%}
  .lib-toolbar{flex-wrap:wrap;gap:8px}
  .lib-actions{width:100%;justify-content:flex-end;margin-top:8px}
  .lib-row{flex-wrap:wrap;padding:12px 14px}
  .ps-form{padding:18px}
  .frow.two{grid-template-columns:1fr}
  .genbar .summary{font-size:12.5px}
}
/* install prompt */
.pwa-install{display:none}

.spinner{width:15px;height:15px;border:2px solid rgba(255,255,255,.35);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;display:inline-block}
.spinner.dark{border-color:rgba(43,76,240,.25);border-top-color:var(--accent)}
@keyframes spin{to{transform:rotate(360deg)}}
.err{background:#FDF2F2;border:1px solid #F0C9CA;color:#B23237;border-radius:10px;padding:12px 14px;font-size:13px;line-height:1.5;margin-top:14px}
.crumb{font-size:13px;color:var(--muted);cursor:pointer;display:inline-flex;align-items:center;gap:6px;margin-bottom:2px}
.crumb:hover{color:var(--accent)}
.overlay{position:fixed;inset:0;background:rgba(19,26,36,.55);display:flex;align-items:center;justify-content:center;z-index:50;padding:20px;overflow-y:auto;overscroll-behavior:contain}
.modal{background:#fff;border-radius:16px;padding:26px;max-width:440px;width:100%;max-height:90vh;overflow-y:auto;box-sizing:border-box}
.ps-root:has(.overlay),.ps-root:has(.ps-overlay){overflow:hidden;height:100vh}

/* loading + streaming */
.loading-box{display:flex;flex-direction:column;align-items:center;gap:12px;padding:34px 24px;text-align:center}
.loading-box .ring{width:36px;height:36px;border:3px solid rgba(43,76,240,.15);border-top-color:var(--accent);border-radius:50%;animation:spin .7s linear infinite}
.loading-box .msg{font-weight:700;font-size:16px;color:var(--ink)}
.loading-box .sub{color:var(--muted);font-size:13px;max-width:420px}
.stream-wrap{width:100%;text-align:left;margin-top:10px}
.stream-status{display:flex;align-items:center;gap:10px;margin-bottom:10px;font-size:13px;font-weight:600;color:var(--accent)}
.stream-status .dot{width:8px;height:8px;border-radius:50%;background:var(--accent);animation:pulse 1.2s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
.stream-preview{background:var(--surface);border:1px solid #E3E8F1;border-radius:10px;padding:12px 14px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:12px;line-height:1.5;color:var(--muted);max-height:220px;overflow:auto;white-space:pre-wrap;word-break:break-word}

/* practice */
.practice-scenario{background:var(--surface);border:1px solid var(--line-soft);border-radius:14px;padding:20px;margin-bottom:18px}
.practice-label{font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--accent);margin-bottom:8px}
.practice-buyer{font-family:'Space Grotesk';font-size:18px;font-weight:500;line-height:1.45;color:var(--ink)}
.practice-scores{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:18px;align-items:flex-end}
.practice-score{flex:1;min-width:120px}
.practice-score .ps-label{font-size:11.5px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px}
.practice-score .ps-bar-wrap{height:8px;background:var(--line-soft);border-radius:4px;overflow:hidden;margin-bottom:6px}
.practice-score .ps-bar{height:100%;border-radius:4px;transition:width .6s ease}
.practice-score .ps-val{font-family:'Space Grotesk';font-weight:700;font-size:22px}
.practice-total{flex:0 0 auto;text-align:center;padding-left:16px;border-left:1px solid var(--line-soft)}
.practice-total .ps-label{font-size:11.5px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px}
.practice-total .ps-total-val{font-family:'Space Grotesk';font-weight:700;font-size:36px}
.practice-history{display:flex;flex-direction:column;gap:10px}
.ph-row{display:flex;align-items:center;gap:14px;padding:10px 12px;border:1px solid var(--line-soft);border-radius:10px;background:#FBFCFE}
.ph-info{flex:1;min-width:0}
.ph-prod{font-weight:600;font-size:13.5px;margin-bottom:3px}
.ph-line{font-size:12.5px;color:var(--muted);line-height:1.45;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ph-score{font-family:'Space Grotesk';font-weight:700;font-size:20px;min-width:36px;text-align:right}
@media(max-width:560px){.practice-scores{flex-direction:column;align-items:stretch}.practice-total{border-left:none;border-top:1px solid var(--line-soft);padding:12px 0 0;text-align:left;display:flex;align-items:center;gap:10px}.practice-total .ps-total-val{font-size:28px}}

/* P5.5: AI Role-play */
.rp-chat{display:flex;flex-direction:column;gap:14px;max-width:720px}
.rp-bubble{display:flex;gap:12px;align-items:flex-start}
.rp-bubble.rep{flex-direction:row-reverse}
.rp-avatar{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;flex:0 0 auto}
.rp-avatar.buyer{background:#FDF2F2}
.rp-avatar.rep{background:#E6F6EF}
.rp-msg{max-width:80%;padding:12px 14px;border-radius:14px;font-size:14.5px;line-height:1.55}
.rp-msg.buyer{background:var(--card);border:1px solid var(--line);border-bottom-left-radius:4px;color:var(--ink)}
.rp-msg.rep{background:var(--accent);color:#fff;border-bottom-right-radius:4px}
.rp-meta{font-size:11px;color:var(--faint);margin-top:4px}
.rp-input-wrap{display:flex;gap:10px;align-items:flex-end;margin-top:14px}
.rp-input{flex:1;border:1px solid var(--line);border-radius:12px;padding:12px 14px;font-family:'Inter';font-size:14px;color:var(--ink);background:#FBFCFE;resize:vertical;min-height:60px}
.rp-input:focus{outline:none;border-color:var(--accent);background:#fff;box-shadow:0 0 0 3px rgba(43,76,240,.12)}
.rp-send{background:var(--accent);color:#fff;border:none;border-radius:10px;padding:10px 16px;font-weight:600;font-size:13.5px;cursor:pointer;transition:.12s}
.rp-send:hover{background:var(--accent-ink)}
.rp-send:disabled{opacity:.5;cursor:not-allowed}
.rp-hint{background:var(--surface);border:1px dashed var(--line);border-radius:10px;padding:12px 14px;font-size:13px;color:var(--muted);line-height:1.5;margin-top:10px}
.rp-hint b{color:var(--ink)}
.rp-end{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:22px;margin-top:14px}
.rp-end-h{font-family:'Space Grotesk';font-weight:700;font-size:18px;margin-bottom:14px}
.rp-turns{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--faint);margin-bottom:14px}
.rp-suggestion{background:#FBFCFE;border:1.5px dashed var(--line);border-radius:10px;padding:10px 12px;font-size:13px;color:var(--muted);cursor:pointer;transition:.12s;margin-bottom:8px}
.rp-suggestion:hover{border-color:var(--accent);background:var(--accent-bg);color:var(--accent-ink)}
.rp-tts-btn{background:transparent;border:none;padding:2px 6px;border-radius:6px;font-size:13px;cursor:pointer;color:var(--faint);margin-left:6px;vertical-align:middle;transition:.12s}
.rp-tts-btn:hover{background:var(--accent-bg);color:var(--accent-ink)}

/* ============================================================
   Role-play Simulator (rp-) — P9 rebuild
   ============================================================ */
/* Setup grid */
.rp-setup-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:start}
@media(max-width:860px){.rp-setup-grid{grid-template-columns:1fr}}

/* Product context card */
.rp-context-card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin-top:12px}
.rp-context-h{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:10px}
.rp-context-row{display:flex;align-items:flex-start;gap:8px;font-size:13px;line-height:1.5;color:var(--ink);margin-bottom:6px}
.rp-context-row:last-child{margin-bottom:0}
.rp-context-label{font-weight:600;color:var(--muted);min-width:90px;flex-shrink:0}
.rp-context-value{flex:1;color:var(--ink)}

/* Persona selector cards */
.rp-persona-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;margin-top:8px}
.rp-persona-card{background:var(--card);border:1.5px solid var(--line);border-radius:10px;padding:12px;cursor:pointer;transition:.13s;text-align:center}
.rp-persona-card:hover{border-color:var(--faint)}
.rp-persona-card.on{border-color:var(--accent);background:var(--accent-bg)}
.rp-persona-card .label{font-family:'Space Grotesk';font-weight:600;font-size:13px;margin-bottom:2px}
.rp-persona-card .hint{font-size:11px;color:var(--faint);line-height:1.35}

/* Difficulty cards */
.rp-diff-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:8px}
@media(max-width:640px){.rp-diff-grid{grid-template-columns:repeat(2,1fr)}}
.rp-diff-card{background:var(--card);border:1.5px solid var(--line);border-radius:10px;padding:12px;cursor:pointer;transition:.13s;text-align:center}
.rp-diff-card:hover{border-color:var(--faint)}
.rp-diff-card.on{border-color:var(--accent);background:var(--accent-bg)}
.rp-diff-card .emoji{font-size:22px;line-height:1;margin-bottom:4px}
.rp-diff-card .label{font-family:'Space Grotesk';font-weight:600;font-size:13px;margin-bottom:3px}
.rp-diff-card .hint{font-size:11px;color:var(--faint);line-height:1.35}

/* Scenario box */
.rp-scenario{background:var(--surface);border:1.5px dashed var(--line);border-radius:12px;padding:16px 18px;font-size:14px;line-height:1.6;color:var(--ink);margin-top:12px}
.rp-scenario-label{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:6px}

/* Pre-call briefing */
.rp-briefing{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:28px 32px;max-width:600px;margin:0 auto}
.rp-briefing-h{font-family:'Space Grotesk';font-weight:700;font-size:20px;margin-bottom:6px;text-align:center}
.rp-briefing-sub{text-align:center;color:var(--muted);font-size:14px;margin-bottom:24px}
.rp-briefing-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:24px}
@media(max-width:560px){.rp-briefing-grid{grid-template-columns:1fr}}
.rp-briefing-item{background:var(--surface);border-radius:10px;padding:12px 14px}
.rp-briefing-item .lbl{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:4px}
.rp-briefing-item .val{font-size:13.5px;font-weight:600;color:var(--ink)}
.rp-briefing-scores{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:24px}
.rp-briefing-score-chip{font-size:11.5px;font-weight:600;color:var(--muted);background:var(--surface);padding:4px 10px;border-radius:20px}
.rp-briefing-cta{text-align:center}

/* Active chat layout */
.rp-active-wrap{display:grid;grid-template-columns:1fr 280px;gap:20px;align-items:start}
@media(max-width:900px){.rp-active-wrap{grid-template-columns:1fr}}
.rp-chat-area{min-width:0}
.rp-live-panel{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;position:sticky;top:16px}
.rp-live-panel-h{font-family:'Space Grotesk';font-weight:700;font-size:14px;margin-bottom:12px;display:flex;align-items:center;gap:6px}
.rp-live-dim{opacity:.5;filter:grayscale(.3)}
.rp-live-score-row{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.rp-live-score-row:last-child{margin-bottom:0}
.rp-live-score-label{font-size:12px;font-weight:600;color:var(--muted);min-width:100px}
.rp-live-score-bar{flex:1;height:5px;background:var(--line-soft);border-radius:3px;overflow:hidden}
.rp-live-score-bar-inner{height:100%;border-radius:3px;transition:width .4s ease}
.rp-live-score-val{font-size:12px;font-weight:700;color:var(--ink);min-width:28px;text-align:right}

/* Coach feedback cards */
.rp-coach-card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px;margin-bottom:14px}
.rp-coach-h{font-family:'Space Grotesk';font-weight:700;font-size:15px;margin-bottom:10px;display:flex;align-items:center;gap:7px}
.rp-coach-good{background:#EDF9F2;border-color:#B9E1CA}
.rp-coach-bad{background:#FDF2F2;border-color:#F0C9CA}
.rp-coach-insight{background:#EAEEFE;border-color:#C4D0F9}
.rp-coach-body{font-size:14px;line-height:1.65;color:var(--ink)}
.rp-coach-body ul{margin:8px 0 0 18px;padding:0}
.rp-coach-body li{margin-bottom:5px}

/* Score circle */
.rp-score-circle{width:72px;height:72px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Space Grotesk';font-weight:700;font-size:26px;color:#fff;flex-shrink:0}

/* component library */
.comp-grid{display:grid;gap:14px;grid-template-columns:repeat(auto-fill,minmax(300px,1fr))}
.comp-card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px;display:flex;flex-direction:column;gap:10px}
.comp-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.comp-type{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:4px 10px;border-radius:20px}
.comp-name{font-family:'Space Grotesk';font-weight:600;font-size:16px}
.comp-content{font-size:14px;line-height:1.55;color:var(--muted);font-style:italic;padding:10px 12px;background:var(--surface);border-radius:9px;border-left:3px solid var(--accent)}
.comp-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}
@media(max-width:560px){.comp-grid{grid-template-columns:1fr}}

/* persona templates */
.persona-grid{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));margin-top:10px}
.persona-card{background:var(--card);border:1.5px solid var(--line);border-radius:12px;padding:14px;cursor:pointer;transition:.13s;text-align:center}
.persona-card:hover{border-color:var(--faint)}
.persona-card.on{border-color:var(--accent);background:var(--accent-bg)}
.persona-emoji{font-size:28px;line-height:1;margin-bottom:8px}
.persona-name{font-family:'Space Grotesk';font-weight:600;font-size:13.5px;margin-bottom:3px}
.persona-title{font-size:11.5px;color:var(--muted);line-height:1.4}
.persona-detail{background:var(--surface);border:1px solid var(--line-soft);border-radius:12px;padding:16px 18px;margin-top:12px}
.persona-field{font-size:13px;line-height:1.55;color:var(--muted);margin-bottom:6px}
.persona-field b{color:var(--ink)}
@media(max-width:560px){.persona-grid{grid-template-columns:repeat(2,1fr)}}

/* call cockpit */
.call-cockpit{position:fixed;inset:0;background:#0F1724;color:#E2E8F0;z-index:100;display:flex;flex-direction:column;padding:18px 22px;font-family:'Inter',system-ui,sans-serif;overflow:auto}
.call-top{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:14px;flex-wrap:wrap}
.call-timer-wrap{text-align:center}
.call-timer{font-family:'Space Grotesk';font-size:48px;font-weight:700;letter-spacing:-0.02em;color:#fff;line-height:1}
.call-timer.over{color:var(--aggressive)}
.call-timer-label{font-size:12px;color:#94A3B8;margin-top:4px;text-transform:uppercase;letter-spacing:.08em}
.call-controls{display:flex;gap:10px}
.call-btn{font-family:'Inter';font-weight:700;font-size:13.5px;border:none;border-radius:10px;padding:10px 16px;cursor:pointer;background:#1E293B;color:#fff;transition:.12s}
.call-btn.pri{background:#3B82F6;color:#fff}
.call-btn.pri:hover{background:#2563EB}
.call-btn:hover{background:#334155}
.call-btn.ghost{background:transparent;border:1.5px solid #334155;color:#CBD5E1}
.call-btn.ghost:hover{border-color:#475569}
.call-btn.danger{background:transparent;border:1.5px solid #7F1D1D;color:#FCA5A5}
.call-btn.danger:hover{border-color:#B91C1C}
.call-btn.sm{padding:7px 12px;font-size:12.5px}
.call-auto-pause{background:#1E3A5F;border:1px solid #3B82F6;border-radius:10px;padding:12px 16px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:13.5px}
.call-timeline{display:flex;gap:8px;justify-content:center;margin-bottom:14px}
.call-tl-dot{width:10px;height:10px;border-radius:50%;background:#334155;cursor:pointer;transition:.15s}
.call-tl-dot.done{background:#0B7A5B}
.call-tl-dot.active{background:#3B82F6;box-shadow:0 0 0 4px rgba(59,130,246,.25)}
.call-seg-nav{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:14px;padding:10px 14px;background:#1E293B;border-radius:12px}
.call-seg-title{display:flex;align-items:center;gap:10px;font-family:'Space Grotesk';font-weight:700;font-size:16px;flex:1;justify-content:center}
.call-seg-num{width:30px;height:30px;border-radius:8px;background:#3B82F6;color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px}
.call-seg-time{font-size:12px;color:#94A3B8;font-weight:500;margin-left:8px}
.call-content{flex:1;overflow-y:auto;padding:4px 2px}
.call-goal{background:#1E293B;border-left:3px solid #3B82F6;border-radius:0 10px 10px 0;padding:12px 16px;margin-bottom:14px;font-size:14px;line-height:1.5}
.call-goal-tag{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#3B82F6;margin-bottom:4px;display:block}
.call-section{margin-bottom:16px}
.call-section-label{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#94A3B8;margin-bottom:8px}
.call-line{display:flex;align-items:flex-start;gap:12px;padding:10px 12px;background:#1E293B;border-radius:10px;margin-bottom:8px;font-size:16px;line-height:1.5;cursor:pointer;transition:.1s}
.call-line:hover{background:#334155}
.call-line.checked{color:#64748B;text-decoration:line-through}
.call-line.q .call-qmark{background:#3B82F6;color:#fff;border-radius:5px;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex:0 0 auto}
.call-ck{width:20px;height:20px;border:2px solid #475569;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:12px;color:transparent;flex:0 0 auto;margin-top:2px}
.call-ck.on{background:#0B7A5B;border-color:#0B7A5B;color:#fff}
.call-dot{color:#D97706;margin-right:8px;flex:0 0 auto}
.call-line.coach{color:#CBD5E1;font-size:14px;font-style:italic;background:#0F1724;border:1px dashed #334155;cursor:default}
.call-line.coach:hover{background:#0F1724}
.call-bottom{margin-top:auto;padding-top:12px;border-top:1px solid #1E293B;font-size:12px;color:#64748B;text-align:center}
@media(max-width:560px){
  .call-timer{font-size:36px}
  .call-top{flex-direction:column;align-items:stretch}
  .call-controls{justify-content:center}
  .call-line{font-size:15px}
}

/* P4: AI Sales Copilot — battle cards + live objection */
.call-copilot{display:grid;grid-template-columns:1fr 320px;gap:14px}
@media(max-width:860px){.call-copilot{grid-template-columns:1fr}}
.battle-panel{background:#1E293B;border:1px solid #334155;border-radius:12px;padding:14px;max-height:40vh;overflow-y:auto}
.battle-panel .bp-h{font-family:'Space Grotesk';font-weight:700;font-size:13px;color:#8AA0FF;margin-bottom:10px;display:flex;align-items:center;gap:6px}
.battle-card{background:#0F1724;border:1px solid #334155;border-radius:10px;padding:12px;margin-bottom:10px}
.battle-card .bc-title{font-weight:600;font-size:13.5px;color:#fff;margin-bottom:6px}
.battle-card .bc-body{font-size:13px;color:#94A3B8;line-height:1.5}
.battle-card .bc-tag{font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:3px 8px;border-radius:20px;background:#3B82F6;color:#fff;display:inline-block;margin-bottom:6px}
.battle-card .bc-win{background:#0B7A5B;color:#fff;padding:8px 10px;border-radius:8px;font-size:12.5px;line-height:1.5;margin-top:8px}
.obj-live{background:#1E293B;border:1px solid #334155;border-radius:12px;padding:14px}
.obj-live .ol-h{font-family:'Space Grotesk';font-weight:700;font-size:13px;color:#8AA0FF;margin-bottom:10px;display:flex;align-items:center;gap:6px}
.obj-live-input{width:100%;background:#0F1724;border:1px solid #334155;border-radius:9px;padding:10px 12px;font-family:'Inter';font-size:14px;color:#E2E8F0;resize:vertical;min-height:60px}
.obj-live-input:focus{outline:none;border-color:#3B82F6}
.obj-live-btn{background:#3B82F6;color:#fff;border:none;border-radius:8px;padding:8px 14px;font-weight:600;font-size:13px;cursor:pointer;margin-top:8px}
.obj-live-btn:hover{background:#2563EB}
.obj-live-btn:disabled{opacity:.5;cursor:not-allowed}
.obj-alert{background:#7C2D12;border:1px solid #9A3412;border-radius:10px;padding:12px 14px;margin-top:10px;font-size:13.5px;line-height:1.55;color:#FED7AA}
.obj-alert .oa-title{font-weight:700;color:#FDBA74;margin-bottom:4px}
.obj-alert .oa-body{color:#E2E8F0}
.obj-alert .oa-score{font-size:11px;color:#FDBA74;margin-top:6px;opacity:.8}
.obj-mic{background:transparent;border:1.5px solid #334155;color:#CBD5E1;border-radius:8px;padding:6px 12px;font-size:12.5px;cursor:pointer;margin-left:8px}
.obj-mic:hover{border-color:#3B82F6;color:#3B82F6}
.obj-mic.on{background:#3B82F6;color:#fff;border-color:#3B82F6}

/* self-improving AI */
.ai-dashboard{display:flex;flex-direction:column;gap:18px}
.ai-stat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px}
.ai-stat{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px;text-align:center}
.ai-stat .val{font-family:'Space Grotesk';font-weight:700;font-size:32px;color:var(--accent)}
.ai-stat .lbl{font-size:12.5px;color:var(--muted);font-weight:600}
.ai-section{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:20px}
.ai-section-h{font-family:'Space Grotesk';font-weight:700;font-size:16px;margin-bottom:14px;display:flex;align-items:center;gap:8px}
.ai-patterns{display:flex;flex-direction:column;gap:10px}
.ai-row{display:flex;align-items:center;gap:14px;padding:12px 14px;border:1px solid var(--line-soft);border-radius:10px;background:#FBFCFE}
.ai-row .method{font-size:13.5px;font-weight:600;flex:1}
.ai-row .badge{font-size:11px;font-weight:700;padding:3px 9px;border-radius:20px;background:#E6F6EF;color:var(--ok)}
.ai-row .rate{font-size:13.5px;font-weight:600;color:var(--accent);min-width:50px;text-align:right}
.ai-row .bar{flex:1;height:6px;background:var(--line-soft);border-radius:3px;overflow:hidden}
.ai-row .bar-inner{height:100%;background:var(--ok);border-radius:3px;transition:width .6s ease}
.ai-ab{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.ai-variant{background:#FBFCFE;border:1.5px dashed var(--line);border-radius:12px;padding:18px}
.ai-variant.on{border-color:var(--accent);background:var(--accent-bg);border-style:solid}
.ai-variant .vname{font-family:'Space Grotesk';font-weight:600;font-size:15px;margin-bottom:10px}
.ai-variant .vmeta{font-size:12px;color:var(--muted);margin-bottom:12px;line-height:1.45}
.ai-variant .vcontent{font-size:13.5px;line-height:1.6;color:var(--ink);background:#fff;border:1px solid var(--line-soft);border-radius:9px;padding:12px 14px}
@media(max-width:640px){.ai-stat-grid{grid-template-columns:repeat(2,1fr)}.ai-ab{grid-template-columns:1fr}}

/* P5.2: Print styles */
@media print{
  .ps-shell,.ps-side,.ps-top,.lang-switcher,.genbar,.ps-btn,.call-btn,.call-controls,.obj-panel,.ps-card,.overlay,.modal,.bt-bar{display:none !important}
  .ps-main{display:block !important}
  .ps-body{padding:0 !important}
  .print-overlay{display:block !important;position:static !important}
}
.print-overlay{display:none}

/* P5: Analytics Dashboard */
.analytics-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px}
.analytics-card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:20px}
.analytics-card .ac-val{font-family:'Space Grotesk';font-weight:700;font-size:36px;color:var(--ink);letter-spacing:-0.02em}
.analytics-card .ac-lbl{font-size:12.5px;color:var(--muted);font-weight:600;margin-top:6px}
.analytics-card .ac-change{font-size:12px;font-weight:600;margin-top:4px}
.analytics-card .ac-up{color:var(--ok)}
.analytics-card .ac-down{color:var(--aggressive)}
.chart-card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:20px}
.chart-card .chart-h{font-family:'Space Grotesk';font-weight:700;font-size:16px;margin-bottom:16px}
.bar-chart{display:flex;align-items:flex-end;gap:8px;height:160px;padding-bottom:24px;position:relative}
.bar-chart::after{content:'';position:absolute;bottom:0;left:0;right:0;height:1px;background:var(--line-soft)}
.bar-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;min-width:0}
.bar-fill{width:100%;border-radius:6px 6px 0 0;background:var(--accent);transition:height .6s ease;min-height:4px}
.bar-fill.win{background:var(--ok)}
.bar-fill.loss{background:var(--aggressive)}
.bar-label{font-size:10px;color:var(--faint);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%;text-align:center}
.bar-val{font-size:11px;font-weight:700;color:var(--ink)}
.leaderboard{display:flex;flex-direction:column;gap:8px}
.lb-row{display:flex;align-items:center;gap:12px;padding:10px 12px;border:1px solid var(--line-soft);border-radius:10px;background:#FBFCFE}
.lb-rank{width:28px;height:28px;border-radius:8px;background:var(--accent-bg);color:var(--accent-ink);display:flex;align-items:center;justify-content:center;font-family:'Space Grotesk';font-weight:700;font-size:12px;flex:0 0 auto}
.lb-rank.top{background:var(--accent);color:#fff}
.lb-name{flex:1;font-size:13.5px;font-weight:600}
.lb-stat{font-size:12px;color:var(--muted);font-weight:600}
.lb-bar{flex:1;height:6px;background:var(--line-soft);border-radius:3px;overflow:hidden;max-width:120px}
.lb-bar-inner{height:100%;background:var(--ok);border-radius:3px;transition:width .6s ease}

/* P5.4: Script Comments */
.comment-thread{display:flex;flex-direction:column;gap:12px}
.comment-item{display:flex;gap:10px;align-items:flex-start}
.comment-avatar{width:32px;height:32px;border-radius:50%;background:var(--accent-bg);color:var(--accent-ink);display:flex;align-items:center;justify-content:center;font-family:'Space Grotesk';font-weight:700;font-size:12px;flex:0 0 auto}
.comment-body{flex:1;min-width:0}
.comment-meta{display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap}
.comment-author{font-weight:600;font-size:13px}
.comment-time{font-size:11px;color:var(--faint)}
.comment-badge{font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:2px 8px;border-radius:20px}
.comment-badge.approval{background:#E6F6EF;color:var(--ok)}
.comment-badge.revision{background:var(--instr-bg);color:var(--instr)}
.comment-text{font-size:13.5px;line-height:1.55;color:var(--ink);background:var(--surface);border-radius:9px;padding:10px 12px}
.comment-input{display:flex;gap:8px;align-items:flex-start}
.comment-input .limited-field{flex:1;min-width:0}
.comment-input textarea{flex:1;border:1px solid var(--line);border-radius:10px;padding:10px 12px;font-family:'Inter';font-size:13.5px;color:var(--ink);background:#FBFCFE;resize:vertical;min-height:50px}
.comment-input textarea:focus{outline:none;border-color:var(--accent);background:#fff;box-shadow:0 0 0 3px rgba(43,76,240,.12)}
.comment-actions{display:flex;gap:6px;margin-top:4px}

/* P7: new components */
.ps-score-badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;letter-spacing:.02em}
.ps-success{color:#22c55e}
.ps-warning{color:#f59e0b}
.ps-accent{color:var(--accent)}
.ps-list{margin:6px 0 0 18px;padding:0;font-size:13px;line-height:1.6;color:var(--ink)}
.ps-list li{margin-bottom:4px}
.ps-error{color:var(--aggressive);font-size:13px;margin-top:8px}
.ps-callout{background:var(--accent-bg);border-left:3px solid var(--accent);border-radius:10px;padding:12px 14px;font-size:13px;color:var(--ink);line-height:1.5}
.ps-overlay{position:fixed;inset:0;background:rgba(15,23,36,.55);backdrop-filter:blur(4px);display:flex;align-items:flex-start;justify-content:center;z-index:1000;padding:20px;overflow-y:auto;overscroll-behavior:contain}
.ps-modal{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:24px;max-width:640px;width:100%;max-height:80vh;overflow:auto;box-shadow:0 24px 60px -20px rgba(0,0,0,.25);box-sizing:border-box}
.ps-table{width:100%;border-collapse:collapse;font-size:13px}
.ps-table th{text-align:left;padding:10px 12px;color:var(--faint);font-weight:600;border-bottom:1px solid var(--line-soft);white-space:nowrap}
.ps-table td{padding:10px 12px;border-bottom:1px solid var(--line-soft);vertical-align:middle;overflow:hidden;text-overflow:ellipsis;max-width:200px}
.ps-card:has(table){overflow-x:auto;-webkit-overflow-scrolling:touch}
.ps-table tr:hover td{background:rgba(43,76,240,.03)}

/* ============================================================
   Coaching Insights (ci-)
   ============================================================ */
.ci-kpi-bar{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px}
.ci-kpi{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px;display:flex;align-items:center;gap:14px;position:relative;overflow:hidden;transition:.14s}
.ci-kpi:hover{border-color:var(--accent);box-shadow:0 6px 20px -10px rgba(43,76,240,.18);transform:translateY(-1px)}
.ci-kpi::before{content:"";position:absolute;top:0;left:0;right:0;height:3px;background:var(--accent)}
.ci-kpi.ok::before{background:#1A7F5B}
.ci-kpi.warn::before{background:#B5720F}
.ci-kpi.bad::before{background:#B23237}
.ci-kpi .ci-icon{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex:0 0 auto;background:var(--surface);color:var(--accent);font-size:18px}
.ci-kpi.ok .ci-icon{background:#EDF9F2;color:#1A7F5B}
.ci-kpi.warn .ci-icon{background:#FBF1DE;color:#B5720F}
.ci-kpi.bad .ci-icon{background:#FDF2F2;color:#B23237}
.ci-kpi .ci-body{flex:1;min-width:0}
.ci-kpi-label{font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--muted);margin-bottom:3px}
.ci-kpi-value{font-family:'Space Grotesk';font-weight:700;font-size:26px;color:var(--ink);letter-spacing:-0.02em;line-height:1.1}
.ci-kpi-sublabel{font-size:12px;color:var(--muted);font-weight:600;margin-top:2px}
.ci-empty{background:var(--card);border:1px solid var(--line);border-radius:16px}

@media(max-width:860px){
  .ci-kpi-bar{grid-template-columns:repeat(2,1fr)}
  .ci-kpi-value{font-size:22px}
}
@media(max-width:480px){
  .ci-kpi-bar{grid-template-columns:1fr}
}

/* P5.3: Scheduled Calls */
.schedule-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}
.schedule-card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px;display:flex;flex-direction:column;gap:10px;position:relative}
.schedule-card:hover{border-color:var(--accent);box-shadow:0 8px 24px -14px rgba(43,76,240,.25);transform:translateY(-2px);transition:.14s}
.schedule-card.past{opacity:.6}
.schedule-time{font-family:'Space Grotesk';font-weight:700;font-size:22px;color:var(--accent);letter-spacing:-0.02em}
.schedule-date{font-size:12.5px;color:var(--muted);font-weight:600}
.schedule-prospect{font-weight:700;font-size:15px;color:var(--ink)}
.schedule-meta{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}
.schedule-status{font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:3px 10px;border-radius:20px}
.schedule-status.scheduled{background:var(--accent-bg);color:var(--accent-ink)}
.schedule-status.completed{background:#E6F6EF;color:var(--ok)}
.schedule-status.cancelled{background:#FDF2F2;color:var(--aggressive)}
.schedule-status.no_show{background:var(--instr-bg);color:var(--instr)}
.schedule-actions{display:flex;gap:8px;margin-top:auto;padding-top:8px;border-top:1px solid var(--line-soft)}
.schedule-form{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.schedule-form .frow{margin-bottom:0}
@media(max-width:640px){.schedule-form{grid-template-columns:1fr}}
/* ============================================================
   ProductForm Redesign (pf-)
   ============================================================ */
.pf-layout{display:grid;grid-template-columns:1fr 300px;gap:24px;align-items:start}
.pf-main{min-width:0}
.pf-sidebar{position:sticky;top:22px}
@media(max-width:1100px){.pf-layout{grid-template-columns:1fr}.pf-sidebar{display:none}}

/* Section */
.pf-section{margin-bottom:28px}
.pf-section-header{display:flex;align-items:center;gap:10px;margin-bottom:16px;padding-bottom:10px;border-bottom:1.5px solid var(--line-soft)}
.pf-section-title{font-family:'Space Grotesk';font-weight:700;font-size:16px;color:var(--ink);letter-spacing:-0.02em}
.pf-section-count{font-size:11px;font-weight:700;padding:3px 9px;border-radius:20px;background:var(--accent-bg);color:var(--accent-ink)}
.pf-section-count.done{background:#E6F6EF;color:var(--ok)}

/* Field importance */
.flab .req{color:var(--aggressive);font-weight:700;margin-left:2px}
.flab .rec{color:var(--amber);font-weight:600;margin-left:4px;font-size:11px}
.flab .adv{color:var(--faint);font-weight:500;margin-left:4px;font-size:11px}
.pf-field-example{font-size:11.5px;color:var(--faint);margin-top:4px;line-height:1.45}
.pf-field-example::before{content:'Example: ';font-weight:600;color:var(--muted)}

/* AI assist button */
.pf-ai-btn{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:600;color:var(--accent);background:var(--accent-bg);border:1px solid rgba(43,76,240,.15);border-radius:7px;padding:5px 10px;cursor:pointer;transition:.13s;margin-top:6px}
.pf-ai-btn:hover{background:rgba(43,76,240,.12);border-color:rgba(43,76,240,.25)}
.pf-ai-btn:disabled{opacity:.5;cursor:not-allowed}
.pf-ai-btn .spin{width:12px;height:12px;border:2px solid rgba(43,76,240,.2);border-top-color:var(--accent);border-radius:50%;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}

/* Sticky bottom action bar */
.pf-sticky-bar{position:sticky;bottom:0;left:0;right:0;background:linear-gradient(0deg,var(--paper) 55%,transparent);padding:18px 0 8px;margin-top:8px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;z-index:10}
.pf-status{font-size:12.5px;color:var(--muted);display:flex;align-items:center;gap:6px}
.pf-status.saved{color:var(--ok)}
.pf-status.unsaved{color:var(--amber)}
.pf-status .dot{width:7px;height:7px;border-radius:50%;background:currentColor;opacity:.7}

/* AI Readiness Panel */
.pf-panel{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:20px}
.pf-panel-title{font-family:'Space Grotesk';font-weight:700;font-size:15px;margin-bottom:16px;color:var(--ink)}
.pf-readiness-score{display:flex;align-items:baseline;gap:6px;margin-bottom:14px}
.pf-readiness-score .num{font-family:'Space Grotesk';font-weight:700;font-size:36px;letter-spacing:-0.03em;color:var(--accent)}
.pf-readiness-score .lbl{font-size:13px;color:var(--muted);font-weight:500}
.pf-readiness-bar{height:6px;border-radius:10px;background:var(--line-soft);overflow:hidden;margin-bottom:16px}
.pf-readiness-bar .fill{height:100%;border-radius:10px;background:linear-gradient(90deg,var(--accent) 0%,#6366F1 100%);transition:width .5s cubic-bezier(.4,0,.2,1)}
.pf-readiness-list{display:flex;flex-direction:column;gap:8px}
.pf-readiness-item{display:flex;align-items:center;gap:10px;font-size:12.5px;color:var(--muted)}
.pf-readiness-item .icon{width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0}
.pf-readiness-item .icon.ok{background:#E6F6EF;color:var(--ok)}
.pf-readiness-item .icon.partial{background:var(--amber-bg);color:var(--amber)}
.pf-readiness-item .icon.empty{background:var(--line-soft);color:var(--faint)}
.pf-readiness-item.done{color:var(--ink);font-weight:500}
.pf-suggestions{display:flex;flex-direction:column;gap:8px;margin-top:14px;padding-top:14px;border-top:1px solid var(--line-soft)}
.pf-suggestions-title{font-size:12px;font-weight:700;color:var(--ink);margin-bottom:4px}
.pf-suggestion{display:flex;align-items:flex-start;gap:8px;font-size:12px;color:var(--muted);cursor:pointer;transition:.12s;padding:4px 0}
.pf-suggestion:hover{color:var(--accent)}
.pf-suggestion .arrow{color:var(--accent);font-weight:700;flex-shrink:0}

/* Top meta bar */
.pf-meta-bar{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:6px}
.pf-meta-left{display:flex;align-items:center;gap:12px}
.pf-draft-badge{font-size:12px;font-weight:600;color:var(--muted);background:var(--line-soft);padding:4px 12px;border-radius:20px}
.pf-draft-badge.saved{background:#E6F6EF;color:var(--ok)}

/* Validation */
.pf-err{color:var(--aggressive);font-size:12px;margin-top:5px;display:flex;align-items:center;gap:5px}

/* Crumb */
.crumb{font-size:13px;font-weight:600;color:var(--muted);cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:.12s;margin-bottom:6px}
.crumb:hover{color:var(--accent)}

/* Textarea auto-height handled in component */
.ftext{resize:vertical;min-height:80px;line-height:1.55}

/* Compact field rows */
.pf-row-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media(max-width:640px){.pf-row-grid{grid-template-columns:1fr}}

/* Section divider */
.pf-divider{height:1px;background:var(--line-soft);margin:24px 0}

/* ============================================================
   DataTable enhancements (dt- additions)
   ============================================================ */
/* Sticky table header */
.dt-table thead{position:sticky;top:0;z-index:10}
.dt-table thead th{position:sticky;top:0;background:var(--bg)}

/* Row hover + click */
.dt-table tbody tr{cursor:pointer}
.dt-table tbody tr:hover{background:var(--card)}
.dt-table tbody tr.sel{background:var(--accent-bg)}

/* Checkbox improvements */
.ck{width:18px;height:18px;flex:0 0 auto;border:1.5px solid var(--line);border-radius:5px;margin-top:1px;cursor:pointer;transition:.12s;display:flex;align-items:center;justify-content:center;color:transparent;font-size:11px;background:#fff}
.ck:hover{border-color:var(--faint);background:var(--surface)}
.ck.on{background:var(--ok);border-color:var(--ok);color:#fff;box-shadow:0 0 0 2px rgba(30,158,106,.15)}

/* KPI primary stat */
.dt-kpi-primary{min-width:110px;padding:6px 12px!important}
.dt-kpi-primary .dt-kpi-label{font-size:12px;font-weight:700;color:var(--muted);letter-spacing:.04em;text-transform:none;margin-bottom:2px}
.dt-kpi-primary .dt-kpi-value{font-size:28px!important;color:var(--ink)!important}
.dt-kpi-primary .lbl{font-size:12px;color:var(--faint);margin-top:2px;font-weight:500}

/* Filter chips */
.dt-chip-removable{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;color:var(--accent-ink);background:var(--accent-bg);border:1px solid rgba(43,76,240,.15);border-radius:20px;padding:5px 12px;transition:.12s}
.dt-chip-removable button{display:flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;border:none;background:transparent;color:var(--accent);cursor:pointer;transition:.12s;padding:0}
.dt-chip-removable button:hover{background:rgba(43,76,240,.12);color:var(--accent-ink)}

/* Improved more button visibility on hover */
.dt-table tbody tr .dt-more-btn{opacity:.5;transition:.12s}
.dt-table tbody tr:hover .dt-more-btn{opacity:1}

/* ============================================================
   Product Hub (pv-) — cards/list, search, AI readiness, status
   ============================================================ */
.pv-search-wrap{position:relative;flex:1;min-width:220px;max-width:520px}
.pv-search{width:100%;padding:9px 12px 9px 34px;border:1px solid var(--line);border-radius:10px;font-size:13.5px;background:#fff;color:var(--ink);outline:none;transition:.12s}
.pv-search:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(43,76,240,.08)}
.pv-search-icon{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--faint);pointer-events:none}
.pv-search-clear{position:absolute;right:8px;top:50%;transform:translateY(-50%);display:flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;border:none;background:transparent;color:var(--faint);cursor:pointer;padding:0}
.pv-search-clear:hover{background:var(--line-soft);color:var(--muted)}
.pv-toggle{display:flex;align-items:center;gap:2px;background:var(--line-soft);border-radius:8px;padding:3px}
.pv-toggle-btn{display:flex;align-items:center;justify-content:center;width:32px;height:28px;border-radius:6px;border:none;background:transparent;color:var(--faint);cursor:pointer;transition:.12s}
.pv-toggle-btn.on{background:#fff;color:var(--accent);box-shadow:0 1px 3px rgba(0,0,0,.06)}

/* Readiness bar used in both cards and table cells */
.pv-readiness{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--muted)}
.pv-readiness .pv-r-bar{width:64px;height:6px;border-radius:3px;background:var(--line-soft);overflow:hidden}
.pv-readiness .pv-r-fill{height:100%;border-radius:3px;transition:.2s}
.pv-readiness .pv-r-num{font-weight:700;color:var(--ink);font-size:11.5px}
.pv-readiness.compact .pv-r-bar{width:56px}

/* Compact inline progress bar for tables */
.pv-readiness-inline{display:flex;align-items:center;gap:10px;min-width:120px}
.pv-readiness-inline .pv-r-bar{flex:1;height:10px;border-radius:5px;background:var(--line-soft);overflow:hidden;max-width:120px;min-width:80px;border:1px solid var(--line)}
.pv-readiness-inline .pv-r-fill{height:100%;border-radius:5px;transition:.2s}
.pv-readiness-inline .pv-r-label{font-size:12px;font-weight:700;color:var(--ink);min-width:32px;text-align:right}

/* Readiness popover */
.pv-readiness-popover{position:absolute;left:0;top:calc(100% + 6px);z-index:25;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px;box-shadow:0 12px 32px rgba(0,0,0,.12);min-width:240px;max-width:280px}
.pv-readiness-popover.table{left:auto;right:0;top:calc(100% + 6px)}

/* Archived state */
.pcard.archived{opacity:.65;background:var(--surface)}
.pcard.archived:hover{opacity:1;background:var(--card)}
.dt-table tbody tr.archived{opacity:.65;background:var(--card)}
.dt-table tbody tr.archived:hover{opacity:1;background:var(--card)}

.pv-del{margin-top:10px;padding:10px;background:rgba(178,50,55,.06);border:1px solid rgba(178,50,55,.15);border-radius:10px}

/* Table wrapper + actions */
.dt-table-wrap{border:1px solid var(--line);border-radius:14px;overflow-x:auto}
.pv-del-float{position:absolute;right:10px;top:46px;background:#fff;border:1px solid var(--line);border-radius:10px;padding:10px;box-shadow:0 8px 24px rgba(0,0,0,.1);z-index:20;min-width:220px}

/* ============================================================
   Enterprise Product Card (epc-) — P8.3 redesign
   ============================================================ */
.epc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px}
@media (max-width:640px){.epc-grid{grid-template-columns:1fr}}

.epc-card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px;cursor:pointer;transition:.14s;display:flex;flex-direction:column;position:relative;overflow:hidden}
.epc-card:hover{border-color:var(--accent);box-shadow:0 8px 28px -12px rgba(43,76,240,.35);transform:translateY(-2px)}
.epc-card .epc-top{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:10px}
.epc-card .epc-name{font-family:'Space Grotesk';font-weight:700;font-size:17px;color:var(--ink);line-height:1.25;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.epc-card .epc-desc{color:var(--muted);font-size:13px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-top:4px;min-height:40px}
.epc-card .epc-meta{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:auto;padding-top:12px}
.epc-card .epc-meta-item{display:inline-flex;align-items:center;gap:5px;font-size:12px;color:var(--faint)}
.epc-card .epc-meta-item b{color:var(--ink);font-weight:600}

/* Inline quick actions on card hover */
.epc-card .epc-actions{display:flex;align-items:center;gap:4px;opacity:0;transform:translateY(4px);transition:.18s;margin-top:10px}
.epc-card:hover .epc-actions{opacity:1;transform:translateY(0)}
.epc-card .epc-actions button{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;border-radius:7px;padding:6px 10px;cursor:pointer;transition:.12s;border:none}
.epc-card .epc-actions .epc-act-open{background:var(--accent);color:#fff}
.epc-card .epc-actions .epc-act-open:hover{background:var(--accent-ink)}
.epc-card .epc-actions .epc-act-edit{background:var(--line-soft);color:var(--muted)}
.epc-card .epc-actions .epc-act-edit:hover{background:var(--line);color:var(--ink)}
.epc-card .epc-actions .epc-act-del{background:transparent;color:var(--faint)}
.epc-card .epc-actions .epc-act-del:hover{background:#FDF2F2;color:#B23237}

/* Inline row actions in table */
.dt-table tbody tr .dt-row-actions{display:flex;align-items:center;gap:4px;opacity:0;transition:.14s}
.dt-table tbody tr:hover .dt-row-actions{opacity:1}
.dt-table tbody tr .dt-row-actions button{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:7px;border:none;background:transparent;color:var(--faint);cursor:pointer;transition:.12s}
.dt-table tbody tr .dt-row-actions button:hover{background:var(--line-soft);color:var(--ink)}
.dt-table tbody tr .dt-row-actions button.dt-row-del:hover{background:#FDF2F2;color:#B23237}

.ps-root[data-theme="dark"] .dt-table tbody tr .dt-row-actions button.dt-row-del:hover{background:#7F1D1D;color:#FCA5A5}
.ps-root[data-theme="dark"] .dt-pill.ok{background:#064E3B;color:#6EE7B7}
.ps-root[data-theme="dark"] .dt-pill.bad{background:#7F1D1D;color:#FCA5A5}
.ps-root[data-theme="dark"] .dt-pill.warn{background:#78350F;color:#FDBA74}
.ps-root[data-theme="dark"] .ls-chip.missing{background:#78350F;border-color:#92400E;color:#FDBA74}
.ps-root[data-theme="dark"] .ls-chip.missing:hover{background:#92400E}

/* ---- Dark theme: training view ---- */
.ps-root[data-theme="dark"] .tr-side.good{background:#064E3B;border-color:#065F46}
.ps-root[data-theme="dark"] .tr-side.bad{background:#7F1D1D;border-color:#991B1B}
.ps-root[data-theme="dark"] .tr-block.warn{background:#78350F;border-color:#92400E}
.ps-root[data-theme="dark"] .tr-block.warn .tr-h{color:#FDBA74}
.ps-root[data-theme="dark"] .tr-side-h{color:#E2E8F0}
.ps-root[data-theme="dark"] .tr-block p,
.ps-root[data-theme="dark"] .tr-block li{color:#CBD5E1}
.ps-root[data-theme="dark"] .tr-side p,
.ps-root[data-theme="dark"] .tr-side li{color:#CBD5E1}
.ps-root[data-theme="dark"] .tr-card-foot{color:#93C5FD}
.ps-root[data-theme="dark"] .tr-signature{background:#1E293B;border:1px solid #334155}
.ps-root[data-theme="dark"] .tr-signature .tr-h{color:#93C5FD !important}
.ps-root[data-theme="dark"] .stage-tag{background:#334155;color:#94A3B8}
.ps-root[data-theme="dark"] .gtab{color:#94A3B8;border-color:#334155}
.ps-root[data-theme="dark"] .gtab:hover{color:#E2E8F0;background:#1E293B}
.ps-root[data-theme="dark"] .gtab.on{color:#fff;border-color:#60A5FA;background:#60A5FA}
.ps-root[data-theme="dark"] .guide-body{color:#CBD5E1}
.ps-root[data-theme="dark"] .tbl-wrap{background:#1E293B;border-color:#334155}
.ps-root[data-theme="dark"] .ptbl th{background:#0F1724;color:#94A3B8;border-color:#334155}
.ps-root[data-theme="dark"] .ptbl td{border-color:#1E293B;color:#E2E8F0}
.ps-root[data-theme="dark"] .ptbl td.q{color:#94A3B8}

/* ---- Dark theme: green/red/amber text fixes ---- */
.ps-root[data-theme="dark"] .call-state.live{background:#064E3B;color:#6EE7B7;border-color:#065F46}
.ps-root[data-theme="dark"] .step.done{background:#064E3B;color:#6EE7B7}
.ps-root[data-theme="dark"] .step.done .step-time{color:#6EE7B7}
.ps-root[data-theme="dark"] .say-head{color:#6EE7B7}
.ps-root[data-theme="dark"] .call-ck.on{background:#065F46;border-color:#065F46;color:#fff}
.ps-root[data-theme="dark"] .ci-kpi.ok .ci-icon{background:#064E3B;color:#6EE7B7}
.ps-root[data-theme="dark"] .ds-funnel-step.past .ds-funnel-label{color:#6EE7B7}

/* Table cell description clamp */
.dt-table td .dt-script-meta{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* ============================================================
   Product Detail (pd-)
   ============================================================ */
.pd-top{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;margin-bottom:18px;padding:24px 34px 0}
.pd-head{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:6px}
.pd-name{font-family:'Space Grotesk';font-weight:700;font-size:22px;color:var(--ink)}
.pd-sub{color:var(--muted);font-size:14px;margin-top:4px;max-width:640px;line-height:1.5}
.pd-meta-line{font-size:12px;color:var(--faint);margin-top:6px}
.pd-actions{display:flex;gap:9px;align-items:center;flex-wrap:wrap}

.pd-tabs{display:flex;gap:2px;border-bottom:1px solid var(--line);margin-bottom:20px;flex-wrap:wrap;padding:0 34px}
.pd-tab{padding:8px 14px;font-size:13.5px;font-weight:600;color:var(--muted);background:transparent;border:none;border-bottom:2px solid transparent;cursor:pointer;transition:.12s;margin-bottom:-1px}
.pd-tab:hover{color:var(--ink)}
.pd-tab.on{color:var(--accent);border-bottom-color:var(--accent)}

/* Overview layout */
.pd-overview{display:flex;flex-direction:column;gap:22px}
.pd-hero{display:grid;grid-template-columns:minmax(260px,1fr) minmax(260px,1fr);gap:16px;align-items:start}
@media (max-width:720px){.pd-hero{grid-template-columns:1fr}}

/* AI Context panel */
.pd-context{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px}
.pd-context-head{display:flex;align-items:center;gap:8px;font-weight:700;font-size:14px;color:var(--ink);margin-bottom:10px}
.pd-context-score{margin-left:auto;font-family:'Space Grotesk';font-weight:700;font-size:16px;color:var(--ink)}
.pd-context-hint{font-size:12px;color:var(--faint);margin-top:6px;line-height:1.5}
.pd-context-checks{display:flex;flex-direction:column;gap:2px;margin-top:10px}
.pd-context-check{display:flex;align-items:center;gap:8px;width:100%;padding:6px 8px;border-radius:7px;font-size:12.5px;color:var(--faint);background:transparent;border:none;cursor:pointer;transition:.12s;text-align:left}
.pd-context-check:hover{background:var(--line-soft);color:var(--ink)}
.pd-context-check.ok{display:flex;align-items:center;gap:8px;padding:6px 8px;font-size:12.5px;color:var(--ok)}
.pd-context-dot{width:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.pd-context-label{}

/* Side panel (Ideal Customer etc) */
.pd-side{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px}

/* Full-width sections */
.pd-section{display:flex;flex-direction:column;gap:10px}
.pd-section-head{display:flex;align-items:center;gap:10px;justify-content:space-between}
.pd-section-title{font-family:'Space Grotesk';font-weight:600;font-size:15px;color:var(--ink);letter-spacing:-0.01em}
.pd-section-edit{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;color:var(--accent);background:transparent;border:none;cursor:pointer;padding:4px 8px;border-radius:6px;transition:.12s}
.pd-section-edit:hover{background:var(--accent-bg)}
.pd-section-body{color:var(--muted);font-size:14px;line-height:1.65}
.pd-section-empty{display:flex;flex-direction:column;gap:10px;padding:16px;background:var(--card);border:1px dashed var(--line);border-radius:12px;color:var(--faint);font-size:13.5px}

/* Section grid for secondary fields */
.pd-section-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
@media (max-width:720px){.pd-section-grid{grid-template-columns:1fr}}

/* Markdown rendering */
.pd-md-h2{font-family:'Space Grotesk';font-weight:600;font-size:16px;color:var(--ink);margin:18px 0 8px;letter-spacing:-0.01em}
.pd-md-h3{font-weight:700;font-size:14px;color:var(--ink);margin:14px 0 6px}
.pd-md-p{margin:0 0 10px;color:var(--muted);line-height:1.65}
.pd-md-p:last-child{margin-bottom:0}
.pd-md-ul,.pd-md-ol{margin:0 0 12px;padding-left:20px;color:var(--muted);line-height:1.65}
.pd-md-li{margin-bottom:4px}

/* Progress bar shared */
.pd-progress{height:8px;border-radius:4px;background:var(--line-soft);overflow:hidden;margin:8px 0}
.pd-progress-bar{height:100%;border-radius:4px;transition:.2s}

/* Settings card */
.pd-card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:20px}
.pd-card-h{font-family:'Space Grotesk';font-weight:700;font-size:16px;color:var(--ink);margin-bottom:6px}
.pd-hint{font-size:13px;color:var(--muted);line-height:1.5}

/* ============================================================
   Design System Foundation (ds-)
   Typography | Spacing | Radius | Buttons | Status | Templates
   ============================================================ */

/* --- Typography scale --- */
.ds-display{font-family:'Space Grotesk';font-weight:700;font-size:32px;letter-spacing:-0.03em;color:var(--ink);line-height:1.15}
.ds-h1{font-family:'Space Grotesk';font-weight:700;font-size:24px;letter-spacing:-0.02em;color:var(--ink);line-height:1.2}
.ds-h2{font-family:'Space Grotesk';font-weight:600;font-size:18px;letter-spacing:-0.01em;color:var(--ink);line-height:1.25}
.ds-h3{font-weight:600;font-size:15px;color:var(--ink);line-height:1.3}
.ds-body{font-size:14px;color:var(--ink);line-height:1.6}
.ds-secondary{font-size:13px;color:var(--muted);line-height:1.55}
.ds-caption{font-size:11.5px;color:var(--faint);line-height:1.45;font-weight:500}
.ds-label{font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--muted)}

/* --- Spacing utilities (4/8/12/16/20/24/32/40/48/64) --- */
.ds-mb-4{margin-bottom:4px}.ds-mb-8{margin-bottom:8px}.ds-mb-12{margin-bottom:12px}
.ds-mb-16{margin-bottom:16px}.ds-mb-20{margin-bottom:20px}.ds-mb-24{margin-bottom:24px}
.ds-mb-32{margin-bottom:32px}.ds-mb-40{margin-bottom:40px}.ds-mb-48{margin-bottom:48px}
.ds-gap-8{gap:8px}.ds-gap-12{gap:12px}.ds-gap-16{gap:16px}.ds-gap-24{gap:24px}
.ds-p-16{padding:16px}.ds-p-20{padding:20px}.ds-p-24{padding:24px}

/* --- Radius utilities --- */
.ds-r-sm{border-radius:6px}.ds-r-md{border-radius:8px}.ds-r-lg{border-radius:12px}.ds-r-xl{border-radius:16px}

/* --- Button taxonomy (locked) --- */
.ds-btn-pri{display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:600;color:#fff;background:var(--accent);border:none;border-radius:9px;padding:9px 16px;cursor:pointer;transition:.13s;box-shadow:0 1px 2px rgba(43,76,240,.12)}
.ds-btn-pri:hover{background:var(--accent-ink);transform:translateY(-1px);box-shadow:0 4px 12px rgba(43,76,240,.18)}
.ds-btn-pri:active{transform:translateY(0)}
.ds-btn-pri:disabled{opacity:.55;cursor:not-allowed;transform:none;box-shadow:none}
.ds-btn-sec{display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:600;color:var(--ink);background:var(--card);border:1px solid var(--line);border-radius:9px;padding:9px 16px;cursor:pointer;transition:.13s}
.ds-btn-sec:hover{border-color:var(--faint);background:var(--surface)}
.ds-btn-sec:disabled{opacity:.5;cursor:not-allowed}
.ds-btn-ter{display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:600;color:var(--muted);background:transparent;border:none;border-radius:9px;padding:9px 14px;cursor:pointer;transition:.13s}
.ds-btn-ter:hover{color:var(--ink);background:var(--line-soft)}
.ds-btn-ter.sm,.ds-btn-sec.sm,.ds-btn-pri.sm,.ds-btn-dan.sm{font-size:12px;padding:6px 10px;border-radius:7px}
.ds-btn-ico.sm{width:28px;height:28px}
.ds-btn-dan{display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:600;color:#B23237;background:#FDF2F2;border:1px solid #F0C9CA;border-radius:9px;padding:9px 16px;cursor:pointer;transition:.13s}
.ds-btn-dan:hover{background:#FCE8E8}
.ds-btn-ico{width:32px;height:32px;display:inline-flex;align-items:center;justify-content:center;border-radius:8px;border:none;background:transparent;color:var(--faint);cursor:pointer;transition:.12s}
.ds-btn-ico:hover{background:var(--line-soft);color:var(--ink)}

/* --- Status badges --- */
.ds-status{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;white-space:nowrap}
.ds-status.ok{background:#E6F6EF;color:var(--ok)}
.ds-status.warn{background:var(--amber-bg);color:var(--amber)}
.ds-status.bad{background:#FDF2F2;color:var(--aggressive)}
.ds-status.neu{background:var(--surface);color:var(--muted)}
.ds-status.accent{background:var(--accent-bg);color:var(--accent-ink)}
.ds-status-dot{width:6px;height:6px;border-radius:50%;background:currentColor}

/* --- Template A: Dashboard --- */
.ds-template-a{display:flex;flex-direction:column;gap:24px}

/* --- Template B: List --- */
.ds-template-b{display:flex;flex-direction:column;gap:16px}

/* --- Template C: Detail --- */
.ds-template-c{display:flex;flex-direction:column;gap:22px}

/* --- Template D: Create/Edit --- */
.ds-template-d{display:flex;flex-direction:column;gap:28px}

/* --- Template E: AI Workspace --- */
.ds-template-e{display:flex;flex-direction:column;gap:20px}

/* --- Template F: Operational Workspace --- */
.ds-template-f{display:flex;flex-direction:column;gap:16px}

/* --- Empty state --- */
.ds-empty-state{display:flex;flex-direction:column;align-items:center;text-align:center;padding:48px 24px;background:var(--card);border:1px solid var(--line);border-radius:16px}
.ds-empty-state .icon{width:56px;height:56px;border-radius:14px;background:var(--accent-bg);color:var(--accent);display:flex;align-items:center;justify-content:center;margin-bottom:16px}
.ds-empty-state h3{font-family:'Space Grotesk';font-weight:700;font-size:18px;margin-bottom:8px}
.ds-empty-state p{color:var(--muted);font-size:14px;max-width:460px;margin:0 auto 24px;line-height:1.55}
.ds-empty-state .actions{display:flex;gap:12;flex-wrap:wrap;justify-content:center}

/* --- Score ring --- */
.ds-score-ring{position:relative;width:140px;height:140px;display:flex;align-items:center;justify-content:center;margin:0 auto}
.ds-score-ring svg{position:absolute;inset:0;transform:rotate(-90deg)}
.ds-score-ring .track{fill:none;stroke:var(--line-soft);stroke-width:8}
.ds-score-ring .fill{fill:none;stroke:var(--accent);stroke-width:8;stroke-linecap:round;transition:stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)}
.ds-score-ring .value{font-family:'Space Grotesk';font-weight:700;font-size:36px;color:var(--ink)}
.ds-score-ring .label{font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;position:absolute;bottom:18px}

/* --- Dimension cards --- */
.ds-dim-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
@media(max-width:720px){.ds-dim-grid{grid-template-columns:repeat(2,1fr)}}
.ds-dim-card{padding:16px;border-radius:12px;border:1px solid var(--line-soft);background:#FBFCFE;text-align:center}
.ds-dim-card .dim-label{font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px}
.ds-dim-card .dim-value{font-family:'Space Grotesk';font-weight:700;font-size:22px;margin-bottom:4px}
.ds-dim-card .dim-desc{font-size:12px;color:var(--muted)}

/* --- Risk / insight blocks --- */
.ds-insight-block{display:flex;align-items:flex-start;gap:12px;padding:14px;border-radius:10px;background:#FBFCFE;border:1px solid var(--line-soft);margin-bottom:10px}
.ds-insight-block .icon{flex-shrink:0;margin-top:1px}
.ds-insight-block .content{flex:1}
.ds-insight-block .title{font-weight:600;font-size:13.5px;margin-bottom:3px}
.ds-insight-block .body{font-size:13px;color:var(--muted);line-height:1.5}

/* --- Step indicator --- */
.ds-stepper{display:flex;align-items:center;gap:8px;margin-bottom:24px}
.ds-step{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:var(--faint)}
.ds-step.on{color:var(--accent)}
.ds-step.done{color:var(--ok)}
.ds-step-num{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;background:var(--line-soft);color:var(--faint);flex-shrink:0}
.ds-step.on .ds-step-num{background:var(--accent);color:#fff}
.ds-step.done .ds-step-num{background:#E6F6EF;color:var(--ok)}
.ds-step-line{flex:1;height:2px;background:var(--line-soft);border-radius:1px;max-width:40px}

/* --- Section disclosure --- */
.ds-section-card{background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden;margin-bottom:16px;transition:.15s}
.ds-section-card:hover{border-color:var(--line-soft)}
.ds-section-header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;cursor:pointer;transition:.12s;background:var(--surface);border-bottom:1px solid transparent}
.ds-section-header:hover{background:var(--card)}
.ds-section-header.open{border-bottom-color:var(--line-soft)}
.ds-section-header .title{font-family:'Space Grotesk';font-weight:600;font-size:15px}
.ds-section-header .meta{font-size:12px;color:var(--faint);margin-top:2px}
.ds-section-body{padding:20px;display:none}
.ds-section-body.open{display:block}

/* --- Input system (enterprise) --- */
.ds-input{width:100%;padding:9px 12px;border:1px solid var(--line);border-radius:9px;font-size:13.5px;background:#FBFCFE;color:var(--ink);transition:.12s;outline:none}
.ds-input:focus{border-color:var(--accent);background:#fff;box-shadow:0 0 0 3px rgba(43,76,240,.08)}
.ds-input::placeholder{color:var(--faint)}
.ds-textarea{resize:vertical;min-height:80px;line-height:1.55}
.ds-select{cursor:pointer}

/* --- Install prompt (unobtrusive) --- */
.ds-install-prompt{position:fixed;bottom:20px;right:20px;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 18px;box-shadow:0 8px 32px rgba(0,0,0,.12);z-index:100;display:flex;align-items:center;gap:14px;max-width:380px}
.ds-install-prompt .title{font-weight:700;font-size:13.5px;margin-bottom:2px}
.ds-install-prompt .body{font-size:12.5px;color:var(--muted)}
.ds-install-prompt .actions{display:flex;gap:8px;align-items:center}

/* --- Pagination --- */
.ds-pagination{display:flex;align-items:center;justify-content:space-between;margin-top:16px;padding:10px 0;font-size:13px;color:var(--muted)}
.ds-pagination-info{font-weight:600;color:var(--faint)}
.ds-pagination-actions{display:flex;align-items:center;gap:8px}
.ds-pagination-pages{font-weight:600;color:var(--ink);font-size:12.5px;min-width:90px;text-align:center}

/* --- Script Refinement Workspace --- */
.ds-script-card{display:block;width:100%;text-align:left;padding:14px 16px;background:var(--card);border:1px solid var(--line);border-radius:12px;cursor:pointer;transition:.13s}
.ds-script-card:hover{border-color:var(--accent);box-shadow:0 2px 8px rgba(43,76,240,.08)}
.ds-script-card:active{transform:translateY(1px)}

.ds-refine-panel{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px;max-height:480px;overflow:auto}
.ds-refine-panel pre{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace}

.ds-version-row{display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--card);border:1px solid var(--line);border-radius:10px;cursor:pointer;transition:.12s;text-align:left;width:100%}
.ds-version-row:hover{border-color:var(--line-soft);background:var(--surface)}
.ds-version-row:active{transform:translateY(1px)}

.ds-label{font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.04em}

/* ── Deal Score detail view (compact, explainable) ── */

.ds-detail-meta{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px}
.ds-meta-main{display:flex;align-items:center;gap:14px;flex:1}
.ds-meta-avatar{width:46px;height:46px;border-radius:50%;background:linear-gradient(135deg,var(--accent) 0%,#6366F1 100%);color:#fff;font-family:'Space Grotesk';font-weight:700;font-size:18px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.ds-meta-body{display:flex;flex-direction:column;gap:3px;min-width:0}
.ds-meta-name{font-family:'Space Grotesk';font-weight:700;font-size:17px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ds-meta-line{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.ds-meta-chip{display:inline-flex;align-items:center;gap:5px;background:var(--surface);border-radius:20px;padding:3px 10px;font-size:12px;font-weight:600;color:var(--muted);white-space:nowrap}
.ds-meta-extra{display:flex;align-items:center;gap:8px;flex-wrap:wrap}

.ds-score-hero-compact{display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:22px 26px}
.ds-score-left{display:flex;flex-direction:column;gap:3px;min-width:0}
.ds-score-num{font-family:'Space Grotesk';font-weight:800;font-size:52px;line-height:1;letter-spacing:-0.04em}
.ds-score-denom{font-size:20px;font-weight:500;color:var(--faint);margin-left:3px;opacity:.65}
.ds-score-label{font-size:14px;font-weight:600;color:var(--muted);margin-top:2px}
.ds-score-trend{display:flex;align-items:center;gap:5px;font-size:13px;font-weight:700;margin-top:3px}
.ds-score-right{display:flex;flex-direction:column;align-items:flex-end;gap:10px;min-width:0}
.ds-confidence-badge{display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:700;padding:7px 14px;border-radius:10px;white-space:nowrap;flex-wrap:wrap}
.ds-confidence-hint{font-weight:400;font-size:12px;color:var(--muted);display:block;margin-top:3px;white-space:normal;max-width:280px;line-height:1.5}
.ds-score-sub{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--muted)}

.ds-dim-grid-horiz{display:flex;flex-direction:column;gap:16px}
.ds-dim-bar-row{display:flex;flex-direction:column;gap:6px;padding:10px 12px;border-radius:10px;border:1.5px solid transparent;transition:.12s}
.ds-dim-bar-row.weak{background:#FDF2F2;border-color:#F0C9CA}
.ds-dim-bar-info{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.ds-dim-bar-icon{flex-shrink:0}
.ds-dim-bar-label{font-size:13px;font-weight:700;color:var(--ink);min-width:70px}
.ds-dim-bar-score{font-size:13px;font-weight:700;margin-left:auto}
.ds-dim-bar-track{height:8px;border-radius:4px;background:var(--line-soft);overflow:hidden}
.ds-dim-bar-fill{height:100%;border-radius:4px;transition:width .6s cubic-bezier(.4,0,.2,1)}

.ds-primary-risk{display:flex;align-items:flex-start;gap:12px;padding:14px 16px;background:#FDF2F2;border:1px solid #F0C9CA;border-radius:12px}
.ds-risk-title{font-size:14px;font-weight:700;color:#B23237;margin-bottom:4px}
.ds-risk-body{font-size:13px;color:#8B2A2E;line-height:1.55}

.ds-diagnosis-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
@media(max-width:900px){.ds-diagnosis-grid{grid-template-columns:1fr}}
.ds-diagnosis-col{display:flex;flex-direction:column;gap:10px;padding:16px;border-radius:12px;border:1px solid var(--line-soft);background:var(--surface)}
.ds-diagnosis-col.good{border-color:#D0E9DE;background:#F4FBF8}
.ds-diagnosis-col.bad{border-color:#F0C9CA;background:#FDF8F8}
.ds-diagnosis-col.next{border-color:#D9DEEE;background:#F7F8FC}
.ds-diagnosis-h{display:flex;align-items:center;gap:7px;font-size:13px;font-weight:700;color:var(--ink);margin-bottom:4px}
.ds-diagnosis-list{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px}
.ds-diagnosis-list li{font-size:13px;color:var(--muted);line-height:1.55;padding-left:16px;position:relative}
.ds-diagnosis-list li::before{content:'';position:absolute;left:4px;top:7px;width:5px;height:5px;border-radius:50%;background:currentColor;opacity:.4}

.ds-priority-list{display:flex;flex-direction:column;gap:12px}
.ds-priority-item{display:flex;align-items:flex-start;gap:12px;padding:14px 16px;background:var(--card);border:1px solid var(--line-soft);border-radius:12px;transition:.12s}
.ds-priority-item:hover{border-color:var(--line)}
.ds-priority-severity{font-size:16px;flex-shrink:0;margin-top:1px}
.ds-priority-body{flex:1;min-width:0}
.ds-priority-title{font-size:14px;font-weight:600;color:var(--ink);margin-bottom:3px}
.ds-priority-desc{font-size:12.5px;color:var(--muted);line-height:1.5}
.ds-priority-cta{flex-shrink:0;margin-top:2px;font-family:'Inter';font-weight:600;font-size:12px;border:none;border-radius:8px;padding:6px 12px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:.12s;line-height:1}

.ds-evidence-list{display:flex;flex-direction:column;gap:10px}
.ds-evidence-item{font-size:13.5px;color:var(--muted);line-height:1.65;padding:12px 14px;background:var(--surface);border-radius:10px;border-left:3px solid var(--accent);font-style:italic}

.ds-funnel{display:flex;align-items:center;gap:0;flex-wrap:wrap}
.ds-funnel-step{display:flex;flex-direction:column;align-items:center;gap:6px;padding:8px 12px;position:relative}
.ds-funnel-dot{width:12px;height:12px;border-radius:50%;background:var(--line-soft);border:2px solid var(--line);transition:.2s}
.ds-funnel-step.current .ds-funnel-dot{background:var(--accent);border-color:var(--accent-ink);box-shadow:0 0 0 3px rgba(43,76,240,.15)}
.ds-funnel-step.past .ds-funnel-dot{background:#1A7F5B;border-color:#146B4B}
.ds-funnel-label{font-size:12px;font-weight:600;color:var(--muted);white-space:nowrap}
.ds-funnel-step.current .ds-funnel-label{color:var(--accent-ink);font-weight:700}
.ds-funnel-step.past .ds-funnel-label{color:#1A7F5B}
.ds-funnel-connector{flex:1;min-width:24px;height:2px;background:var(--line-soft);margin-top:-10px;position:relative;top:-4px}
.ds-funnel-connector.past{background:#1A7F5B}

/* ── Mobile refinements for Deal Score detail ── */
@media(max-width:640px){
  .ds-detail-meta{flex-direction:column;align-items:flex-start}
  .ds-score-hero-compact{flex-direction:column;align-items:flex-start}
  .ds-score-right{align-items:flex-start}
  .ds-diagnosis-grid{grid-template-columns:1fr}
  .ds-funnel-step{padding:6px 8px}
}
.edit-add-btn{display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:var(--accent);background:var(--accent-bg);border:1px solid var(--accent-border,#C6D9F0);border-radius:6px;padding:3px 8px;cursor:pointer;transition:.15s}
.edit-add-btn:hover{background:var(--accent);color:#fff}
.edit-del-btn{display:inline-flex;align-items:center;justify-content:center;background:none;border:1px solid #e8e8e8;border-radius:6px;padding:6px;color:#999;cursor:pointer;transition:.15s;flex-shrink:0}
.edit-del-btn:hover{background:#fee;border-color:#f99;color:#c33}

/* ── Missing utility classes used across views ── */
.ps-section-title{font-family:'Space Grotesk';font-weight:700;font-size:16px;color:var(--ink);letter-spacing:-0.01em;margin-bottom:12px}
.ps-input{width:100%;border:1px solid var(--line);border-radius:9px;padding:10px 12px;font-family:'Inter';font-size:14px;color:var(--ink);background:#FBFCFE;transition:.12s}
.ps-input:focus{outline:none;border-color:var(--accent);background:#fff;box-shadow:0 0 0 3px rgba(43,76,240,.12)}
.ps-select{width:100%;border:1px solid var(--line);border-radius:9px;padding:10px 12px;font-family:'Inter';font-size:14px;color:var(--ink);background:#FBFCFE;cursor:pointer;transition:.12s;appearance:auto}
.ps-select:focus{outline:none;border-color:var(--accent);background:#fff;box-shadow:0 0 0 3px rgba(43,76,240,.12)}
.ps-form-row{display:grid;gap:14px;margin-bottom:14px}
.ps-loading{display:flex;align-items:center;gap:12px;padding:24px;color:var(--muted);font-size:14px;justify-content:center}
.ps-spinner{width:20px;height:20px;border:2.5px solid var(--line-soft);border-top-color:var(--accent);border-radius:50%;animation:spin .7s linear infinite;display:inline-block}
.ps-flex{display:flex;align-items:center}
.ps-flex-between{display:flex;align-items:center;justify-content:space-between}
.ps-tag{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;background:var(--surface);color:var(--muted)}
.ps-tag-accent{background:var(--accent-bg);color:var(--accent-ink)}
.ps-form-actions{display:flex;align-items:center;gap:10px;justify-content:flex-end}
.ps-stat-card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:20px;text-align:center}
.ps-stat-value{font-family:'Space Grotesk';font-weight:700;font-size:28px;color:var(--ink);letter-spacing:-0.02em}
.ps-stat-label{font-size:12.5px;color:var(--muted);font-weight:600;margin-top:4px}
.ps-textarea{width:100%;border:1px solid var(--line);border-radius:9px;padding:10px 12px;font-family:'Inter';font-size:14px;color:var(--ink);background:#FBFCFE;resize:vertical;min-height:80px;line-height:1.55;transition:.12s}
.ps-textarea:focus{outline:none;border-color:var(--accent);background:#fff;box-shadow:0 0 0 3px rgba(43,76,240,.12)}
.guide-body{margin-top:14px}

/* ── Mobile responsive fixes ── */
@media(max-width:860px){
  .ps-container{padding:0 18px 40px}
  .ps-header{padding:18px 0 0}
  .ps-top{flex-wrap:wrap;gap:10px}
  .pd-top{padding:18px 18px 0;flex-direction:column;align-items:flex-start}
  .pd-actions{width:100%;justify-content:flex-start;flex-wrap:wrap}
  .pd-tabs{padding:0 18px;overflow-x:auto;flex-wrap:nowrap;-webkit-overflow-scrolling:touch;scrollbar-width:none}
  .pd-tabs::-webkit-scrollbar{display:none}
  .pd-tab{white-space:nowrap;flex-shrink:0}
  .obj-panel{position:static;max-height:none}
  .obj-list{max-height:none}
  .opening-row.cols-2,.opening-row.cols-3,.seg-body-row.cols-2,.seg-body-row.cols-3{grid-template-columns:1fr}
  .ps-header h1{font-size:20px}
  .ci-kpi-bar{grid-template-columns:repeat(2,1fr)}
  .dt-header{flex-direction:column;align-items:flex-start}
  .dt-search{min-width:100%;margin-bottom:8px}
  .dt-table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;border-radius:10px}
  .dt-kpi-bar{flex-wrap:wrap}
  .call-cockpit{padding:14px 12px}
  .call-top{flex-direction:column;align-items:flex-start;gap:10px}
  .call-controls{width:100%;justify-content:flex-start}
  .call-timer{font-size:36px}
  .call-seg-nav{flex-direction:column;gap:6px}
  .call-seg-title{justify-content:flex-start}
  .call-line{font-size:15px}
  .call-auto-pause{flex-direction:column;align-items:flex-start;gap:6px}
  .call-copilot{grid-template-columns:1fr}
  .battle-panel{max-height:none}
  .obj-live{max-height:none}
  .ps-stat-card{padding:14px}
  .ps-stat-value{font-size:24px}
  .rp-active-wrap{grid-template-columns:1fr}
  .rp-setup-grid{grid-template-columns:1fr}
  .rp-briefing-grid{grid-template-columns:1fr}
  .schedule-form{grid-template-columns:1fr}
  .pf-layout{grid-template-columns:1fr}
  .pf-sidebar{display:none}
  .two-sel{grid-template-columns:1fr}
  .frow.two{grid-template-columns:1fr}
  .pf-row-grid{grid-template-columns:1fr}
  .ps-flex-between{flex-direction:column;align-items:flex-start;gap:8px}
  .ps-form-row{grid-template-columns:1fr}
  .ds-score-hero-compact{flex-direction:column;align-items:flex-start}
  .ps-grid{grid-template-columns:1fr}
  [style*="gridTemplateColumns"]{grid-template-columns:1fr!important}
}
@media(max-width:560px){
  .ps-container{padding:0 14px 32px}
  .ps-header{padding:14px 0 0}
  .ps-header h1{font-size:18px}
  .pd-top{padding:14px 14px 0}
  .pd-tabs{padding:0 14px;overflow-x:auto;flex-wrap:nowrap;-webkit-overflow-scrolling:touch;scrollbar-width:none}
  .pd-tabs::-webkit-scrollbar{display:none}
  .pd-tab{white-space:nowrap;flex-shrink:0}
  .ds-stepper{font-size:12px;gap:6px}
  .ds-step-num{width:24px;height:24px;font-size:10px}
  .ds-step-line{max-width:20px}
  .dt-dropdown{min-width:160px;left:auto;right:0}
  .dt-more-btn{width:32px;height:32px}
  .pd-hero{grid-template-columns:1fr}
  .pd-section-grid{grid-template-columns:1fr}
  .pd-name{font-size:20px}
  .ci-kpi-bar{grid-template-columns:1fr}
  .ci-kpi{padding:14px}
  .ci-kpi-value{font-size:22px}
  .dt-table{font-size:12px}
  .dt-table th,.dt-table td{padding:8px 8px}
  .ps-stat-card{padding:12px}
  .ps-stat-value{font-size:22px}
  .ps-flex-between{flex-direction:column;align-items:flex-start;gap:6px}
  .ps-flex{flex-direction:column;align-items:flex-start;gap:6px}
  .comp-grid{grid-template-columns:1fr}
  .tr-grid{grid-template-columns:1fr}
  .tr-two{grid-template-columns:1fr}
  .schedule-grid{grid-template-columns:1fr}
  .ds-diagnosis-grid{grid-template-columns:1fr}
  .ds-dim-grid{grid-template-columns:1fr}
  .rp-diff-grid{grid-template-columns:repeat(2,1fr)}
  .epc-grid{grid-template-columns:1fr}
  .ps-grid{grid-template-columns:1fr}
  .ps-form-row{grid-template-columns:1fr!important}
  .ps-form-row[style*="flex"]{flex-direction:column}
  .ps-modal{max-width:100%;margin:8px;padding:16px;max-height:90vh}
  .ps-overlay{padding:8px}
  .overlay{padding:8px}
  .modal{max-width:100%;width:calc(100% - 16px);margin:8px;padding:16px;max-height:90vh}
  .dt-table th,.dt-table td{padding:6px 6px;font-size:11px}
  .dt-script-name{font-size:13px}
  .dt-script-meta{font-size:10px}
  .dt-pill{font-size:10px;padding:2px 6px}
  .ps-table{font-size:12px}
  .ps-table th,.ps-table td{padding:6px 8px}
  .chart-card{padding:14px}
  .lb-row{flex-wrap:wrap;gap:4px}
  .ps-callout{font-size:13px;padding:10px 14px}
}
`;

