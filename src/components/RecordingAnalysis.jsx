import React, { useState, useEffect, useRef } from "react";
import { AudioWaveform } from "lucide-react";
import { S, nameOf, parseScriptKey, callModel } from "../utils/helpers.js";
import { METHODS, CALL_TYPES, LANGUAGES } from "../data/constants.js";
import { RowSkeleton } from "./shared/Skeletons.jsx";
import LimitedInput from './shared/LimitedInput.jsx'
import LimitedTextarea from './shared/LimitedTextarea.jsx'

/* ============================================================
   Call Recording Analysis (P3.3)
   Upload or describe a call recording. AI scores script
   adherence, identifies missed opportunities, and suggests
   improvements — using the saved script as the benchmark.
   ============================================================ */

export default function RecordingAnalysis({ products }) {
  const [scripts, setScripts] = useState(null);
  const [selectedScript, setSelectedScript] = useState(null);
  const [recordingUrl, setRecordingUrl] = useState("");
  const [callNotes, setCallNotes] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);

  useEffect(() => { loadScripts(); }, []);

  const loadScripts = async () => {
    const keys = await S.listKeys("pscript:");
    const out = [];
    for (const k of keys) {
      const rec = await S.get(k);
      if (!rec || !rec.data) continue;
      const meta = rec.meta || parseScriptKey(k);
      out.push({ key: k, savedAt: rec.savedAt || 0, meta, data: rec.data, productName: meta.productName || "Unknown" });
    }
    out.sort((a, b) => b.savedAt - a.savedAt);
    setScripts(out);
  };

  const analyze = async () => {
    if (!selectedScript || (!recordingUrl.trim() && !callNotes.trim())) return;
    setAnalyzing(true);
    setError("");
    try {
      const script = selectedScript.data;
      const segments = script.segments || [];
      const opening = script.opening || "";
      const objections = script.objections || [];
      const segText = segments.map((s, i) =>
        `Segment ${i + 1} (${s.label}): ${(s.say || []).join(" ")}`
      ).join("\n");

      const SYS = `You are an elite sales coach reviewing a call recording against the planned script.
Score on these dimensions (0-100):
- Adherence: Did the rep follow the script structure and key lines?
- Coverage: Did they hit all segments and objectives?
- Objection handling: Did they handle pushbacks smoothly?
- Missed opportunities: What did they leave on the table?
Return ONLY JSON:
{"adherence":0-100,"coverage":0-100,"objectionHandling":0-100,"missedOpportunities":"paragraph","strengths":"paragraph","improvements":"paragraph","overallFeedback":"paragraph"}`;

      const prompt = `Product: ${selectedScript.productName}
Method: ${nameOf(METHODS, selectedScript.meta.method)}
Call type: ${nameOf(CALL_TYPES, selectedScript.meta.callType)}
Duration: ${selectedScript.meta.duration} min

Planned script opening: "${opening}"
Planned segments:\n${segText}

Rep's call notes/recording summary:\n${callNotes.trim() || "See recording: " + recordingUrl.trim()}

Analyze the call against the script.`;

      const ai = await callModel(SYS, prompt);
      const text = ai.message?.content || ai.content || "";
      let parsed = {};
      try {
        const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const jsonStart = clean.indexOf('{');
        parsed = JSON.parse(clean.slice(jsonStart >= 0 ? jsonStart : 0));
      } catch (_) {
        parsed = { adherence: 0, coverage: 0, objectionHandling: 0, missedOpportunities: text.slice(0, 500), strengths: "", improvements: "", overallFeedback: "" };
      }

      const entry = {
        id: Date.now(),
        product: selectedScript.productName,
        scores: {
          adherence: Math.min(100, Math.max(0, parsed.adherence || 0)),
          coverage: Math.min(100, Math.max(0, parsed.coverage || 0)),
          objectionHandling: Math.min(100, Math.max(0, parsed.objectionHandling || 0)),
        },
        missedOpportunities: parsed.missedOpportunities || "",
        strengths: parsed.strengths || "",
        improvements: parsed.improvements || "",
        overallFeedback: parsed.overallFeedback || "",
        createdAt: Date.now(),
      };
      setResult(entry);
      setHistory((h) => [entry, ...h].slice(0, 30));
    } catch (e) {
      setError("Analysis failed: " + (e.message || "try again"));
    } finally {
      setAnalyzing(false);
    }
  };

  const avgScore = (scores) => Math.round((scores.adherence + scores.coverage + scores.objectionHandling) / 3);
  const scoreColor = (s) => s >= 80 ? "#1A7F5B" : s >= 60 ? "#B5720F" : "#B23237";

  if (scripts === null) return (
    <>
      <div className="ps-top"><div><div className="ps-eyebrow">Analysis</div><div className="ps-title"><AudioWaveform size={22} style={{ marginRight: 8, verticalAlign: "-3px" }} />Call Recording Analysis</div></div></div>
      <div className="ps-body"><RowSkeleton count={5} /></div>
    </>
  );

  return (
    <>
      <div className="ps-top">
        <div>
          <div className="ps-eyebrow">Analysis</div>
          <div className="ps-title"><AudioWaveform size={22} style={{ marginRight: 8, verticalAlign: "-3px" }} />Call Recording Analysis</div>
          <div className="ps-sub">Upload or describe a call. AI compares it against the saved script and scores adherence, coverage, and missed opportunities.</div>
        </div>
      </div>
      <div className="ps-body">
        {!selectedScript ? (
          <>
            {scripts.length === 0 ? (
              <div className="ps-empty">
                <div className="big">No scripts yet</div>
                <p>Generate a script in the Call Studio first, then come back to analyze recordings against it.</p>
              </div>
            ) : (
              <div className="ps-grid" style={{ marginBottom: 24 }}>
                {scripts.map((s) => (
                  <div key={s.key} className="pcard" onClick={() => setSelectedScript(s)}>
                    <div className="cat">{s.productName}</div>
                    <div className="nm">{nameOf(METHODS, s.meta.method)} · {nameOf(CALL_TYPES, s.meta.callType)} · {s.meta.duration}m</div>
                    <div className="ln">🗣 {nameOf(LANGUAGES, s.meta.language)} · {s.data?.opening?.slice(0, 80) || ""}…</div>
                    <div className="foot"><span>Click to analyze →</span></div>
                  </div>
                ))}
              </div>
            )}

            {history.length > 0 && (
              <div className="ps-card">
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Recent analyses</div>
                <div className="practice-history">
                  {history.slice(0, 8).map((h) => (
                    <div key={h.id} className="ph-row">
                      <div className="ph-info">
                        <div className="ph-prod">{h.product}</div>
                        <div className="ph-line">{h.overallFeedback.slice(0, 120)}…</div>
                      </div>
                      <div className="ph-score" style={{ color: scoreColor(avgScore(h.scores)) }}>{avgScore(h.scores)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="ps-form" style={{ maxWidth: 720 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <button className="ps-btn ghost sm" onClick={() => { setSelectedScript(null); setResult(null); }}>← Back</button>
              <span className="chip n">{selectedScript.productName}</span>
              <span className="chip">{nameOf(METHODS, selectedScript.meta.method)} · {nameOf(CALL_TYPES, selectedScript.meta.callType)}</span>
            </div>

            {!result && (
              <>
                <div className="frow">
                  <label className="flab">Recording link <span className="opt">(optional)</span></label>
                  <LimitedInput className="finp" maxLength={500} placeholder="https://your-crm.com/call-recording/…" value={recordingUrl} onChange={(e) => setRecordingUrl(e.target.value)} />
                  <div className="fhint">Paste a link to the recording, or just describe the call below.</div>
                </div>
                <div className="frow">
                  <label className="flab">Call notes / transcript <span className="opt">(paste what you remember, or the transcript)</span></label>
                  <LimitedTextarea className="ftext" maxLength={10000} placeholder="What was said? What objections came up? Did the rep follow the script?" value={callNotes} onChange={(e) => setCallNotes(e.target.value)} />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="ps-btn pri" disabled={(!recordingUrl.trim() && !callNotes.trim()) || analyzing} onClick={analyze}>
                    {analyzing ? <><span className="spinner" /> Analyzing…</> : "Analyze call"}
                  </button>
                  <button className="ps-btn ghost" onClick={() => { setSelectedScript(null); setResult(null); }}>Cancel</button>
                </div>
                {error && <div className="err" style={{ marginTop: 12 }}>{error}</div>}
              </>
            )}

            {result && (
              <>
                <div className="practice-scores" style={{ marginBottom: 18 }}>
                  {[
                    { label: "Adherence", value: result.scores.adherence },
                    { label: "Coverage", value: result.scores.coverage },
                    { label: "Objections", value: result.scores.objectionHandling },
                  ].map((s) => (
                    <div key={s.label} className="practice-score">
                      <div className="ps-label">{s.label}</div>
                      <div className="ps-bar-wrap"><div className="ps-bar" style={{ width: `${s.value}%`, background: scoreColor(s.value) }} /></div>
                      <div className="ps-val" style={{ color: scoreColor(s.value) }}>{s.value}</div>
                    </div>
                  ))}
                  <div className="practice-total">
                    <div className="ps-label">Overall</div>
                    <div className="ps-total-val" style={{ color: scoreColor(avgScore(result.scores)) }}>{avgScore(result.scores)}</div>
                  </div>
                </div>

                {result.strengths && (
                  <div style={{ background: "#EDF9F2", border: "1px solid #B9E1CA", borderRadius: 10, padding: 14, marginBottom: 12, fontSize: 13.5, lineHeight: 1.55 }}>
                    <b style={{ color: "#1A7F5B" }}>✓ Strengths:</b> {result.strengths}
                  </div>
                )}
                {result.missedOpportunities && (
                  <div style={{ background: "#FDF2F2", border: "1px solid #F0C9CA", borderRadius: 10, padding: 14, marginBottom: 12, fontSize: 13.5, lineHeight: 1.55 }}>
                    <b style={{ color: "#B23237" }}>⚠ Missed opportunities:</b> {result.missedOpportunities}
                  </div>
                )}
                {result.improvements && (
                  <div style={{ background: "#FBF1DE", border: "1px solid #F0D9A6", borderRadius: 10, padding: 14, marginBottom: 12, fontSize: 13.5, lineHeight: 1.55 }}>
                    <b style={{ color: "#9A5B08" }}>↗ Improvements:</b> {result.improvements}
                  </div>
                )}
                {result.overallFeedback && (
                  <div style={{ background: "#F2F5FA", borderRadius: 10, padding: 14, fontSize: 13.5, lineHeight: 1.55, color: "var(--muted)" }}>
                    <b style={{ color: "var(--ink)" }}>Overall feedback:</b> {result.overallFeedback}
                  </div>
                )}

                <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                  <button className="ps-btn pri" onClick={() => { setResult(null); setCallNotes(""); setRecordingUrl(""); }}>↻ Analyze another</button>
                  <button className="ps-btn ghost" onClick={() => { setSelectedScript(null); setResult(null); }}>Back to scripts</button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
