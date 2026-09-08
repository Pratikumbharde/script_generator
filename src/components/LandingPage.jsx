import React, { useState, useEffect, useLayoutEffect } from 'react'
import {
  ArrowRight, Check, Zap, Timer, Languages, Shield, BarChart3,
  MessageSquareText, Users, MapPin, Sparkles, Sun, Moon,
} from 'lucide-react'

/* ============================================================
   LandingPage — public marketing page shown before auth.
   Explains what Pitch Studio is, with Sign in / Register CTAs.
   Uses the app's CSS variables so it follows light/dark theme,
   with a nav toggle for visitors (persisted to localStorage).
   Sections reveal on scroll via IntersectionObserver.
   ============================================================ */

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
          <div className="lp-brand"><span className="dot" />Pitch Studio</div>
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
        <div className="lp-eyebrow lp-reveal" style={d(0)}><Sparkles size={13} /> AI-powered sales enablement</div>
        <h1 className="lp-h1 lp-reveal" style={d(1)}>Walk into every sales call with the <em>perfect script</em> — already in your pocket.</h1>
        <p className="lp-sub lp-reveal" style={d(2)}>
          Pitch Studio is a live-call cockpit for sales teams. Enter your product once, pick a methodology,
          and AI writes a time-segmented call script with objection handling — so every rep pitches like your best rep.
        </p>
        <div className="lp-reveal" style={d(3)}><CtaButtons onSignIn={onSignIn} onRegister={onRegister} /></div>
        <div className="lp-note lp-reveal" style={d(4)}>Free to start · No credit card · Your scripts stay saved — never regenerated</div>

        {/* flow strip */}
        <div className="lp-flow">
          <div className="lp-flow-step lp-card-h lp-reveal" style={d(5)}>
            <b>1 · Describe your product once</b>
            <span>What it does, who it's for, pain points, proof — entered a single time.</span>
          </div>
          <div className="lp-flow-arrow lp-reveal" style={d(6)}><ArrowRight size={18} /></div>
          <div className="lp-flow-step lp-card-h lp-reveal" style={d(7)}>
            <b>2 · Pick methodology + call type</b>
            <span>SPIN, MEDDIC, Challenger… for cold calls, demos, discovery, negotiation and more.</span>
          </div>
          <div className="lp-flow-arrow lp-reveal" style={d(8)}><ArrowRight size={18} /></div>
          <div className="lp-flow-step lp-card-h lp-reveal" style={d(9)}>
            <b>3 · Run the live call</b>
            <span>A time-segmented cockpit with "say this" lines, coaching notes and objection answers.</span>
          </div>
        </div>
      </section>

      {/* what is it */}
      <section className="lp-section lp-section-tint">
        <div className="lp-inner lp-split">
          <div>
            <div className="lp-kicker lp-reveal">What is Pitch Studio?</div>
            <h2 className="lp-h2 lp-reveal" style={d(1)}>Not another script library. A cockpit you run the call from.</h2>
            <p className="lp-lead lp-reveal" style={d(2)}>
              Most teams keep pitch docs nobody reads. Pitch Studio turns your product knowledge into a
              live, minute-by-minute playbook: each segment of your call shows exactly what to say out loud,
              what to keep to yourself, and how to handle whatever the buyer throws at you — timed to your call length.
            </p>
            <ul className="lp-checklist">
              <li className="lp-reveal" style={d(3)}><span className="lp-tick"><Check size={12} /></span>Scripts are saved forever and only change when you say so</li>
              <li className="lp-reveal" style={d(4)}><span className="lp-tick"><Check size={12} /></span>Every line split into "say aloud" vs. "coaching — for you only"</li>
              <li className="lp-reveal" style={d(5)}><span className="lp-tick"><Check size={12} /></span>One-click translations for the languages your team speaks</li>
              <li className="lp-reveal" style={d(6)}><span className="lp-tick"><Check size={12} /></span>Post-call outcome tracking feeds win-rate analytics</li>
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
          <div className="lp-kicker lp-reveal">How it works</div>
          <h2 className="lp-h2 lp-reveal" style={d(1)}>From product page to call-ready in three steps</h2>
          <p className="lp-lead lp-reveal" style={d(2)}>Setup takes minutes. After that, generating a new script for any call type takes seconds.</p>
          <div className="lp-steps">
            <div className="lp-step lp-reveal" style={d(0, 120)}>
              <div className="lp-step-num">1</div>
              <b>Add your product</b>
              <p>Name, category, one-liner, ideal customer, pain points, differentiators, pricing and proof points — a two-minute form that powers every script you'll ever generate.</p>
            </div>
            <div className="lp-step lp-reveal" style={d(1, 120)}>
              <div className="lp-step-num">2</div>
              <b>Configure the call</b>
              <p>Choose a sales methodology, call type and duration. Pick tone — soft, balanced or hard — plus language, region and delivery style.</p>
            </div>
            <div className="lp-step lp-reveal" style={d(2, 120)}>
              <div className="lp-step-num">3</div>
              <b>Run the call live</b>
              <p>Open the cockpit, hit "Start call", and work through timed phases with say-aloud lines, private coaching and instant objection handling.</p>
            </div>
          </div>
        </div>
      </section>

      {/* features */}
      <section className="lp-section lp-section-tint">
        <div className="lp-inner">
          <div className="lp-kicker lp-reveal">Everything around the call</div>
          <h2 className="lp-h2 lp-reveal" style={d(1)}>Built for the whole sales motion, not just the pitch</h2>
          <div className="lp-feats">
            <div className="lp-feat lp-reveal" style={d(0, 100)}>
              <div className="lp-feat-ic"><Zap size={18} /></div>
              <b>15+ sales methodologies</b>
              <p>SPIN, MEDDIC, Challenger, Sandler, BANT, Gap and more — the AI adapts tone and structure to the method you pick.</p>
            </div>
            <div className="lp-feat lp-reveal" style={d(1, 100)}>
              <div className="lp-feat-ic"><MessageSquareText size={18} /></div>
              <b>Objection handling</b>
              <p>Search any objection and get a reframe in your method's style — never argue, always redirect.</p>
            </div>
            <div className="lp-feat lp-reveal" style={d(2, 100)}>
              <div className="lp-feat-ic"><Timer size={18} /></div>
              <b>Live call timer</b>
              <p>Segments mapped to your call length with a running clock, so you always know where you are in the pitch.</p>
            </div>
            <div className="lp-feat lp-reveal" style={d(3, 100)}>
              <div className="lp-feat-ic"><Languages size={18} /></div>
              <b>10 languages, one script</b>
              <p>Generate side-by-side translations — English, Hindi, Hinglish, Marathi, Tamil and more — for every teammate.</p>
            </div>
            <div className="lp-feat lp-reveal" style={d(4, 100)}>
              <div className="lp-feat-ic"><BarChart3 size={18} /></div>
              <b>Analytics & win rates</b>
              <p>Track outcomes per script, spot which methods close, and see which phrases actually land.</p>
            </div>
            <div className="lp-feat lp-reveal" style={d(5, 100)}>
              <div className="lp-feat-ic"><Users size={18} /></div>
              <b>Team workspace</b>
              <p>Roles and permissions, shared scripts, coaching feedback and leaderboards that keep the whole team sharp.</p>
            </div>
          </div>
        </div>
      </section>

      {/* who it's for */}
      <section className="lp-section">
        <div className="lp-inner lp-split">
          <div>
            <div className="lp-kicker lp-reveal">Who it's for</div>
            <h2 className="lp-h2 lp-reveal" style={d(1)}>One workspace for reps, managers and founders</h2>
            <p className="lp-lead lp-reveal" style={d(2)}>
              SDRs walk into cold calls prepared. Account executives run discovery and demos from a cockpit
              instead of sticky notes. Sales managers coach from real data — not gut feel. And founders can
              finally hand their pitch to a new hire without it falling apart on call three.
            </p>
          </div>
          <div style={{ display: 'grid', gap: 18 }}>
            <div className="lp-side lp-reveal" style={d(0, 120)}>
              <div className="lp-side-top">
                <div className="lp-side-ic"><Shield size={17} /></div>
                <div><b>Your data stays yours</b><p>Each company gets a private workspace — products, scripts and team data are scoped to you.</p></div>
              </div>
            </div>
            <div className="lp-side lp-reveal" style={d(1, 120)}>
              <div className="lp-side-top">
                <div className="lp-side-ic"><Timer size={17} /></div>
                <div><b>Works on any device</b><p>Installable as an app (PWA) — keep the cockpit open on a second screen during live calls.</p></div>
              </div>
            </div>
            <div className="lp-side lp-reveal" style={d(2, 120)}>
              <div className="lp-side-top">
                <div className="lp-side-ic"><BarChart3 size={17} /></div>
                <div><b>Gets smarter with use</b><p>Conversation Intelligence surfaces your best-performing phrases so scripts keep improving.</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* final cta */}
      <section className="lp-inner lp-reveal" style={{ paddingBottom: 72 }}>
        <div className="lp-band">
          <h2>Ready to pitch like your best rep — every call?</h2>
          <p>Create your workspace in under a minute. Your first script is a few clicks away.</p>
          <div className="lp-cta">
            <button className="lp-btn lp-btn-pri" onClick={onRegister}>Register free <ArrowRight size={16} /></button>
            <button className="lp-btn lp-btn-ghost" onClick={onSignIn}>I already have an account</button>
          </div>
        </div>
      </section>

      <footer className="lp-inner lp-footer lp-reveal">
        <div className="lp-brand"><span className="dot" />Pitch Studio</div>
        <div>The live-call cockpit for sales teams — script it, say it, close it.</div>
      </footer>
    </div>
  )
}

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