import React, { useState, useEffect, useRef } from "react";
import {
  METHODS, CALL_TYPES, DURATIONS, LANGUAGES, TONE_COLOR, methodsFor, durationsFor, durationHintFor
} from "../data/constants.js";
import { S, slug, scriptKey, generateScript, nameOf, normalizeSegments, updateScriptMeta } from "../utils/helpers.js";
import { useOutsideClick, useDropdownPos } from "./shared/DropdownHooks.js";
import LimitedInput from "./shared/LimitedInput.jsx";
import LimitedTextarea from "./shared/LimitedTextarea.jsx";
import { CardSkeleton, CockpitSkeleton } from "./shared/Skeletons.jsx";
import CallCockpit from "./CallCockpit.jsx";
import { createShareLink, updateScript } from "../api/client.js";
import ScriptComments from "./ScriptComments.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  Play, Pause, RotateCcw, Phone, Mic, ChevronRight,
  MoreHorizontal, Copy, Printer, Share2, FileText,
  CheckCircle2, AlertTriangle, Clock, Volume2, Globe,
  Sparkles, Pencil, Plus, X, Trash2, Check
} from "lucide-react";

/* ============================================================
   Script Cockpit — refined execution workspace
   Say This is dominant. Coaching is secondary.
   Call state is explicit. Actions are tiered.
   ============================================================ */

export default function Cockpit({ product, method, callType, duration, meta, script, opts, onBack, onChangeSetup, onRegenerate, regenerating, readOnly }) {
  const { user } = useAuth();
  const primaryLang = opts?.language || "en";
  const [callMode, setCallMode] = useState(false);
  const [langScripts, setLangScripts] = useState({ [primaryLang]: script });
  const [displayLangs, setDisplayLangs] = useState([primaryLang]);
  const [availableLangs, setAvailableLangs] = useState([primaryLang]);
  const [genLang, setGenLang] = useState(null);
  const [genError, setGenError] = useState("");

  // P1.2: outcome tracking
  const [outcome, setOutcome] = useState("pending");
  const [notes, setNotes] = useState("");
  const [usedAt, setUsedAt] = useState(null);
  const [savingMeta, setSavingMeta] = useState(false);

  // P5.2: share & export
  const [showShare, setShowShare] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [shareLoading, setShareLoading] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [copied, setCopied] = useState(false);

  // Overflow menu
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const menuBtnRef = useRef(null);
  const menuPos = useDropdownPos(menuBtnRef, menuOpen);
  useOutsideClick(menuRef, () => setMenuOpen(false));

  // Inline editing
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editScript, setEditScript] = useState(null);

  const startEditing = () => {
    setEditScript(JSON.parse(JSON.stringify(primaryScript)));
    setEditing(true);
  };
  const cancelEditing = () => {
    setEditScript(null);
    setEditing(false);
  };
  const saveEdits = async () => {
    if (!editScript || !script?.id) return;
    setSaving(true);
    try {
      await updateScript(script.id, {
        opening: editScript.opening,
        tone_level: editScript.toneLevel,
        tone_guidance: editScript.toneGuidance,
        segments: editScript.segments,
        objections: editScript.objections,
      });
      // Update local state
      setLangScripts((prev) => ({ ...prev, [primaryLang]: { ...prev[primaryLang], ...editScript } }));
      setEditing(false);
      setEditScript(null);
    } catch (e) {
      console.error("Save failed:", e);
      alert("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // load saved outcome/notes/used_at
  useEffect(() => {
    if (!opts) return;
    let live = true;
    (async () => {
      const k = scriptKey(product.id, opts);
      const rec = await S.get(k);
      if (!live || !rec) return;
      if (rec.outcome) setOutcome(rec.outcome);
      if (rec.notes) setNotes(rec.notes);
      if (rec.usedAt) setUsedAt(rec.usedAt);
    })();
    return () => { live = false; };
  }, [product.id, opts?.method, opts?.callType, opts?.duration, opts?.language, opts?.region, opts?.delivery, opts?.simple, opts?.persona]);

  const saveOutcome = async (val) => {
    setSavingMeta(true);
    setOutcome(val);
    await updateScriptMeta(scriptKey(product.id, opts), { outcome: val, notes });
    setSavingMeta(false);
  };
  const saveNotes = async (val) => {
    setSavingMeta(true);
    setNotes(val);
    await updateScriptMeta(scriptKey(product.id, opts), { outcome, notes: val });
    setSavingMeta(false);
  };
  const markUsed = async () => {
    const now = Date.now();
    setUsedAt(now);
    await updateScriptMeta(scriptKey(product.id, opts), { used_at: now });
  };

  // share
  const generateShareLink = async () => {
    setShareLoading(true);
    try {
      const res = await createShareLink(script.id || 0, 7);
      setShareUrl(res.shareUrl || "");
    } catch (e) {
      console.error(e);
      setShareUrl("");
    } finally { setShareLoading(false); }
  };

  const formatScriptForExport = () => {
    const lines = [];
    lines.push(`# ${product.name} — ${method.name} · ${callType.name} · ${duration} min`);
    lines.push(`Language: ${meta.language?.name} | Region: ${meta.region?.name} | Delivery: ${meta.delivery?.name}`);
    lines.push("");
    lines.push("## Opening");
    lines.push(script.opening || "");
    lines.push("");
    const segs = normalizeSegments(script.segments, duration);
    segs.forEach((seg, i) => {
      const data = script.segments?.[i] || {};
      lines.push(`## Segment ${i + 1}: ${data.label || `Phase ${i + 1}`} (${seg.start}–${seg.end} min)`);
      if (data.goal) lines.push(`Goal: ${data.goal}`);
      if (data.say?.length) { lines.push("Say:"); data.say.forEach((s) => lines.push(`  • ${s}`)); }
      if (data.ask?.length) { lines.push("Ask:"); data.ask.forEach((a) => lines.push(`  ? ${a}`)); }
      if (data.do?.length) { lines.push("Coaching:"); data.do.forEach((d) => lines.push(`  • ${d}`)); }
      lines.push("");
    });
    if (script.objections?.length) {
      lines.push("## Objection Handling");
      script.objections.forEach((o) => {
        lines.push(`Objection: ${o.objection}`);
        lines.push(`Response: ${o.response}`);
        lines.push("");
      });
    }
    return lines.join("\n");
  };

  const copyToClipboard = async () => {
    const text = formatScriptForExport();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) { console.error(e); }
  };

  // discover other saved languages
  useEffect(() => {
    if (!opts) return;
    let live = true;
    (async () => {
      const found = [];
      for (const l of LANGUAGES) {
        if (l.id === primaryLang) { found.push(l.id); continue; }
        const k = scriptKey(product.id, { ...opts, language: l.id });
        const rec = await S.get(k);
        if (rec?.data) found.push(l.id);
      }
      if (live) setAvailableLangs(found);
    })();
    return () => { live = false; };
  }, [product.id, opts?.method, opts?.callType, opts?.duration, opts?.region, opts?.delivery, opts?.simple, opts?.persona, primaryLang]);

  const toggleDisplayLang = async (lid) => {
    if (displayLangs.includes(lid)) {
      if (displayLangs.length > 1) setDisplayLangs(displayLangs.filter((x) => x !== lid));
      return;
    }
    if (displayLangs.length >= 3) return;
    if (!langScripts[lid]) {
      const k = scriptKey(product.id, { ...opts, language: lid });
      const rec = await S.get(k);
      if (rec?.data) setLangScripts((s) => ({ ...s, [lid]: rec.data }));
      else return;
    }
    setDisplayLangs([...displayLangs, lid]);
  };

  const generateForLang = async (lid) => {
    setGenLang(lid); setGenError("");
    try {
      const mObj = METHODS.find((m) => m.id === opts.method);
      const cObj = CALL_TYPES.find((c) => c.id === opts.callType);
      const data = await generateScript({
        product, method: mObj, callType: cObj, duration: opts.duration,
        language: lid, region: opts.region, delivery: opts.delivery, simple: opts.simple, persona: opts.persona,
      });
      const k = scriptKey(product.id, { ...opts, language: lid });
      const metaSave = { productId: product.id, productName: product.name, method: opts.method, callType: opts.callType, duration: opts.duration, language: lid, region: opts.region, delivery: opts.delivery, simple: opts.simple, persona: opts.persona };
      await S.set(k, { data, savedAt: Date.now(), meta: metaSave });
      setLangScripts((s) => ({ ...s, [lid]: data }));
      setAvailableLangs((a) => a.includes(lid) ? a : [...a, lid]);
      if (!displayLangs.includes(lid) && displayLangs.length < 3) setDisplayLangs([...displayLangs, lid]);
    } catch (e) {
      setGenError(`Couldn't generate ${(LANGUAGES.find((l) => l.id === lid) || {}).name}: ${e.message || "please try again."}`);
    } finally { setGenLang(null); }
  };

  const primaryScript = langScripts[primaryLang] || script;
  const segments = normalizeSegments(primaryScript.segments, duration);

  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [open, setOpen] = useState(() => new Set([0]));
  const [checks, setChecks] = useState({});
  const [confirmRegen, setConfirmRegen] = useState(false);
  const tick = useRef(null);

  useEffect(() => {
    if (running) { tick.current = setInterval(() => setElapsed((e) => e + 1), 1000); }
    return () => clearInterval(tick.current);
  }, [running]);

  const elapsedMin = elapsed / 60;
  const activeIdx = segments.findIndex((s) => elapsedMin >= s.start && elapsedMin < s.end);
  const curIdx = activeIdx === -1 ? (elapsedMin >= duration ? segments.length - 1 : 0) : activeIdx;

  useEffect(() => { if (running) setOpen((o) => new Set(o).add(curIdx)); }, [curIdx, running]);

  const toggleSeg = (i) => setOpen((o) => { const n = new Set(o); n.has(i) ? n.delete(i) : n.add(i); return n; });
  const toggleCheck = (id) => setChecks((c) => ({ ...c, [id]: !c[id] }));
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  const over = elapsed > duration * 60;
  const playLeft = Math.min(100, (elapsedMin / duration) * 100);

  const multi = displayLangs.length > 1;

  // Call state display
  const callState = running ? "live" : elapsed > 0 ? "paused" : "ready";
  const stateMeta = {
    ready: { label: "Ready", color: "var(--accent)", icon: Clock },
    live: { label: "Live", color: "#1A7F5B", icon: Volume2 },
    paused: { label: "Paused", color: "#B5720F", icon: Pause },
  };
  const StateIcon = stateMeta[callState].icon;

  return (
    <>
      {callMode && (
        <CallCockpit
          product={product}
          method={method}
          callType={callType}
          duration={duration}
          script={script}
          meta={meta}
          onExit={() => setCallMode(false)}
        />
      )}
      <div className="ps-top" style={{ paddingTop: 18 }}>
        <div>
          <div className="crumb" onClick={onBack}>← Products</div>
          <div className="ps-eyebrow">{product.name}</div>
          <div className="ps-title">{callType.name} · {duration} min</div>
          <div className="ps-sub">
            {readOnly && <span className="chip n" style={{ background: "#B5720F", color: "#fff", marginRight: 8, fontSize: 11 }}>Read-only</span>}
            <span className="dt-pill" style={{ fontSize: 11, padding: "2px 8px", verticalAlign: "middle", marginRight: 6 }}>
              {method.name}
            </span>
            Running the <b style={{ color: "var(--ink)" }}>{method.name}</b> playbook.
          </div>
        </div>
        <div className="ps-top-actions">
          {!readOnly && !editing && <button className="ps-btn ghost sm" onClick={startEditing}><Pencil size={14} /> Edit</button>}
          {editing && (
            <>
              <button className="ps-btn pri sm" onClick={saveEdits} disabled={saving}>
                {saving ? <><span className="spinner" /> Saving…</> : <><Check size={14} /> Save</>}
              </button>
              <button className="ps-btn ghost sm" onClick={cancelEditing} disabled={saving}>Cancel</button>
            </>
          )}
          {!readOnly && <button className="ps-btn ghost sm" onClick={onChangeSetup}>Change setup</button>}
          {!readOnly && <button className="ps-btn ghost sm" onClick={() => setConfirmRegen(true)}>↻ Regenerate</button>}
          <button className="ps-btn pri" onClick={() => setCallMode(true)}>
            <Phone size={15} /> Call Mode
          </button>
          {!readOnly && (
          <div className="dt-actions" ref={menuRef}>
            <button ref={menuBtnRef} className="dt-more-btn" onClick={() => setMenuOpen((s) => !s)} title="More actions">
              <MoreHorizontal size={16} />
            </button>
            {menuOpen && menuPos && (
              <div className="dt-dropdown" style={menuPos}>
                <button className="dt-dropdown-item" onClick={() => { copyToClipboard(); setMenuOpen(false); }}>
                  <Copy size={14} /> {copied ? "Copied" : "Copy script"}
                </button>
                <button className="dt-dropdown-item" onClick={() => { setShowPrint(true); setTimeout(() => window.print(), 50); setMenuOpen(false); }}>
                  <Printer size={14} /> Print
                </button>
                <button className="dt-dropdown-item" onClick={() => { setShowShare(true); generateShareLink(); setMenuOpen(false); }}>
                  <Share2 size={14} /> Share
                </button>
              </div>
            )}
          </div>
          )}
        </div>
      </div>

      <div className="ps-body">
        {/* Language selector — compact */}
        <div className="lang-switcher">
          <div className="ls-label"><Globe size={13} /> Languages</div>
          {LANGUAGES.map((l) => {
            const hasScript = availableLangs.includes(l.id);
            const on = displayLangs.includes(l.id);
            const isPrimary = l.id === primaryLang;
            const disabled = !on && displayLangs.length >= 3;
            return (
              <div key={l.id}
                className={`ls-chip ${on ? "on" : ""} ${!hasScript ? "missing" : ""} ${disabled ? "disabled" : ""} ${isPrimary ? "primary" : ""}`}
                onClick={() => hasScript ? toggleDisplayLang(l.id) : generateForLang(l.id)}
                title={hasScript ? (disabled ? "Uncheck one first (max 3)" : "") : "Click to generate"}>
                {isPrimary && "★ "}{l.name}
                {!hasScript && !genLang && <span className="ls-gen">+</span>}
                {genLang === l.id && <span className="ls-gen"><span className="spinner dark" /> …</span>}
              </div>
            );
          })}
          <div className="ls-hint">Up to 3 side-by-side. Click + to generate.</div>
        </div>
        {genError && <div className="err">{genError}</div>}

        <div className={`cockpit ${multi ? "multi" : ""}`}>
          <div className="script-col">
            {/* Opening row */}
            <div className={`opening-row cols-${displayLangs.length}`}>
              {displayLangs.map((lid) => {
                const s = langScripts[lid];
                const lang = LANGUAGES.find((l) => l.id === lid);
                if (!s) return <div key={lid} className="script-head empty"><div className="lbl">{lang.name}</div><div className="opening" style={{ opacity: .6 }}>Loading…</div></div>;
                return (
                  <div key={lid} className="script-head">
                    <div className="lbl">
                      <span className="col-lang-tag">{lang.name}</span>
                      {lid === primaryLang && meta && (
                        <span className="meta-chips inline">
                          <span className="mchip">📍 {meta.region?.name}</span>
                          <span className="mchip">🎚 {meta.delivery?.name}{meta.simple ? " · simple" : ""}</span>
                          {meta.persona && meta.persona !== "General audience" && <span className="mchip">👤 {meta.persona}</span>}
                        </span>
                      )}
                    </div>
                    <div className="opening">
                      {editing ? (
                        <LimitedTextarea
                          className="finp"
                          value={editScript.opening || ""}
                          onChange={(e) => setEditScript({ ...editScript, opening: e.target.value })}
                          style={{ width: "100%", minHeight: 48, fontSize: 17, lineHeight: 1.4, fontFamily: "'Space Grotesk'" }}
                          maxLength={2000}
                        />
                      ) : (
                        <>"{s.opening}"</>
                      )}
                    </div>
                    {lid === primaryLang && (
                      <div className="tone-line">
                        <span className="tone-badge" style={{ background: TONE_COLOR[editing ? editScript.toneLevel : s.toneLevel] || "var(--assertive)" }}>
                          {editing ? (
                            <select
                              value={editScript.toneLevel || "Assertive"}
                              onChange={(e) => setEditScript({ ...editScript, toneLevel: e.target.value })}
                              style={{ background: "transparent", border: "none", color: "inherit", fontSize: "inherit", fontWeight: "inherit", cursor: "pointer" }}
                            >
                              {["Consultative", "Assertive", "Aggressive", "Methodical"].map((t) => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          ) : (
                            <>{s.toneLevel || method.tone} tone</>
                          )}
                        </span>
                        {editing ? (
                          <LimitedInput
                            className="finp"
                            value={editScript.toneGuidance || ""}
                            onChange={(e) => setEditScript({ ...editScript, toneGuidance: e.target.value })}
                            style={{ flex: 1, fontSize: 13, minWidth: 0 }}
                            maxLength={500}
                          />
                        ) : (
                          <span className="tone-guide">{s.toneGuidance}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="legend">
              <span className="lg"><span className="dotc say" /> Say this — speak aloud</span>
              <span className="lg"><span className="dotc instr" /> Coaching — for you only</span>
            </div>

            {/* Timer + stepper */}
            <div className="timeline-card">
              <div className="timer-row">
                <div className={`call-state ${callState}`}>
                  <StateIcon size={14} />
                  {stateMeta[callState].label}
                </div>
                <div className={`clock ${over ? "over" : ""}`}>{mm}:{ss}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {callState === "ready" && (
                    <button className="ps-btn pri sm" onClick={() => setRunning(true)}><Play size={14} /> Start call</button>
                  )}
                  {callState === "live" && (
                    <button className="ps-btn pri sm" style={{ background: "#B5720F", borderColor: "#B5720F" }} onClick={() => setRunning(false)}><Pause size={14} /> Pause</button>
                  )}
                  {callState === "paused" && (
                    <button className="ps-btn pri sm" onClick={() => setRunning(true)}><Play size={14} /> Resume</button>
                  )}
                  {elapsed > 0 && (
                    <button className="ps-btn ghost sm" onClick={() => { setRunning(false); setElapsed(0); }}><RotateCcw size={14} /> Reset</button>
                  )}
                </div>
                <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>{over ? "Over time" : `of ${duration}:00`}</div>
              </div>
              {/* Stepper */}
              <div className="stepper">
                {segments.map((s, i) => {
                  const done = elapsedMin >= s.end;
                  const active = i === curIdx && running;
                  const current = i === curIdx;
                  return (
                    <div key={i} className={`step ${done ? "done" : ""} ${active ? "active" : ""} ${current ? "current" : ""}`} onClick={() => toggleSeg(i)}>
                      <div className="step-num">{done ? "✓" : i + 1}</div>
                      <div className="step-label">{s.label}</div>
                      <div className="step-time">{s.start}–{s.end}m</div>
                    </div>
                  );
                })}
              </div>
              {running && (
                <div className="playhead-track">
                  <div className="playhead" style={{ left: `${playLeft}%` }} />
                </div>
              )}
            </div>

            {/* Segments */}
            {segments.map((_, i) => {
              const isOpen = open.has(i);
              const isActive = i === curIdx && running;
              const isCurrent = i === curIdx;
              return (
                <div key={i} className={`seg ${isActive ? "active" : ""} ${isCurrent ? "current" : ""}`}>
                  <div className="seg-top" onClick={() => toggleSeg(i)}>
                    <div className="seg-num">{i + 1}</div>
                    <div className="seg-label">{primaryScript.segments[i]?.label || `Phase ${i + 1}`}</div>
                    <div className="seg-time">{segments[i].start}–{segments[i].end} min</div>
                    <div className="seg-caret">{isOpen ? "▲" : "▼"}</div>
                  </div>
                  {isOpen && (
                    <div className={`seg-body-row cols-${displayLangs.length}`}>
                      {displayLangs.map((lid) => {
                        const sc = langScripts[lid];
                        const lang = LANGUAGES.find((l) => l.id === lid);
                        if (!sc) return <div key={lid} className="seg-col loading">Loading {lang.name}…</div>;
                        const seg = normalizeSegments(sc.segments, duration)[i] || { say: [], ask: [], do: [], goal: "", listenFor: [] };
                        return (
                          <div key={lid} className="seg-col">
                            {multi && <div className="seg-col-lang">{lang.name}</div>}
                            {editing && lid === primaryLang ? (
                              /* ========== EDIT MODE (primary lang only) ========== */
                              <>
                                {/* Segment label */}
                                <div style={{ marginBottom: 8 }}>
                                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 4, display: "block" }}>Segment label</label>
                                  <LimitedInput className="finp" value={editScript.segments[i]?.label || ""} onChange={(e) => {
                                    const segs = [...editScript.segments]; segs[i] = { ...segs[i], label: e.target.value }; setEditScript({ ...editScript, segments: segs });
                                  }} style={{ width: "100%", fontSize: 14 }} maxLength={200} />
                                </div>
                                {/* Goal */}
                                <div style={{ marginBottom: 8 }}>
                                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 4, display: "block" }}>Goal</label>
                                  <LimitedInput className="finp" value={editScript.segments[i]?.goal || ""} onChange={(e) => {
                                    const segs = [...editScript.segments]; segs[i] = { ...segs[i], goal: e.target.value }; setEditScript({ ...editScript, segments: segs });
                                  }} style={{ width: "100%", fontSize: 14 }} maxLength={500} />
                                </div>
                                {/* SAY THIS */}
                                <div className="say-block" style={{ marginBottom: 12 }}>
                                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <div className="say-head">Say this</div>
                                    <button className="edit-add-btn" onClick={() => {
                                      const segs = [...editScript.segments]; segs[i] = { ...segs[i], say: [...(segs[i].say || []), ""] }; setEditScript({ ...editScript, segments: segs });
                                    }}><Plus size={13} /> Add</button>
                                  </div>
                                  {(editScript.segments[i]?.say || []).map((t, j) => (
                                    <div key={j} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                                      <LimitedInput className="finp" value={t} onChange={(e) => {
                                        const segs = [...editScript.segments]; const say = [...segs[i].say]; say[j] = e.target.value; segs[i] = { ...segs[i], say }; setEditScript({ ...editScript, segments: segs });
                                      }} style={{ flex: 1, fontSize: 14 }} maxLength={2000} />
                                      <button className="edit-del-btn" onClick={() => {
                                        const segs = [...editScript.segments]; const say = segs[i].say.filter((_, k) => k !== j); segs[i] = { ...segs[i], say }; setEditScript({ ...editScript, segments: segs });
                                      }}><Trash2 size={14} /></button>
                                    </div>
                                  ))}
                                </div>
                                {/* ASK THIS */}
                                <div className="say-block" style={{ marginBottom: 12 }}>
                                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <div className="say-head ask">Ask this</div>
                                    <button className="edit-add-btn" onClick={() => {
                                      const segs = [...editScript.segments]; segs[i] = { ...segs[i], ask: [...(segs[i].ask || []), ""] }; setEditScript({ ...editScript, segments: segs });
                                    }}><Plus size={13} /> Add</button>
                                  </div>
                                  {(editScript.segments[i]?.ask || []).map((t, j) => (
                                    <div key={j} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                                      <LimitedInput className="finp" value={t} onChange={(e) => {
                                        const segs = [...editScript.segments]; const ask = [...segs[i].ask]; ask[j] = e.target.value; segs[i] = { ...segs[i], ask }; setEditScript({ ...editScript, segments: segs });
                                      }} style={{ flex: 1, fontSize: 14 }} maxLength={2000} />
                                      <button className="edit-del-btn" onClick={() => {
                                        const segs = [...editScript.segments]; const ask = segs[i].ask.filter((_, k) => k !== j); segs[i] = { ...segs[i], ask }; setEditScript({ ...editScript, segments: segs });
                                      }}><Trash2 size={14} /></button>
                                    </div>
                                  ))}
                                </div>
                                {/* COACHING */}
                                <div className="coach-block" style={{ marginBottom: 12 }}>
                                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <div className="coach-head">Coaching — don't say aloud</div>
                                    <button className="edit-add-btn" onClick={() => {
                                      const segs = [...editScript.segments]; segs[i] = { ...segs[i], do: [...(segs[i].do || []), ""] }; setEditScript({ ...editScript, segments: segs });
                                    }}><Plus size={13} /> Add</button>
                                  </div>
                                  {(editScript.segments[i]?.do || []).map((t, j) => (
                                    <div key={j} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                                      <LimitedInput className="finp" value={t} onChange={(e) => {
                                        const segs = [...editScript.segments]; const doArr = [...segs[i].do]; doArr[j] = e.target.value; segs[i] = { ...segs[i], do: doArr }; setEditScript({ ...editScript, segments: segs });
                                      }} style={{ flex: 1, fontSize: 13, fontStyle: "italic" }} maxLength={2000} />
                                      <button className="edit-del-btn" onClick={() => {
                                        const segs = [...editScript.segments]; const doArr = segs[i].do.filter((_, k) => k !== j); segs[i] = { ...segs[i], do: doArr }; setEditScript({ ...editScript, segments: segs });
                                      }}><Trash2 size={14} /></button>
                                    </div>
                                  ))}
                                </div>
                              </>
                            ) : (
                              /* ========== VIEW MODE ========== */
                              <>
                                {seg.goal && (
                                  <div className="seg-goal">
                                    <span className="coach-tag">Goal</span>{seg.goal}
                                  </div>
                                )}
                                {/* SAY THIS — dominant */}
                                {seg.say?.length > 0 && (
                                  <div className="say-block">
                                    <div className="say-head">Say this</div>
                                    {seg.say.map((t, j) => {
                                      const id = `say-${lid}-${i}-${j}`;
                                      return (
                                        <div key={id} className={`speak-item ${checks[id] ? "checked" : ""}`} onClick={() => toggleCheck(id)}>
                                          <div className={`ck ${checks[id] ? "on" : ""}`}>{checks[id] ? "✓" : ""}</div>
                                          <span>{t}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                                {seg.ask?.length > 0 && (
                                  <div className="say-block">
                                    <div className="say-head ask">Ask this</div>
                                    {seg.ask.map((t, j) => {
                                      const id = `ask-${lid}-${i}-${j}`;
                                      return (
                                        <div key={id} className={`speak-item q ${checks[id] ? "checked" : ""}`} onClick={() => toggleCheck(id)}>
                                          <div className={`ck ${checks[id] ? "on" : ""}`} onClick={(e) => { e.stopPropagation(); toggleCheck(id); }}>✓</div>
                                          <span className="qmark">Q</span><span>{t}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                                {/* LISTEN FOR */}
                                {seg.listenFor?.length > 0 && (
                                  <div className="listen-block">
                                    <div className="listen-head">Listen for</div>
                                    {seg.listenFor.map((t, j) => (
                                      <div key={`lf-${lid}-${i}-${j}`} className="listen-item">
                                        <span className="listen-dot" />{t}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {/* COACHING — secondary */}
                                {seg.do?.length > 0 && (
                                  <div className="coach-block">
                                    <div className="coach-head">Coaching — don't say aloud</div>
                                    {seg.do.map((t, j) => (
                                      <div key={`do-${lid}-${i}-${j}`} className="coach-note"><span className="coach-dot" />{t}</div>
                                    ))}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <ObjectionPanel objections={primaryScript.objections || []} editing={editing} editScript={editScript} setEditScript={setEditScript} />

          {/* Outcome tracking */}
          <div className="ps-card" style={{ marginTop: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>How did this call go?</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[{ id: "won", label: "Won", color: "#1A7F5B" }, { id: "lost", label: "Lost", color: "#B23237" }, { id: "no_deal", label: "No deal", color: "#6B7B93" }, { id: "pending", label: "Pending", color: "var(--accent)" }].map((o) => (
                    <button
                      key={o.id}
                      className={`ps-btn ${outcome === o.id ? "pri" : "ghost"}`}
                      style={outcome === o.id ? { background: o.color, borderColor: o.color, color: "#fff" } : {}}
                      onClick={() => saveOutcome(o.id)}
                      disabled={savingMeta}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <button className="ps-btn ghost" onClick={markUsed} disabled={savingMeta}>
                {usedAt ? `Used ${new Date(usedAt).toLocaleDateString()}` : "Mark as used"}
              </button>
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>Post-call notes</label>
              <LimitedTextarea
                className="finp"
                style={{ minHeight: 60, resize: "vertical", width: "100%" }}
                placeholder="What worked? What didn't? Any buyer objections you didn't expect?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => saveNotes(notes)}
                maxLength={5000}
              />
            </div>
          </div>

          {/* Script Comments */}
          <div className="ps-card" style={{ marginTop: 20 }}>
            <ScriptComments scriptId={script.id || 0} userEmail={user?.email || ""} />
          </div>
        </div>
      </div>

      {/* Regenerate modal */}
      {confirmRegen && (
        <div className="overlay" onClick={() => !regenerating && setConfirmRegen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Regenerate this script?</div>
            <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.55, marginBottom: 20 }}>
              This overwrites the saved script for <b>{method.name} · {callType.name} · {duration} min</b>. The current version will be replaced.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="ps-btn ghost" onClick={() => setConfirmRegen(false)} disabled={regenerating}>Keep current</button>
              <button className="ps-btn pri" onClick={onRegenerate} disabled={regenerating}>
                {regenerating ? <><span className="spinner" /> Regenerating…</> : "Regenerate & save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share modal */}
      {showShare && (
        <div className="overlay" onClick={() => setShowShare(false)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>🔗 Share Script</div>
            <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.55, marginBottom: 16 }}>
              Anyone with this link can view the script for 7 days. No login required.
            </p>
            {shareLoading && (
              <div className="loading-box" style={{ padding: 20 }}>
                <div className="ring" style={{ width: 24, height: 24 }} />
                <div className="msg" style={{ fontSize: 14 }}>Creating share link…</div>
              </div>
            )}
            {!shareLoading && shareUrl && (
              <>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <input className="finp" readOnly value={shareUrl} style={{ flex: 1, fontSize: 13, background: "#F6F8FB" }} onClick={(e) => e.target.select()} />
                  <button className="ps-btn pri" onClick={() => { navigator.clipboard.writeText(shareUrl); }}>Copy</button>
                </div>
                <div className="fhint" style={{ marginBottom: 0 }}>Link expires in 7 days.</div>
              </>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
              <button className="ps-btn ghost" onClick={() => setShowShare(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Print view */}
      {showPrint && (
        <div className="print-overlay" style={{ display: "none" }}>
          <PrintView product={product} method={method} callType={callType} duration={duration} script={script} meta={meta} />
        </div>
      )}
    </>
  );
}

function PrintView({ product, method, callType, duration, script, meta }) {
  const segs = normalizeSegments(script.segments, duration);
  return (
    <div style={{ padding: 40, fontFamily: "'Inter', system-ui, sans-serif", color: "#131A24", maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, marginBottom: 8 }}>{product.name}</h1>
      <p style={{ fontSize: 14, color: "#667180", marginBottom: 24 }}>{method.name} · {callType.name} · {duration} min · {meta.language?.name} · {meta.region?.name}</p>
      <h2 style={{ fontSize: 16, borderBottom: "2px solid #2B4CF0", paddingBottom: 6, marginBottom: 12 }}>Opening</h2>
      <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>{script.opening}</p>
      {segs.map((seg, i) => {
        const data = script.segments?.[i] || {};
        return (
          <div key={i} style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 15, background: "#EAEEFE", padding: "8px 12px", borderRadius: 8, marginBottom: 10 }}>
              Segment {i + 1}: {data.label || `Phase ${i + 1}`} ({seg.start}–{seg.end} min)
            </h3>
            {data.goal && <p style={{ fontSize: 13, fontStyle: "italic", color: "#667180", marginBottom: 10 }}>Goal: {data.goal}</p>}
            {data.say?.length > 0 && <><p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#0B7A5B", marginBottom: 6 }}>Say this</p><ul style={{ margin: "0 0 12px 0", paddingLeft: 20 }}>{data.say.map((s, j) => <li key={j} style={{ fontSize: 13.5, lineHeight: 1.55, marginBottom: 4 }}>{s}</li>)}</ul></>}
            {data.ask?.length > 0 && <><p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#2B4CF0", marginBottom: 6 }}>Ask this</p><ul style={{ margin: "0 0 12px 0", paddingLeft: 20 }}>{data.ask.map((a, j) => <li key={j} style={{ fontSize: 13.5, lineHeight: 1.55, marginBottom: 4 }}>{a}</li>)}</ul></>}
            {data.do?.length > 0 && <><p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9A5B08", marginBottom: 6 }}>Coaching — don't say aloud</p><ul style={{ margin: 0, paddingLeft: 20 }}>{data.do.map((d, j) => <li key={j} style={{ fontSize: 13, fontStyle: "italic", lineHeight: 1.55, marginBottom: 4, color: "#667180" }}>{d}</li>)}</ul></>}
          </div>
        );
      })}
      {script.objections?.length > 0 && <>
        <h2 style={{ fontSize: 16, borderBottom: "2px solid #B5720F", paddingBottom: 6, marginBottom: 12 }}>Objection Handling</h2>
        {script.objections.map((o, i) => (
          <div key={i} style={{ marginBottom: 14, borderLeft: "3px solid #F0D9A6", paddingLeft: 12 }}>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Objection: {o.objection}</p>
            <p style={{ fontSize: 13, lineHeight: 1.55 }}>Response: {o.response}</p>
          </div>
        ))}
      </>}
      <div style={{ marginTop: 40, paddingTop: 16, borderTop: "1px solid #D9E0E9", fontSize: 11, color: "#98A2B0", textAlign: "center" }}>
        Generated by Pitch Studio · {new Date().toLocaleDateString()}
      </div>
    </div>
  );
}

function ObjectionPanel({ objections, editing, editScript, setEditScript }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const filtered = objections.filter((o) => (o.objection + " " + o.response).toLowerCase().includes(q.toLowerCase()));
  const visible = showAll ? filtered : filtered.slice(0, 5);

  // Edit mode: show editScript.objections or regular objections
  const items = editing ? (editScript?.objections || []) : visible;

  return (
    <div className="obj-panel">
      <div className="obj-head">
        <div className="t">⚡ Objection handling</div>
        {!editing && <div className="s">Tap an objection to see how to respond, in this method's style.</div>}
        {!editing && <input className="obj-search" placeholder="Search objections…" value={q} onChange={(e) => setQ(e.target.value)} />}
      </div>
      {editing && (
        <button className="edit-add-btn" style={{ margin: "8px 16px" }} onClick={() => {
          setEditScript({ ...editScript, objections: [...(editScript.objections || []), { objection: "", response: "" }] });
        }}><Plus size={13} /> Add objection</button>
      )}
      <div className="obj-list">
        {!editing && filtered.length === 0 && <div style={{ padding: 20, color: "var(--faint)", fontSize: 13, textAlign: "center" }}>No matches.</div>}
        {items.map((o, i) => (
          <div key={i} className={`obj ${open === i ? "open" : ""}`}>
            {editing ? (
              <div style={{ padding: "12px 16px" }}>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 4, display: "block" }}>Objection</label>
                  <LimitedInput className="finp" value={o.objection || ""} onChange={(e) => {
                    const objs = [...editScript.objections]; objs[i] = { ...objs[i], objection: e.target.value }; setEditScript({ ...editScript, objections: objs });
                  }} style={{ width: "100%", fontSize: 13 }} maxLength={500} />
                </div>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 4, display: "block" }}>Response</label>
                  <LimitedTextarea className="finp" value={o.response || ""} onChange={(e) => {
                    const objs = [...editScript.objections]; objs[i] = { ...objs[i], response: e.target.value }; setEditScript({ ...editScript, objections: objs });
                  }} style={{ width: "100%", fontSize: 13, minHeight: 48, resize: "vertical" }} maxLength={2000} />
                </div>
                <button className="edit-del-btn" onClick={() => {
                  setEditScript({ ...editScript, objections: editScript.objections.filter((_, k) => k !== i) });
                }}><Trash2 size={14} style={{ marginRight: 4 }} /> Remove objection</button>
              </div>
            ) : (
              <>
                <div className="obj-q" onClick={() => setOpen(open === i ? null : i)}>
                  <span className="q">"</span><span style={{ flex: 1 }}>{o.objection}</span><span style={{ color: "var(--faint)" }}>{open === i ? "▲" : "▼"}</span>
                </div>
                {open === i && (
                  <div className="obj-a">
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 6 }}>Respond</div>
                      <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--ink)" }}>{o.response}</div>
                    </div>
                    {o.coaching && (
                      <div style={{ padding: 10, background: "var(--instr-bg)", borderLeft: "3px solid var(--instr-line)", borderRadius: "0 8px 8px 0", fontSize: 12.5, color: "var(--instr)", fontStyle: "italic" }}>
                        <b style={{ color: "var(--ink)", fontStyle: "normal" }}>Coaching:</b> {o.coaching}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
        {!editing && !showAll && filtered.length > 5 && (
          <button className="obj-more" onClick={() => setShowAll(true)}>
            View all {filtered.length} objections →
          </button>
        )}
      </div>
    </div>
  );
}
