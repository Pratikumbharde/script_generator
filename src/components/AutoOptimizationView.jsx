import React, { useEffect, useState } from "react";
import {
  getAutoOptimizationOverview,
  listAutoOptimizations,
  generateAutoOptimization,
  applyAutoOptimization,
  deleteAutoOptimization,
  listScripts,
} from "../api/client.js";
import {
  TrendingUp,
  Phone,
  FileText,
  Trophy,
  AlertTriangle,
  Zap,
  Play,
  CheckCircle2,
  X,
  Clock,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  RotateCcw,
  Eye,
  Pencil,
  Trash2,
  GitBranch,
  Target,
  Lightbulb,
  BarChart3,
} from "lucide-react";

/* ============================================================
   AI Script Optimization — Closed-loop learning engine
   Calls → Data → Insights → Recommendations → Approved Changes
   ============================================================ */

const IMPACT_META = {
  high: { label: "High Impact", color: "#B23237", bg: "#FDF2F2", border: "#F0C9CA", icon: Target },
  medium: { label: "Medium Impact", color: "#B5720F", bg: "#FBF1DE", border: "#F0D9A6", icon: Lightbulb },
  low: { label: "Low Impact", color: "#1A7F5B", bg: "#EDF9F2", border: "#D0E9DE", icon: CheckCircle2 },
};

const SCRIPT_STATUS = {
  improving: { label: "Improving", icon: ArrowUpRight, color: "#1A7F5B" },
  stable: { label: "Stable", icon: Minus, color: "#667180" },
  attention: { label: "Needs attention", icon: ArrowDownRight, color: "#B23237" },
};

function formatDate(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function timeAgo(ts) {
  if (!ts) return "Never";
  const diff = Date.now() - new Date(ts).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return formatDate(ts);
}

export default function AutoOptimizationView({ scripts: scriptsProp = [] }) {
  const [scripts, setScripts] = useState(scriptsProp);
  const [overview, setOverview] = useState(null);
  const [opts, setOpts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [scriptId, setScriptId] = useState("");
  const [autoAnalyze, setAutoAnalyze] = useState(() => {
    try { return localStorage.getItem("ps_auto_analyze") === "true"; } catch { return false; }
  });
  const [expandedRec, setExpandedRec] = useState(null);
  const [historyFilter, setHistoryFilter] = useState("all");

  useEffect(() => {
    if (scriptsProp.length > 0) return;
    listScripts().then((s) => setScripts(s || [])).catch(() => {});
  }, [scriptsProp]);

  async function loadAll() {
    setLoading(true);
    try {
      const [ov, rows] = await Promise.all([
        getAutoOptimizationOverview().catch(() => null),
        listAutoOptimizations().catch(() => []),
      ]);
      setOverview(ov);
      setOpts(rows || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  async function handleGenerate() {
    if (!scriptId) return;
    setGenerating(true);
    try {
      await generateAutoOptimization({ script_id: scriptId });
      await loadAll();
    } catch (e) {
      console.error("Analysis failed:", e);
    } finally {
      setGenerating(false);
    }
  }

  async function handleApply(id) {
    try {
      await applyAutoOptimization(id);
      await loadAll();
    } catch (e) {
      console.error("Apply failed:", e);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this recommendation?")) return;
    try {
      await deleteAutoOptimization(id);
      await loadAll();
    } catch (e) {
      console.error(e);
    }
  }

  const toggleAutoAnalyze = () => {
    const next = !autoAnalyze;
    setAutoAnalyze(next);
    try { localStorage.setItem("ps_auto_analyze", String(next)); } catch {}
  };

  /* ── Derived data ── */
  const pendingOpts = opts.filter((o) => !o.applied);
  const appliedOpts = opts.filter((o) => o.applied);
  const highImpact = pendingOpts.filter((o) => o.impact_level === "high");
  const medImpact = pendingOpts.filter((o) => o.impact_level === "medium");
  const lowImpact = pendingOpts.filter((o) => o.impact_level === "low");

  const filteredHistory = historyFilter === "all"
    ? opts
    : historyFilter === "applied"
    ? appliedOpts
    : pendingOpts;

  /* ── Script performance mock (derived from real data where possible) ── */
  const scriptPerformance = scripts.slice(0, 5).map((s) => {
    const relatedOpts = opts.filter((o) => String(o.script_id) === String(s.id));
    const lastApplied = relatedOpts.find((o) => o.applied);
    const wins = relatedOpts.reduce((a, o) => a + (o.win_count || 0), 0);
    const losses = relatedOpts.reduce((a, o) => a + (o.loss_count || 0), 0);
    const total = wins + losses;
    const rate = total > 0 ? Math.round((wins / total) * 100) : 0;
    let status = "stable";
    if (rate >= 60) status = "improving";
    else if (rate < 40) status = "attention";
    return {
      id: s.id,
      name: `${s.method || "Script"} · ${s.call_type || ""}`,
      version: lastApplied?.script_version || "v1.0",
      status,
      winRate: rate,
      totalCalls: total,
      lastChanged: lastApplied?.created_at,
    };
  });

  /* ── Render ── */
  return (
    <div className="ps-container">
      {/* Header */}
      <div className="ps-top" style={{ marginBottom: 24 }}>
        <div>
          <div className="ps-eyebrow">Optimize</div>
          <div className="ps-title"><TrendingUp size={22} style={{ marginRight: 8, verticalAlign: "-3px" }} />AI Optimization</div>
          <div className="ps-sub">Automatically optimize your scripts based on call outcomes and AI feedback.</div>
        </div>
      </div>

      {/* ── Optimization Overview ── */}
      <div className="ps-card" style={{ marginBottom: 24, padding: "22px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 18 }}>
          <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
            <BarChart3 size={17} /> Optimization Overview
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <button className="ps-btn pri" onClick={handleGenerate} disabled={generating || !scriptId}>
              {generating ? (
                <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2, marginRight: 8 }} />Analyzing…</>
              ) : (
                <><Play size={16} /> Run Analysis</>
              )}
            </button>
            <select className="fsel" value={scriptId} onChange={(e) => setScriptId(e.target.value)} style={{ minWidth: 200 }}>
              <option value="">Select script to analyze</option>
              {scripts.map((s) => (
                <option key={s.id} value={s.id}>{s.method || "Script"} · {s.call_type || ""}</option>
              ))}
            </select>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--muted)", cursor: "pointer", userSelect: "none" }}>
              <input type="checkbox" checked={autoAnalyze} onChange={toggleAutoAnalyze} style={{ accentColor: "var(--accent)", width: 16, height: 16 }} />
              Auto-analyze weekly
            </label>
          </div>
        </div>

        {loading ? (
          <div className="loading-box" style={{ padding: 24 }}><div className="ring" /><div className="msg">Loading optimization data…</div></div>
        ) : (
          <div className="ci-kpi-bar" style={{ marginBottom: 0 }}>
            {[
              { label: "Calls analyzed", value: overview?.total_calls_analyzed || 0, sub: "With outcomes", icon: Phone },
              { label: "Scripts monitored", value: overview?.scripts_monitored || 0, sub: "Under optimization", icon: FileText },
              { label: "Wins tracked", value: overview?.wins || 0, sub: "Converted calls", icon: Trophy },
              { label: "Pending recommendations", value: overview?.pending_recommendations || 0, sub: "Awaiting review", icon: AlertTriangle },
            ].map((k) => (
              <div key={k.label} className="ci-kpi">
                <div className="ci-icon"><k.icon size={20} /></div>
                <div className="ci-body">
                  <div className="ci-kpi-label">{k.label}</div>
                  <div className="ci-kpi-value">{k.value}</div>
                  <div className="ci-kpi-sublabel">{k.sub}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && (
          <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap", fontSize: 13, color: "var(--muted)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Clock size={14} /> Last analyzed: <b style={{ color: "var(--ink)" }}>{timeAgo(overview?.last_analyzed_at)}</b>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <CheckCircle2 size={14} /> Last improvement: <b style={{ color: "var(--ink)" }}>{timeAgo(overview?.last_improvement_at)}</b>
            </div>
          </div>
        )}
      </div>

      {/* ── AI Recommendations ── */}
      {pendingOpts.length > 0 && (
        <div className="ps-card" style={{ marginBottom: 24, padding: "22px 24px" }}>
          <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 15, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <Zap size={17} /> AI Recommendations
            <span className="chip n" style={{ fontSize: 11 }}>{pendingOpts.length} found</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* High impact first */}
            {[...highImpact, ...medImpact, ...lowImpact].map((opt) => {
              const meta = IMPACT_META[opt.impact_level] || IMPACT_META.medium;
              const EvidenceIcon = meta.icon;
              const isOpen = expandedRec === opt.id;
              let evidence = {};
              try { evidence = JSON.parse(opt.evidence_json || "{}"); } catch {}

              return (
                <div key={opt.id} style={{ border: `1.5px solid ${meta.border}`, borderRadius: 12, background: meta.bg, overflow: "hidden" }}>
                  {/* Header */}
                  <div
                    style={{ padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}
                    onClick={() => setExpandedRec(isOpen ? null : opt.id)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", color: meta.color, background: "#fff", border: `1px solid ${meta.border}`, borderRadius: 8, padding: "3px 10px" }}>
                        <EvidenceIcon size={13} /> {meta.label}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.4 }}>{opt.suggestion}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      {opt.measured_uplift && (
                        <span style={{ fontSize: 12, fontWeight: 700, color: meta.color }}>{opt.measured_uplift}</span>
                      )}
                      <ChevronRight size={16} style={{ transform: isOpen ? "rotate(90deg)" : "", transition: ".15s", color: "var(--faint)" }} />
                    </div>
                  </div>

                  {/* Expanded body */}
                  {isOpen && (
                    <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${meta.border}` }}>
                      {/* Current vs Recommended */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14, marginTop: 14 }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 6 }}>Current</div>
                          <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.6, background: "#fff", borderRadius: 10, padding: "12px 14px", border: "1px solid var(--line-soft)" }}>
                            &ldquo;{opt.current_text || "No current text recorded"}&rdquo;
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: meta.color, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 6 }}>AI Recommended</div>
                          <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.6, background: "#fff", borderRadius: 10, padding: "12px 14px", border: `1.5px solid ${meta.color}` }}>
                            &ldquo;{opt.recommended_text || "No recommendation recorded"}&rdquo;
                          </div>
                        </div>
                      </div>

                      {/* Why */}
                      {opt.why && (
                        <div style={{ marginTop: 14, background: "#fff", borderRadius: 10, padding: "12px 14px", border: "1px solid var(--line-soft)" }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-ink)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 6 }}>Why AI recommends this</div>
                          <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>{opt.why}</div>
                        </div>
                      )}

                      {/* Evidence */}
                      <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                        <div style={{ fontSize: 13, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6 }}>
                          <Trophy size={14} style={{ color: "#1A7F5B" }} />
                          {evidence.wins || opt.win_count || 0} winning calls
                        </div>
                        <div style={{ fontSize: 13, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6 }}>
                          <AlertTriangle size={14} style={{ color: "#B23237" }} />
                          {evidence.losses || opt.loss_count || 0} losing calls
                        </div>
                        {evidence.pattern && (
                          <div style={{ fontSize: 13, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6 }}>
                            <Lightbulb size={14} style={{ color: "var(--accent)" }} />
                            {evidence.pattern}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button className="ps-btn pri" onClick={() => handleApply(opt.id)}>
                          <CheckCircle2 size={14} /> Apply to Script
                        </button>
                        <button className="ps-btn ghost" disabled title="Coming soon">
                          <GitBranch size={14} /> Compare Versions
                        </button>
                        <button className="ps-btn danger" onClick={() => handleDelete(opt.id)}>
                          <Trash2 size={14} /> Dismiss
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Script Performance ── */}
      {scriptPerformance.length > 0 && (
        <div className="ps-card" style={{ marginBottom: 24, padding: "22px 24px" }}>
          <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 15, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <FileText size={17} /> Script Performance
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {scriptPerformance.map((s) => {
              const st = SCRIPT_STATUS[s.status];
              const StatusIcon = st.icon;
              return (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "#FAFBFD", borderRadius: 10, border: "1px solid var(--line-soft)", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: "var(--faint)", marginTop: 2 }}>
                      Version <b>{s.version}</b> · {s.totalCalls} calls analyzed
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, color: "var(--faint)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>Win Rate</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: st.color, fontFamily: "'Space Grotesk'" }}>{s.winRate}%</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 700, color: st.color }}>
                      <StatusIcon size={14} /> {st.label}
                    </div>
                    {s.lastChanged && (
                      <div style={{ fontSize: 12, color: "var(--faint)" }}>Updated {timeAgo(s.lastChanged)}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Optimization History ── */}
      <div className="ps-card" style={{ marginBottom: 24, padding: "22px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
          <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
            <RotateCcw size={17} /> Optimization History
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { id: "all", label: "All" },
              { id: "applied", label: "Applied" },
              { id: "pending", label: "Pending" },
            ].map((f) => (
              <button key={f.id} className={`ps-btn ${historyFilter === f.id ? "pri sm" : "ghost sm"}`} onClick={() => setHistoryFilter(f.id)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="ds-empty-state" style={{ padding: 24 }}>
            <div className="icon"><RotateCcw size={22} /></div>
            <h3>No history yet</h3>
            <p>Run your first analysis to see optimization history here.</p>
          </div>
        ) : (
          <div className="dt-table-wrap">
            <table className="dt-table">
              <thead>
                <tr>
                  <th style={{ width: "18%" }}>Date</th>
                  <th style={{ width: "14%" }}>Impact</th>
                  <th style={{ width: "28%" }}>Change</th>
                  <th style={{ width: "10%", textAlign: "right" }}>Wins</th>
                  <th style={{ width: "10%", textAlign: "right" }}>Losses</th>
                  <th style={{ width: "12%" }}>Status</th>
                  <th style={{ width: "10%" }} />
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((opt) => {
                  const meta = IMPACT_META[opt.impact_level] || IMPACT_META.medium;
                  return (
                    <tr key={opt.id}>
                      <td style={{ fontSize: 13 }}>{formatDate(opt.created_at)}</td>
                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: meta.color, background: meta.bg, border: `1px solid ${meta.border}`, borderRadius: 6, padding: "2px 8px" }}>
                          {meta.label}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{opt.suggestion}</div>
                        {opt.measured_uplift && (
                          <div style={{ fontSize: 12, color: "#1A7F5B", marginTop: 2 }}>{opt.measured_uplift}</div>
                        )}
                      </td>
                      <td style={{ textAlign: "right", fontSize: 13, color: "#1A7F5B", fontWeight: 700 }}>{opt.win_count || 0}</td>
                      <td style={{ textAlign: "right", fontSize: 13, color: "#B23237", fontWeight: 700 }}>{opt.loss_count || 0}</td>
                      <td>
                        {opt.applied ? (
                          <span className="ds-status ok"><span className="ds-status-dot" />Applied</span>
                        ) : (
                          <span className="ds-status warn"><span className="ds-status-dot" />Pending</span>
                        )}
                      </td>
                      <td>
                        <div className="dt-actions">
                          {!opt.applied && (
                            <button className="dt-more-btn" title="Apply" onClick={() => handleApply(opt.id)}><CheckCircle2 size={14} /></button>
                          )}
                          <button className="dt-more-btn" title="Delete" onClick={() => handleDelete(opt.id)}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
