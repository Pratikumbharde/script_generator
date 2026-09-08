import React, { useState, useEffect, useLayoutEffect } from 'react'
import {
  ArrowRight, Check, Zap, Timer, Languages, Shield, BarChart3,
  MessageSquareText, Users, MapPin, Sparkles, Sun, Moon,
} from 'lucide-react'
import { useBrand } from '../context/BrandContext.jsx'

/* ============================================================
   LandingPage — public marketing page shown before auth.
   Explains what the product is, with Sign in / Register CTAs.
   All copy comes from the site branding (Settings > Landing Page,
   with the shipped defaults as fallback), so it's editable from
   the admin panel without touching this file.
   Uses the app's CSS variables so it follows light/dark theme,
   with a nav toggle for visitors (persisted to localStorage).
   Sections reveal on scroll via IntersectionObserver.
   ============================================================ */

/* Render the hero heading, converting **highlight** markers into the
   accent-gradient <em>. Text without markers renders unchanged. */
function renderEm(text) {
  const parts = String(text || '').split(/\*\*(.+?)\*\*/g)
  return parts.map((part, i) => (i % 2 === 1 ? <em key={i}>{part}</em> : <React.Fragment key={i}>{part}</React.Fragment>))
}

const LP_STYLES = `
.lp-wrap{min-height:100vh;display:flex;flex-direction:column;background:var(--paper);color:var(--ink);
  font-family:inherit;line-height:1.5}
.lp-inner{width:100%;max-width:1120px;margin:0 auto;padding:0 32px}
a.lp-link{color:inherit;text-decoration:none}

/* ---------- scroll reveal ---------- */
.lp-reveal{opacity:0;transform:translateY(28px);
  transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1),
    background-color .25s ease,border-color .25s ease}
.lp-reveal.lp-in{opacity:1;transform:none}
@media (prefers-reduced-motion: reduce){
  .lp-reveal{opacity:1;transform:none;transition:none}
  .lp-btn:hover,.lp-card-h:hover{transform:none !important}
}

/* ---------- nav ---------- */
.lp-nav{display:flex;align-items:center;justify-content:space-between;padding:18px 0}
.lp-brand{display:flex;align-items:center;gap:9px;font-weight:800;font-size:18px;letter-spacing:-.01em}
.lp-brand .dot{width:11px;height:11px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 4px var(--accent-bg);transition:box-shadow .3s ease,transform .3s ease}
.lp-brand:hover .dot{transform:scale(1.25);box-shadow:0 0 0 6px var(--accent-bg)}
.lp-brand-logo{width:52px;height:52px;border-radius:6px;object-fit:contain;display:block}
.lp-nav-actions{display:flex;align-items:center;gap:10px}

/* theme toggle */
.lp-theme{width:38px;height:38px;border-radius:10px;border:1px solid var(--line);background:var(--card);
  color:var(--muted);display:inline-flex;align-items:center;justify-content:center;cursor:pointer;
  transition:color .2s ease,border-color .2s ease,transform .2s ease,box-shadow .2s ease}
.lp-theme:hover{color:var(--accent);border-color:var(--accent);transform:rotate(-12deg) scale(1.06);
  box-shadow:0 4px 12px rgba(43,76,240,.15)}
.lp-theme:active{transform:scale(.94)}

/* ---------- hero ---------- */
.lp-hero{padding:4px 0 64px;text-align:center}
.lp-eyebrow{display:inline-flex;align-items:center;gap:7px;font-size:12px;font-weight:700;letter-spacing:.14em;
  text-transform:uppercase;color:var(--accent);background:var(--accent-bg);border:1px solid var(--line);
  border-radius:999px;padding:7px 14px;margin-bottom:22px;transition:border-color .2s ease,transform .2s ease}
.lp-eyebrow:hover{border-color:var(--accent);transform:translateY(-2px)}
.lp-h1{font-size:clamp(34px,5.2vw,58px);font-weight:800;line-height:1.08;letter-spacing:-.03em;margin:0 auto 20px;max-width:840px}
.lp-h1 em{font-style:normal;color:var(--accent);
  background:linear-gradient(90deg,var(--accent),var(--accent-ink));background-size:200% 100%;
  -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;position:relative}
.lp-sub{font-size:clamp(16px,1.6vw,19px);color:var(--muted);max-width:640px;margin:0 auto 34px}
.lp-cta{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
.lp-btn{display:inline-flex;align-items:center;gap:8px;border-radius:10px;padding:13px 26px;font-size:15px;
  font-weight:700;cursor:pointer;border:1px solid transparent;transition:transform .15s ease,box-shadow .15s ease,background-color .15s ease,border-color .15s ease}
.lp-btn:hover{transform:translateY(-2px)}
.lp-btn:active{transform:translateY(0) scale(.98)}
.lp-btn-pri{background:var(--accent);color:#fff;box-shadow:0 6px 18px rgba(43,76,240,.28)}
.lp-btn-pri:hover{background:var(--accent-ink);box-shadow:0 10px 26px rgba(43,76,240,.38)}
.lp-btn-ghost{background:var(--card);color:var(--ink);border-color:var(--line)}
.lp-btn-ghost:hover{border-color:var(--accent);color:var(--accent)}
.lp-note{margin-top:16px;font-size:13px;color:var(--faint)}

/* ---------- flow strip ---------- */
.lp-flow{display:grid;grid-template-columns:1fr auto 1fr auto 1fr;gap:10px;align-items:stretch;margin:60px 0 0}
.lp-card-h{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:20px 18px;text-align:left;
  transition:transform .25s cubic-bezier(.16,1,.3,1),box-shadow .25s ease,border-color .25s ease,background-color .25s ease}
.lp-card-h:hover{transform:translateY(-5px);border-color:var(--accent);box-shadow:0 14px 34px rgba(19,26,36,.12)}
.lp-flow-step b{display:block;font-size:14px;margin-bottom:5px;transition:color .2s ease}
.lp-flow-step:hover b{color:var(--accent)}
.lp-flow-step span{font-size:13px;color:var(--muted)}
.lp-flow-arrow{align-self:center;color:var(--faint);transition:transform .25s ease,color .25s ease}
.lp-flow:hover .lp-flow-arrow{color:var(--accent)}
.lp-flow:hover .lp-flow-arrow:first-child{transform:translateX(4px)}

/* ---------- sections ---------- */
.lp-section{padding:72px 0}
.lp-section-tint{background:var(--surface);border-top:1px solid var(--line-soft);border-bottom:1px solid var(--line-soft);
  transition:background-color .25s ease,border-color .25s ease}
.lp-kicker{font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);margin-bottom:10px}
.lp-h2{font-size:clamp(24px,3vw,34px);font-weight:800;letter-spacing:-.02em;margin:0 0 14px}
.lp-lead{font-size:16px;color:var(--muted);max-width:720px;margin:0}

/* ---------- about split ---------- */
.lp-split{display:grid;grid-template-columns:1.1fr .9fr;gap:44px;align-items:center}
.lp-checklist{list-style:none;margin:24px 0 0;padding:0;display:grid;gap:12px}
.lp-checklist li{display:flex;gap:10px;align-items:flex-start;font-size:15px;border-radius:10px;padding:6px 8px;
  margin-left:-8px;transition:background-color .2s ease,transform .2s ease;cursor:default}
.lp-checklist li:hover{background:var(--accent-bg);transform:translateX(4px)}
.lp-checklist .lp-tick{flex:none;width:20px;height:20px;border-radius:50%;background:var(--say-bg);color:var(--say);
  display:inline-flex;align-items:center;justify-content:center;margin-top:1px;transition:transform .25s ease}
.lp-checklist li:hover .lp-tick{transform:scale(1.2)}

/* ---------- mock cockpit ---------- */
.lp-mock{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:18px;
  box-shadow:0 20px 50px rgba(19,26,36,.10);
  transition:transform .3s cubic-bezier(.16,1,.3,1),box-shadow .3s ease,border-color .3s ease,background-color .25s ease}
.lp-mock:hover{transform:translateY(-6px) rotate(-.4deg);box-shadow:0 28px 60px rgba(19,26,36,.16);border-color:var(--accent)}
.lp-mock-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.lp-mock-title{font-weight:800;font-size:15px}
.lp-mock-badge{font-size:11px;font-weight:700;color:var(--accent);background:var(--accent-bg);
  border-radius:999px;padding:4px 10px;animation:lp-pulse 2s ease-in-out infinite}
@keyframes lp-pulse{0%,100%{opacity:1}50%{opacity:.55}}
.lp-mock-pills{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:14px}
.lp-pill{font-size:11px;font-weight:700;border:1px solid var(--line);border-radius:999px;padding:4px 10px;color:var(--muted);
  transition:color .2s ease,border-color .2s ease,background-color .2s ease}
.lp-pill:hover{color:var(--accent);border-color:var(--accent);background:var(--accent-bg)}
.lp-seg{border-left:3px solid var(--accent);background:var(--surface);border-radius:0 10px 10px 0;
  padding:11px 13px;margin-bottom:10px;transition:transform .2s ease,box-shadow .2s ease}
.lp-seg:hover{transform:translateX(4px);box-shadow:-2px 4px 14px rgba(19,26,36,.08)}
.lp-seg b{display:flex;justify-content:space-between;font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:var(--accent)}
.lp-seg p{margin:6px 0 0;font-size:13px;color:var(--muted)}
.lp-seg.coach{border-left-color:var(--instr)}
.lp-seg.coach b{color:var(--instr)}

/* ---------- steps ---------- */
.lp-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:36px}
.lp-step{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:24px;
  transition:transform .25s cubic-bezier(.16,1,.3,1),box-shadow .25s ease,border-color .25s ease,background-color .25s ease}
.lp-step:hover{transform:translateY(-5px);border-color:var(--accent);box-shadow:0 14px 34px rgba(19,26,36,.10)}
.lp-step-num{width:34px;height:34px;border-radius:10px;background:var(--accent-bg);color:var(--accent);
  font-weight:800;display:flex;align-items:center;justify-content:center;margin-bottom:14px;
  transition:transform .25s ease,background-color .25s ease,color .25s ease}
.lp-step:hover .lp-step-num{transform:scale(1.12) rotate(-6deg);background:var(--accent);color:#fff}
.lp-step b{display:block;font-size:16px;margin-bottom:7px}
.lp-step p{margin:0;font-size:14px;color:var(--muted)}

/* ---------- feature grid ---------- */
.lp-feats{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:36px}
.lp-feat{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:22px;cursor:default;
  transition:transform .25s cubic-bezier(.16,1,.3,1),box-shadow .25s ease,border-color .25s ease,background-color .25s ease}
.lp-feat:hover{transform:translateY(-5px);border-color:var(--accent);box-shadow:0 14px 34px rgba(19,26,36,.10)}
.lp-feat-ic{width:38px;height:38px;border-radius:11px;background:var(--accent-bg);color:var(--accent);
  display:flex;align-items:center;justify-content:center;margin-bottom:14px;
  transition:transform .25s ease,background-color .25s ease,color .25s ease}
.lp-feat:hover .lp-feat-ic{transform:scale(1.12) rotate(6deg);background:var(--accent);color:#fff}
.lp-feat b{display:block;font-size:15px;margin-bottom:6px}
.lp-feat p{margin:0;font-size:13.5px;color:var(--muted)}

/* ---------- who-it's-for side cards ---------- */
.lp-side{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:22px;
  transition:transform .25s cubic-bezier(.16,1,.3,1),box-shadow .25s ease,border-color .25s ease,background-color .25s ease}
.lp-side:hover{transform:translateX(6px);border-color:var(--accent);box-shadow:0 14px 34px rgba(19,26,36,.10)}
.lp-side-top{display:flex;gap:14px;align-items:flex-start}
.lp-side-ic{flex:none;width:38px;height:38px;border-radius:11px;background:var(--accent-bg);color:var(--accent);
  display:flex;align-items:center;justify-content:center;margin-bottom:0;
  transition:transform .25s ease,background-color .25s ease,color .25s ease}
.lp-side:hover .lp-side-ic{transform:scale(1.12);background:var(--accent);color:#fff}
.lp-side b{display:block;font-size:15px;margin-bottom:5px}
.lp-side p{margin:0;font-size:13.5px;color:var(--muted)}

/* ---------- cta band ---------- */
.lp-band{background:linear-gradient(135deg,var(--accent),var(--accent-ink));border-radius:20px;
  padding:52px 40px;text-align:center;color:#fff;position:relative;overflow:hidden;
  transition:box-shadow .3s ease}
.lp-band:hover{box-shadow:0 24px 60px rgba(43,76,240,.35)}
.lp-band::before{content:"";position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(600px 300px at 20% 0%,rgba(255,255,255,.14),transparent 60%)}
.lp-band h2{margin:0 0 10px;font-size:clamp(22px,2.8vw,32px);font-weight:800;letter-spacing:-.02em;position:relative}
.lp-band p{margin:0 auto 26px;max-width:520px;opacity:.9;font-size:15px;position:relative}
.lp-band .lp-btn-pri{background:#fff;color:var(--accent-ink);box-shadow:none}
.lp-band .lp-btn-pri:hover{background:var(--paper)}
.lp-band .lp-btn-ghost{background:rgba(255,255,255,.12);color:#fff;border-color:rgba(255,255,255,.35)}
.lp-band .lp-btn-ghost:hover{border-color:#fff;color:#fff}

/* ---------- footer ---------- */
.lp-footer{border-top:1px solid var(--line);padding:26px 0 34px;display:flex;align-items:center;
  justify-content:space-between;gap:14px;flex-wrap:wrap;color:var(--faint);font-size:13px;
  transition:border-color .25s ease}
.lp-footer .lp-brand{font-size:14px}

/* focus rings */
.lp-btn:focus-visible,.lp-theme:focus-visible{outline:2px solid var(--accent);outline-offset:2px}

@media (max-width:900px){
  .lp-flow{grid-template-columns:1fr}
  .lp-flow-arrow{transform:rotate(90deg);justify-self:center}
  .lp-flow:hover .lp-flow-arrow{transform:rotate(90deg)}
  .lp-split{grid-template-columns:1fr}
  .lp-steps,.lp-feats{grid-template-columns:1fr 1fr}
}
@media (max-width:600px){
  .lp-inner{padding:0 20px}
  .lp-hero{padding:56px 0 44px}
  .lp-steps,.lp-feats{grid-template-columns:1fr}
  .lp-section{padding:52px 0}
}
`

/* Small helper: stagger delays for sibling reveal cards */
const d = (i, base = 90) => ({ transitionDelay: `${i * base}ms` })

export default function LandingPage({ onSignIn, onRegister }) {
  // Site branding — name, logo and all section copy (falls back to defaults).
  const { branding, landing } = useBrand()
  const logo = branding.logo_data
  const siteName = branding.site_name

  const BrandMark = () => (
    <div className="lp-brand">
      {logo
        ? <img src={logo} alt={siteName} className="lp-brand-logo" />
        : <span className="dot" />}
      <span>{siteName}</span>
    </div>
  )

  // Light/dark toggle — mirrors the in-app theme (same localStorage key the app reads).
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('ps_theme') || 'light' } catch { return 'light' }
  })

  useEffect(() => {
    document.querySelector('.ps-root')?.setAttribute('data-theme', theme)
    try { localStorage.setItem('ps_theme', theme) } catch { /* private mode */ }
  }, [theme])

  // Landing always starts at the top — before first paint so a restored
  // scroll offset (from the auth-skeleton layout) can never flash through.
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Reveal-on-scroll: watch every .lp-reveal element, fade/slide in as it enters the viewport.
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.lp-reveal'))
    if (!('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('lp-in')); return }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return
        const el = en.target
        el.classList.add('lp-in')
        io.unobserve(el)
        // Drop the stagger delay once revealed so hover transitions stay snappy.
        const raw = el.style.transitionDelay || '0ms'
        const delayMs = raw.endsWith('ms') ? parseFloat(raw) : parseFloat(raw) * 1000
        setTimeout(() => { el.style.transitionDelay = '0s' }, delayMs + 800)
      })
    }, { threshold: 0.12, rootMargin: '0px 0px -48px 0px' })
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return (
    <div className="lp-wrap">
      <style>{LP_STYLES}</style>

      {/* nav */}
      <header className="lp-inner lp-reveal">
        <nav className="lp-nav">
          <BrandMark />
          <div className="lp-nav-actions">
            <button
              className="lp-theme"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button className="lp-btn lp-btn-ghost" style={{ padding: '9px 18px', fontSize: 14 }} onClick={onSignIn}>Sign in</button>
            <button className="lp-btn lp-btn-pri" style={{ padding: '9px 18px', fontSize: 14 }} onClick={onRegister}>Register</button>
          </div>
        </nav>
      </header>

      {/* hero */}
      <section className="lp-inner lp-hero">
        <div className="lp-eyebrow lp-reveal" style={d(0)}><Sparkles size={13} /> {landing.eyebrow}</div>
        <h1 className="lp-h1 lp-reveal" style={d(1)}>{renderEm(landing.hero_title)}</h1>
        <p className="lp-sub lp-reveal" style={d(2)}>{landing.hero_subtitle}</p>
        <div className="lp-reveal" style={d(3)}><CtaButtons onSignIn={onSignIn} onRegister={onRegister} /></div>
        <div className="lp-note lp-reveal" style={d(4)}>{landing.hero_note}</div>

        {/* flow strip */}
        <div className="lp-flow">
          {landing.flow.map((step, i) => (
            <React.Fragment key={i}>
              {i > 0 && <div className="lp-flow-arrow lp-reveal" style={d(i * 3 - 1)}><ArrowRight size={18} /></div>}
              <div className="lp-flow-step lp-card-h lp-reveal" style={d(i * 3 + 1)}>
                <b>{step.title}</b>
                <span>{step.body}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* what is it */}
      <section className="lp-section lp-section-tint">
        <div className="lp-inner lp-split">
          <div>
            <div className="lp-kicker lp-reveal">{landing.what.kicker}</div>
            <h2 className="lp-h2 lp-reveal" style={d(1)}>{landing.what.title}</h2>
            <p className="lp-lead lp-reveal" style={d(2)}>{landing.what.body}</p>
            <ul className="lp-checklist">
              {landing.what.checklist.map((item, i) => (
                <li key={i} className="lp-reveal" style={d(i + 3)}><span className="lp-tick"><Check size={12} /></span>{item}</li>
              ))}
            </ul>
          </div>
          <div className="lp-mock lp-reveal" style={d(3)} aria-hidden="true">
            <div className="lp-mock-top">
              <div className="lp-mock-title">Discovery · 20 min</div>
              <div className="lp-mock-badge">● LIVE</div>
            </div>
            <div className="lp-mock-pills">
              <span className="lp-pill">SPIN Selling</span><span className="lp-pill">English</span>
              <span className="lp-pill"><MapPin size={10} style={{ marginRight: 3 }} />India</span><span className="lp-pill">Balanced</span>
            </div>
            <div className="lp-seg">
              <b>0–4 min · Opening <span>00:42</span></b>
              <p>"Quick heads-up on how I'd like to use the next 20 minutes — I'll ask a few questions about how your team runs calls today, and if it makes sense we'll look at a demo…"</p>
            </div>
            <div className="lp-seg coach">
              <b>Coaching — don't read aloud <span>04:00</span></b>
              <p>Let the buyer finish their sentence. If they mention churn, park it — revisit at minute 12.</p>
            </div>
            <div className="lp-seg">
              <b>12–18 min · Value <span>12:10</span></b>
              <p>"Teams your size usually lose deals in the first 5 minutes. Here's how the cockpit changes that…"</p>
            </div>
          </div>
        </div>
      </section>

      {/* how it works */}
      <section className="lp-section">
        <div className="lp-inner">
          <div className="lp-kicker lp-reveal">{landing.how.kicker}</div>
          <h2 className="lp-h2 lp-reveal" style={d(1)}>{landing.how.title}</h2>
          <p className="lp-lead lp-reveal" style={d(2)}>{landing.how.lead}</p>
          <div className="lp-steps">
            {landing.how.steps.map((step, i) => (
              <div key={i} className="lp-step lp-reveal" style={d(i, 120)}>
                <div className="lp-step-num">{i + 1}</div>
                <b>{step.title}</b>
                <p>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* features */}
      <section className="lp-section lp-section-tint">
        <div className="lp-inner">
          <div className="lp-kicker lp-reveal">{landing.features.kicker}</div>
          <h2 className="lp-h2 lp-reveal" style={d(1)}>{landing.features.title}</h2>
          <div className="lp-feats">
            {landing.features.items.map((feat, i) => {
              const FeatIcon = FEAT_ICONS[i % FEAT_ICONS.length]
              return (
                <div key={i} className="lp-feat lp-reveal" style={d(i, 100)}>
                  <div className="lp-feat-ic"><FeatIcon size={18} /></div>
                  <b>{feat.title}</b>
                  <p>{feat.body}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* who it's for */}
      <section className="lp-section">
        <div className="lp-inner lp-split">
          <div>
            <div className="lp-kicker lp-reveal">{landing.who.kicker}</div>
            <h2 className="lp-h2 lp-reveal" style={d(1)}>{landing.who.title}</h2>
            <p className="lp-lead lp-reveal" style={d(2)}>{landing.who.lead}</p>
          </div>
          <div style={{ display: 'grid', gap: 18 }}>
            {landing.who.cards.map((card, i) => {
              const CardIcon = SIDE_ICONS[i % SIDE_ICONS.length]
              return (
                <div key={i} className="lp-side lp-reveal" style={d(i, 120)}>
                  <div className="lp-side-top">
                    <div className="lp-side-ic"><CardIcon size={17} /></div>
                    <div><b>{card.title}</b><p>{card.body}</p></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* final cta */}
      <section className="lp-inner lp-reveal" style={{ paddingBottom: 72 }}>
        <div className="lp-band">
          <h2>{landing.cta.title}</h2>
          <p>{landing.cta.body}</p>
          <div className="lp-cta">
            <button className="lp-btn lp-btn-pri" onClick={onRegister}>Register free <ArrowRight size={16} /></button>
            <button className="lp-btn lp-btn-ghost" onClick={onSignIn}>I already have an account</button>
          </div>
        </div>
      </section>

      <footer className="lp-inner lp-footer lp-reveal">
        <BrandMark />
        <div>{landing.footer_tagline}</div>
      </footer>
    </div>
  )
}

/* Icons for the feature grid / who-it's-for cards — keep the original
   per-slot look no matter how the admin edits the copy. */
const FEAT_ICONS = [Zap, MessageSquareText, Timer, Languages, BarChart3, Users]
const SIDE_ICONS = [Shield, Timer, BarChart3]

function CtaButtons({ onSignIn, onRegister }) {
  return (
    <div className="lp-cta">
      <button className="lp-btn lp-btn-pri" onClick={onRegister}>
        Create free account <ArrowRight size={16} />
      </button>
      <button className="lp-btn lp-btn-ghost" onClick={onSignIn}>Sign in</button>
    </div>
  )
}