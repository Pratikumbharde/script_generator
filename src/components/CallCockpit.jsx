import React, { useState, useEffect, useRef } from "react";
import { normalizeSegments, nameOf, matchObjection, parseCompetitors, parseDifferentiators } from "../utils/helpers.js";
import { METHODS, CALL_TYPES, LANGUAGES, TONE_COLOR } from "../data/constants.js";
import SentimentPanel from "./SentimentPanel.jsx";

/* ============================================================
   Real-Time Call Cockpit (P3.2) + AI Sales Copilot (P4)
   A compact, focused overlay view for use during live calls.
   Large text, prominent timer, segment navigation, pause detection.
   Now includes P4.1 Battle Cards and P4.2 Live Objection Detection.
   ============================================================ */

export default function CallCockpit({ product, method, callType, duration, script, meta, onExit }) {
  const segments = normalizeSegments(script.segments, duration);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [segIndex, setSegIndex] = useState(0);
  const [checks, setChecks] = useState({});
  const [paused, setPaused] = useState(false);
  const tick = useRef(null);
  const lastSpeechRef = useRef(Date.now());
  const [autoPaused, setAutoPaused] = useState(false);

  // P4.1 Battle Cards
  const [showBattleCards, setShowBattleCards] = useState(false);
  const competitors = parseCompetitors(product.competitors);
  const differentiators = parseDifferentiators(product.differentiators);

  // P4.2 Live Objection Detection
  const [prospectText, setProspectText] = useState("");
  const [matchedObjections, setMatchedObjections] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // timer tick
  useEffect(() => {
    if (running) {
      tick.current = setInterval(() => {
        setElapsed((e) => e + 1);
      }, 1000);
    }
    return () => clearInterval(tick.current);
  }, [running]);

  // derive current segment from elapsed time
  const elapsedMin = elapsed / 60;
  const activeIdx = segments.findIndex((s) => elapsedMin >= s.start && elapsedMin < s.end);
  const curIdx = activeIdx === -1 ? (elapsedMin >= duration ? segments.length - 1 : 0) : activeIdx;

  // sync segIndex with timer when running
  useEffect(() => {
    if (running) setSegIndex(curIdx);
  }, [curIdx, running]);

  // auto-pause detection: if no interaction for 30 seconds, suggest pause
  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => {
      const idle = Date.now() - lastSpeechRef.current;
      if (idle > 30000 && !autoPaused) {
        setAutoPaused(true);
      }
    }, 5000);
    return () => clearInterval(iv);
  }, [running, autoPaused]);

  const bumpInteraction = () => {
    lastSpeechRef.current = Date.now();
    setAutoPaused(false);
  };

  const toggleCheck = (id) => {
    setChecks((c) => ({ ...c, [id]: !c[id] }));
    bumpInteraction();
  };

  // P4.2: detect objections from typed text
  useEffect(() => {
    if (!prospectText.trim()) {
      setMatchedObjections([]);
      return;
    }
    const matches = matchObjection(prospectText, script.objections || []);
    setMatchedObjections(matches);
  }, [prospectText, script.objections]);

  // P4.2: Web Speech API for voice-to-text
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition is not supported in this browser");
      return;
    }
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = meta.language?.id === "en" ? "en-US" : (meta.language?.id || "en-US");
    rec.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join(" ");
      setProspectText((prev) => {
        const base = prev.trim();
        if (!base) return transcript;
        if (transcript.toLowerCase().startsWith(base.toLowerCase())) return transcript;
        return base + " " + transcript;
      });
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    recognitionRef.current = rec;
    rec.start();
    setIsListening(true);
    bumpInteraction();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  const over = elapsed > duration * 60;

  const seg = segments[segIndex] || {};
  const segData = script.segments?.[segIndex] || {};

  return (
    <div className="call-cockpit" onClick={bumpInteraction}>
      {/* Top bar */}
      <div className="call-top">
        <div className="call-timer-wrap">
          <div className={`call-timer ${over ? "over" : ""}`}>{mm}:{ss}</div>
          <div className="call-timer-label">{over ? "Over time" : `of ${duration}:00`} · {product.name}</div>
        </div>
        <div className="call-controls">
          <button className="call-btn" onClick={() => { setRunning((r) => !r); bumpInteraction(); }}>
            {running ? "❚❚ Pause" : "▶ Resume"}
          </button>
          <button className="call-btn ghost" onClick={() => setElapsed(0)}>↻ Reset</button>
          <button className={`call-btn ${showBattleCards ? "pri" : "ghost"}`} onClick={() => { setShowBattleCards((s) => !s); bumpInteraction(); }}>
            🛡 {showBattleCards ? "Hide" : "Battle"}
          </button>
          <button className="call-btn danger" onClick={onExit}>✕ Exit</button>
        </div>
      </div>

      {/* Auto-pause banner */}
      {autoPaused && running && (
        <div className="call-auto-pause">
          <span>⏸️ Call seems idle. Auto-paused. Tap to resume.</span>
          <button className="call-btn pri sm" onClick={() => { setAutoPaused(false); bumpInteraction(); }}>Resume</button>
        </div>
      )}

      <div className="call-copilot">
        {/* Main script content */}
        <div>
          {/* Segment timeline */}
          <div className="call-timeline">
            {segments.map((s, i) => (
              <div
                key={i}
                className={`call-tl-dot ${i === segIndex ? "active" : i < segIndex ? "done" : ""}`}
                onClick={() => { setSegIndex(i); bumpInteraction(); }}
                title={`${s.label} (${s.start}-${s.end} min)`}
              />
            ))}
          </div>

          {/* Segment nav */}
          <div className="call-seg-nav">
            <button className="call-btn ghost sm" disabled={segIndex === 0} onClick={() => { setSegIndex((i) => i - 1); bumpInteraction(); }}>← Prev</button>
            <div className="call-seg-title">
              <span className="call-seg-num">{segIndex + 1}</span>
              {segData.label || `Phase ${segIndex + 1}`}
              <span className="call-seg-time">{seg.start}–{seg.end} min</span>
            </div>
            <button className="call-btn ghost sm" disabled={segIndex >= segments.length - 1} onClick={() => { setSegIndex((i) => i + 1); bumpInteraction(); }}>Next →</button>
          </div>

          {/* Content area */}
          <div className="call-content">
            {segData.goal && (
              <div className="call-goal">
                <span className="call-goal-tag">Goal</span>
                {segData.goal}
              </div>
            )}

            {segData.say?.length > 0 && (
              <div className="call-section">
                <div className="call-section-label">Say this</div>
                {segData.say.map((t, j) => {
                  const id = `say-${segIndex}-${j}`;
                  return (
                    <div key={id} className={`call-line ${checks[id] ? "checked" : ""}`} onClick={() => toggleCheck(id)}>
                      <div className={`call-ck ${checks[id] ? "on" : ""}`}>{checks[id] ? "✓" : ""}</div>
                      <span>{t}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {segData.ask?.length > 0 && (
              <div className="call-section">
                <div className="call-section-label">Ask this</div>
                {segData.ask.map((t, j) => {
                  const id = `ask-${segIndex}-${j}`;
                  return (
                    <div key={id} className={`call-line q ${checks[id] ? "checked" : ""}`} onClick={() => toggleCheck(id)}>
                      <div className={`call-ck ${checks[id] ? "on" : ""}`}>{checks[id] ? "✓" : ""}</div>
                      <span className="call-qmark">Q</span>
                      <span>{t}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {segData.do?.length > 0 && (
              <div className="call-section coach">
                <div className="call-section-label">Coaching — don't say aloud</div>
                {segData.do.map((t, j) => (
                  <div key={`do-${segIndex}-${j}`} className="call-line coach">
                    <span className="call-dot">•</span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom info bar */}
          <div className="call-bottom">
            <span>{nameOf(METHODS, method.id)} · {nameOf(CALL_TYPES, callType.id)} · {meta.language?.name} · {meta.region?.name}</span>
            {meta.persona && meta.persona !== "General audience" && <span> · 👤 {meta.persona}</span>}
          </div>
        </div>

        {/* Right side: P4 AI Copilot panels */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* P4.2 Live Objection Detection */}
          <div className="obj-live">
            <div className="ol-h">🎙 Live Objection Detection</div>
            <textarea
              className="obj-live-input"
              placeholder="Type what the prospect just said, or use the mic..."
              value={prospectText}
              onChange={(e) => { setProspectText(e.target.value); bumpInteraction(); }}
            />
            <div style={{ display: "flex", alignItems: "center", marginTop: 6 }}>
              <button
                className={`obj-mic ${isListening ? "on" : ""}`}
                onClick={() => { isListening ? stopListening() : startListening(); }}
              >
                {isListening ? "⏹ Stop" : "🎤 Transcribe"}
              </button>
              <span style={{ fontSize: 12, color: "#64748B", marginLeft: "auto" }}>
                {matchedObjections.length > 0 ? `${matchedObjections.length} match${matchedObjections.length > 1 ? "es" : ""}` : "No objection detected"}
              </span>
            </div>

            {matchedObjections.slice(0, 2).map((o, i) => (
              <div key={i} className="obj-alert">
                <div className="oa-title">⚡ Detected: {o.objection}</div>
                <div className="oa-body">🗣 {o.response}</div>
                <div className="oa-score">Match confidence: {Math.round(o.score * 100)}%</div>
              </div>
            ))}
          </div>

          {/* P7.2 Live Sentiment Analysis */}
          <SentimentPanel transcript={prospectText} />

          {/* P4.1 Battle Cards */}
          {showBattleCards && (
            <div className="battle-panel">
              <div className="bp-h">🛡 Battle Cards</div>

              {competitors.length > 0 && (
                <>
                  <div className="battle-card">
                    <span className="bc-tag">Competitors</span>
                    {competitors.map((c, i) => (
                      <div key={i} className="bc-title">🏴 {c}</div>
                    ))}
                  </div>
                  {differentiators.length > 0 && (
                    <div className="battle-card">
                      <span className="bc-tag">Our Edge</span>
                      {differentiators.map((d, i) => (
                        <div key={i} style={{ marginBottom: 8 }}>
                          <div className="bc-title">{d.title}</div>
                          {d.body && <div className="bc-body">{d.body}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                  {product.proofPoints && (
                    <div className="battle-card">
                      <span className="bc-tag">Proof</span>
                      <div className="bc-body">{product.proofPoints}</div>
                    </div>
                  )}
                </>
              )}

              {competitors.length === 0 && (
                <div className="battle-card">
                  <div className="bc-body">Add competitors and differentiators to the product to see battle cards here.</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
