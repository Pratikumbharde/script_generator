import React, { useState, useEffect } from "react";
import { listFeedback, getWinningPatterns, createFeedback } from "../api/client.js";

function StatCard({ label, value, sub }) {
  return (
    <div className="ai-stat">
      <div className="val">{value}</div>
      <div className="lbl">{label}</div>
      {sub && <div className="lbl" style={{ fontSize: 11, marginTop: 4, color: "var(--faint)" }}>{sub}</div>}
    </div>
  );
}

export default function SelfImprovingAI() {
  const [tab, setTab] = useState("analytics"); // analytics | patterns | ab
  const [feedback, setFeedback] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading] = useState(true);

  // A/B test state
  const [abMethod, setAbMethod] = useState("consultative");
  const [abCallType, setAbCallType] = useState("discovery");
  const [abVariantA, setAbVariantA] = useState("default");
  const [abVariantB, setAbVariantB] = useState("v2-aggressive-open");
  const [abNotesA, setAbNotesA] = useState("");
  const [abNotesB, setAbNotesB] = useState("");
  const [abSaving, setAbSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [fb, pt] = await Promise.all([listFeedback(), getWinningPatterns()]);
      setFeedback(fb || []);
      setPatterns(pt || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const total = feedback.length;
  const wins = feedback.filter((f) => f.outcome === "won").length;
  const avgRating = total
    ? (feedback.reduce((s, f) => s + (f.rating || 0), 0) / total).toFixed(1)
    : "—";
  const winRate = total ? Math.round((wins / total) * 100) : 0;

  async function saveABTest() {
    setAbSaving(true);
    try {
      await Promise.all([
        createFeedback({ method: abMethod, call_type: abCallType, variant: abVariantA, notes: abNotesA }),
        createFeedback({ method: abMethod, call_type: abCallType, variant: abVariantB, notes: abNotesB }),
      ]);
      setAbNotesA("");
      setAbNotesB("");
      await loadData();
      setTab("patterns");
    } catch (e) {
      console.error(e);
    } finally {
      setAbSaving(false);
    }
  }

  const methods = ["consultative", "assertive", "aggressive", "methodical"];
  const callTypes = ["discovery", "demo", "cold", "warm", "close"];

  return (
    <div>
      <div className="ps-top">
        <div>
          <div className="ps-eyebrow">P3.5</div>
          <div className="ps-title">Self-Improving AI</div>
          <div className="ps-sub">Log outcomes, discover winning patterns, and run A/B tests on prompts.</div>
        </div>
      </div>

      <div className="ps-body">
        {loading && (
          <div className="loading-box">
            <div className="ring" />
            <div className="msg">Loading analytics…</div>
          </div>
        )}

        {!loading && (
          <div className="ai-dashboard">
            {/* stat row */}
            <div className="ai-stat-grid">
              <StatCard label="Total outcomes logged" value={total} />
              <StatCard label="Wins" value={wins} sub={`${winRate}% win rate`} />
              <StatCard label="Avg rating" value={avgRating} />
              <StatCard label="Patterns found" value={patterns.length} />
            </div>

            {/* tabs */}
            <div className="tr-tabs">
              <div className={`tr-tab ${tab === "analytics" ? "on" : ""}`} onClick={() => setTab("analytics")}>Outcome Log</div>
              <div className={`tr-tab ${tab === "patterns" ? "on" : ""}`} onClick={() => setTab("patterns")}>Winning Patterns</div>
              <div className={`tr-tab ${tab === "ab" ? "on" : ""}`} onClick={() => setTab("ab")}>A/B Test</div>
            </div>

            {/* Outcome Log */}
            {tab === "analytics" && (
              <div className="ai-section">
                <div className="ai-section-h">📋 Recent Outcomes</div>
                {feedback.length === 0 && (
                  <div className="ps-empty">
                    <div className="big">No feedback yet</div>
                    <p>Record outcomes from scripts using the A/B Test tab or mark results in your CRM.</p>
                  </div>
                )}
                {feedback.length > 0 && (
                  <div className="lib-list">
                    {feedback.map((f) => (
                      <div key={f.id} className="lib-row" style={{ padding: "12px 16px" }}>
                        <div className="lib-main">
                          <div className="lib-prod" style={{ fontSize: 14, marginBottom: 4 }}>
                            {f.method} · {f.call_type} · <span style={{ color: "var(--accent)" }}>{f.variant || "default"}</span>
                          </div>
                          <div className="lib-chips" style={{ marginTop: 4 }}>
                            {f.outcome && (
                              <span className="chip" style={{
                                background: f.outcome === "won" ? "#E6F6EF" : f.outcome === "lost" ? "#FDF2F2" : "#F2F5FA",
                                color: f.outcome === "won" ? "var(--ok)" : f.outcome === "lost" ? "var(--aggressive)" : "var(--muted)",
                              }}>
                                {f.outcome}
                              </span>
                            )}
                            {f.rating && <span className="chip">★ {f.rating}/5</span>}
                            {f.notes && <span className="chip" style={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.notes}</span>}
                          </div>
                        </div>
                        <div className="lib-actions" style={{ fontSize: 12, color: "var(--faint)" }}>
                          {new Date(f.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Winning Patterns */}
            {tab === "patterns" && (
              <div className="ai-section">
                <div className="ai-section-h">🏆 Winning Patterns</div>
                {patterns.length === 0 && (
                  <div className="ps-empty">
                    <div className="big">Not enough data</div>
                    <p>Log at least a few outcomes with different variants to see which combinations perform best.</p>
                  </div>
                )}
                <div className="ai-patterns">
                  {patterns.map((p, i) => {
                    const totalCount = p.count || 0;
                    const wins = p.wins || 0;
                    const rate = totalCount ? Math.round((wins / totalCount) * 100) : 0;
                    return (
                      <div key={i} className="ai-row">
                        <div className="method">{p.method} · {p.call_type}</div>
                        <span className="chip n">{p.variant || "default"}</span>
                        <div className="bar"><div className="bar-inner" style={{ width: `${rate}%` }} /></div>
                        <div className="rate">{rate}%</div>
                        <span className="badge">{wins}/{totalCount}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* A/B Test */}
            {tab === "ab" && (
              <div className="ai-section">
                <div className="ai-section-h">🧪 A/B Prompt Variant</div>
                <p className="tr-intro">Set up two variants for the same method + call type. After running them in calls, come back and log the outcomes.</p>

                <div className="frow two" style={{ maxWidth: 500, marginBottom: 18 }}>
                  <div>
                    <label className="flab">Method</label>
                    <select className="fsel" value={abMethod} onChange={(e) => setAbMethod(e.target.value)}>
                      {methods.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="flab">Call type</label>
                    <select className="fsel" value={abCallType} onChange={(e) => setAbCallType(e.target.value)}>
                      {callTypes.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="ai-ab">
                  <div className={`ai-variant ${abVariantA === "default" ? "on" : ""}`}>
                    <div className="vname">Variant A</div>
                    <div className="vmeta">
                      <input className="finp" value={abVariantA} onChange={(e) => setAbVariantA(e.target.value)} placeholder="Variant name (e.g. default)" />
                    </div>
                    <textarea className="ftext" value={abNotesA} onChange={(e) => setAbNotesA(e.target.value)} placeholder="Notes: what changed in the prompt?" style={{ minHeight: 100 }} />
                  </div>
                  <div className={`ai-variant ${abVariantB !== "default" ? "on" : ""}`}>
                    <div className="vname">Variant B</div>
                    <div className="vmeta">
                      <input className="finp" value={abVariantB} onChange={(e) => setAbVariantB(e.target.value)} placeholder="Variant name (e.g. v2-aggressive-open)" />
                    </div>
                    <textarea className="ftext" value={abNotesB} onChange={(e) => setAbNotesB(e.target.value)} placeholder="Notes: what changed in the prompt?" style={{ minHeight: 100 }} />
                  </div>
                </div>

                <div className="genbar" style={{ marginTop: 18 }}>
                  <button className="ps-btn pri" onClick={saveABTest} disabled={abSaving || !abVariantA || !abVariantB}>
                    {abSaving ? <span className="spinner dark" style={{ width: 14, height: 14 }} /> : "💾 Save A/B Variants"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
