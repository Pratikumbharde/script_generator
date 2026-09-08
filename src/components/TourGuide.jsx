import React, { useState, useEffect, useRef, useCallback } from 'react'
import { TOUR_STEPS } from '../data/tourSteps.js'
import { consumeTourRequest } from '../utils/tourSignal.js'
import { useBrand, withSiteName } from '../context/BrandContext.jsx'
import { X, ArrowRight, ArrowLeft, Compass } from 'lucide-react'

/* ============================================================
   TourGuide — onboarding walkthrough across every page.
   - Spotlight + tooltip per step; centered modal for welcome/done.
   - Navigates between pages via setView and waits for the target
     to appear (handles lazy-loaded views and data refreshes).
   - Auto-starts on every real login (login/register), via the
     one-shot signal in utils/tourSignal.js. A restored session
     (page refresh) does NOT re-trigger it. Once closed it stays
     closed until the next logout → login. Replayable anytime via
     the sidebar Help button (window event 'ps:start-tour').
   ============================================================ */

const TOUR_EVENT = 'ps:start-tour'

/* A target counts only when it's actually laid out. When React suspends a
   lazy view it HIDES the previous page's tree with display:none instead of
   unmounting it — so the old page's header is still in the DOM at 0×0.
   Measuring that would shrink the spotlight to a dot at the corner. */
const isVisibleTarget = (el) => {
  if (!el) return false
  const r = el.getBoundingClientRect()
  return r.width > 1 && r.height > 1
}

const TOUR_CSS = `
.tg-blocker{position:fixed;inset:0;z-index:99998}
.tg-spot{position:fixed;z-index:99999;pointer-events:none;border:2px solid var(--accent);
  border-radius:14px;box-shadow:0 0 0 9999px rgba(10,15,26,.62),0 0 24px rgba(43,76,240,.45);
  transition:all .35s cubic-bezier(.4,0,.2,1)}
.tg-dim{position:fixed;inset:0;z-index:99999;background:rgba(10,15,26,.62);pointer-events:none;
  transition:opacity .3s ease}
.tg-tip{position:fixed;z-index:100000;width:360px;background:var(--card);color:var(--ink);
  border:1px solid var(--line);border-radius:14px;padding:18px 18px 14px;
  box-shadow:0 18px 50px rgba(10,15,26,.35);animation:tg-pop .3s cubic-bezier(.16,1,.3,1)}
@keyframes tg-pop{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.tg-group{font-size:10.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;
  color:var(--accent);margin-bottom:6px;display:flex;align-items:center;gap:6px}
.tg-title{font-size:16px;font-weight:800;letter-spacing:-.01em;margin-bottom:7px}
.tg-body{font-size:13px;line-height:1.55;color:var(--muted);margin-bottom:14px}
.tg-meta{display:flex;align-items:center;justify-content:space-between;gap:10px}
.tg-count{font-size:12px;font-weight:700;color:var(--faint)}
.tg-btns{display:flex;gap:8px}
.tg-btn{display:inline-flex;align-items:center;gap:6px;border-radius:9px;padding:8px 14px;
  font-size:13px;font-weight:700;cursor:pointer;border:1px solid var(--line);
  background:var(--card);color:var(--ink);transition:transform .15s ease,border-color .15s ease,background-color .15s ease}
.tg-btn:hover{transform:translateY(-1px);border-color:var(--accent);color:var(--accent)}
.tg-btn:disabled{opacity:.45;cursor:default;transform:none}
.tg-btn-pri{background:var(--accent);border-color:var(--accent);color:#fff}
.tg-btn-pri:hover{background:var(--accent-ink);color:#fff}
.tg-skip{position:absolute;top:10px;right:10px;width:26px;height:26px;border-radius:8px;border:none;
  background:transparent;color:var(--faint);cursor:pointer;display:flex;align-items:center;justify-content:center;
  transition:color .15s ease,background-color .15s ease}
.tg-skip:hover{color:var(--ink);background:var(--surface)}
.tg-progress{position:absolute;left:0;top:0;height:3px;background:var(--accent);border-radius:3px;
  transition:width .35s ease}
.tg-icon{width:42px;height:42px;border-radius:12px;background:var(--accent-bg);color:var(--accent);
  display:flex;align-items:center;justify-content:center;margin:0 auto 14px}
.tg-center .tg-title{text-align:center}
.tg-center .tg-body{text-align:center}
@media (max-width:640px){
  .tg-tip{left:12px !important;right:12px !important;width:auto !important;top:auto !important;
    bottom:80px !important;transform:none !important}
}
`

export default function TourGuide({ view, setView, user, canGenerate }) {
  const { branding } = useBrand()
  const [running, setRunning] = useState(false)
  const [idx, setIdx] = useState(0)
  const [rect, setRect] = useState(null)
  const [targetless, setTargetless] = useState(true)
  const [ready, setReady] = useState(false)
  const viewRef = useRef(view)
  viewRef.current = view

  // Role-gate the steps: members don't see product/team/admin pages.
  const steps = React.useMemo(() => {
    const isAdmin = canGenerate && user?.role === 'admin'
    return TOUR_STEPS.filter((s) => {
      if (s.require === 'canGenerate' && !canGenerate) return false
      if (s.require === 'admin' && !isAdmin) return false
      return true
    })
  }, [canGenerate, user])

  const step = steps[idx]
  const isFirst = idx === 0
  const isLast = idx === steps.length - 1

  const finish = React.useCallback(() => {
    setRunning(false)
  }, [])

  const goTo = React.useCallback((i) => {
    const s = steps[i]
    if (!s) return
    setIdx(i)
    setReady(false)
    setRect(null)
    setTargetless(!s.selector)
    if (s.view && s.view !== viewRef.current) setView(s.view)
  }, [steps, setView])

  const next = React.useCallback(() => {
    if (idx < steps.length - 1) goTo(idx + 1)
    else finish()
  }, [idx, steps, goTo, finish])

  const prev = React.useCallback(() => { if (idx > 0) goTo(idx - 1) }, [idx, goTo])

  /* auto-start on every actual login (not on session restore/refresh).
     No cleanup on this timer — StrictMode double-runs this effect and
     the signal is one-shot, so a cleaned-up timer would swallow it. */
  useEffect(() => {
    if (consumeTourRequest()) setTimeout(() => setRunning(true), 900)
  }, [])

  /* replay from the sidebar Help button */
  useEffect(() => {
    const h = () => setRunning(true)
    window.addEventListener(TOUR_EVENT, h)
    return () => window.removeEventListener(TOUR_EVENT, h)
  }, [])

  /* when a step is set, wait for its target element to exist */
  useEffect(() => {
    if (!running) return
    if (!step) return
    if (targetless) { setReady(true); return }
    let cancelled = false
    const started = Date.now()
    const tryFind = () => {
      if (cancelled) return
      const el = document.querySelector(step.selector)
      if (el && isVisibleTarget(el)) {
        // bring it into view, then measure
        el.scrollIntoView({ block: 'center', behavior: 'instant' })
        requestAnimationFrame(() => {
          if (cancelled) return
          if (!isVisibleTarget(el)) return
          const r = el.getBoundingClientRect()
          setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
          setReady(true)
          /* Views keep reflowing after their target first appears — entry
             transitions, data-driven layout shifts, font swaps. A single
             measurement can catch the element mid-settle (it froze on a
             half-laid-out header once), so re-measure as the page settles. */
          ;[250, 600, 1100, 1700].forEach((ms) => {
            setTimeout(() => {
              if (cancelled) return
              const cur = document.querySelector(step.selector)
              if (!isVisibleTarget(cur)) return
              const cr = cur.getBoundingClientRect()
              setRect((prev) => {
                if (prev && Math.abs(prev.top - cr.top) < 1 && Math.abs(prev.left - cr.left) < 1 &&
                    Math.abs(prev.width - cr.width) < 1 && Math.abs(prev.height - cr.height) < 1) return prev
                return { top: cr.top, left: cr.left, width: cr.width, height: cr.height }
              })
            }, ms)
          })
        })
      } else if (Date.now() - started < 12000) {
        setTimeout(tryFind, 120)
      } else {
        // target never appeared — fall back to a centered tip
        setRect(null)
        setTargetless(true)
        setReady(true)
      }
    }
    tryFind()
    return () => { cancelled = true }
  }, [running, idx, view, step, targetless])

  /* keep the spotlight glued to the target on scroll/resize */
  useEffect(() => {
    if (!running || !ready || targetless || !step) return
    const update = () => {
      const el = document.querySelector(step.selector)
      if (!el || !isVisibleTarget(el)) return // never clobber with a hidden 0×0 box
      const r = el.getBoundingClientRect()
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    }
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [running, ready, targetless, idx, step])

  /* keyboard controls */
  useEffect(() => {
    if (!running) return
    const h = (e) => {
      if (e.key === 'Escape') finish()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [running, next, prev, finish])

  if (!running || !step) return null

  /* tooltip position */
  let tipStyle
  if (targetless || !rect) {
    tipStyle = { left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }
  } else {
    const TIP_W = 360
    const spaceBelow = window.innerHeight - (rect.top + rect.height)
    const pos = spaceBelow > 210 ? 'bottom' : 'top'
    const top = pos === 'bottom'
      ? Math.min(rect.top + rect.height + 14, window.innerHeight - 220)
      : Math.max(12, rect.top - 14 - 300)
    const left = Math.min(Math.max(12, rect.left + rect.width / 2 - TIP_W / 2), window.innerWidth - TIP_W - 12)
    tipStyle = { top, left }
  }

  return (
    <>
      <style>{TOUR_STYLES_PLACEHOLDER}</style>
      <div className="tg-blocker" />
      {(targetless || !rect)
        ? <div className="tg-dim" />
        : (
          <div
            className="tg-spot"
            style={{ top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12, opacity: ready ? 1 : 0 }}
          />
        )}
      <div className={`tg-tip${targetless ? ' tg-center' : ''}`} style={tipStyle} role="dialog" aria-label={step.title}>
        <div className="tg-progress" style={{ width: `${((idx + 1) / steps.length) * 100}%` }} />
        <button className="tg-skip" onClick={() => finish()} aria-label="Skip tour"><X size={15} /></button>
        {step.centered && <div className="tg-icon"><Compass size={22} /></div>}
        {step.group && <div className="tg-group"><Compass size={11} />{step.group}</div>}
        <div className="tg-title">{withSiteName(step.title, branding.site_name)}</div>
        <div className="tg-body">{withSiteName(step.body, branding.site_name)}</div>
        <div className="tg-meta">
          <span className="tg-count">{idx + 1} / {steps.length}</span>
          <div className="tg-btns">
            {!isFirst && (
              <button className="tg-btn" onClick={prev}><ArrowLeft size={14} />Back</button>
            )}
            <button className="tg-btn tg-btn-pri" onClick={next}>
              {isLast ? 'Finish' : isFirst ? 'Start tour' : 'Next'}{!isLast && <ArrowRight size={14} />}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

const TOUR_STYLES_PLACEHOLDER = TOUR_CSS