import React, { useState, useEffect, useMemo } from "react";
import {
  analyzeDealScore,
  listDealScores,
  deleteDealScore,
  getCICalls,
} from "../api/client.js";
import {
  Target,
  Search,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  TrendingUp,
  Shield,
  Users,
  DollarSign,
  Clock,
  Zap,
  RotateCcw,
  ChevronRight,
  Trash2,
  FileText,
  MessageSquare,
  X,
  ExternalLink,
  BarChart3,
  LayoutGrid, List, SlidersHorizontal, ChevronLeft, MoreHorizontal, Eye,
  ChevronUp,
  ChevronDown,
  Phone,
  Calendar,
  User,
  BadgeCheck,
  AlertOctagon,
  CheckSquare,
} from "lucide-react";

/* ============================================================
   Deal Scoring — AI Workspace (Template E)
   Input → Processing → Score + Dimensions + Risks + Next Action
   ============================================================ */

const DIMENSIONS = [
  { key: "need_score", label: "Need", icon: Target },
  { key: "authority_score", label: "Authority", icon: Users },
  { key: "budget_score", label: "Budget", icon: DollarSign },
  { key: "timeline_score", label: "Timeline", icon: Clock },
];

const FUNNEL_STAGES = ["Discovery", "Demo", "Proposal", "Negotiation", "Won"];

const CONFIDENCE_META = {
  high: { label: "High confidence", color: "#1A7F5B", bg: "#EDF9F2" },
  medium: { label: "Medium confidence", color: "#B5720F", bg: "#FBF1DE" },
  low: { label: "Low confidence", color: "#B23237", bg: "#FDF2F2" },
};

function parseJSON(val) {
  try { return JSON.parse(val || "[]"); } catch { return []; }
}

function scoreColor(val) {
  if (val >= 80) return "#1A7F5B";
  if (val >= 50) return "#B5720F";
  return "#B23237";
}

function scoreLabel(val) {
  if (val >= 80) return "Strong";
  if (val >= 50) return "Moderate";
  return "Weak";
}

function scoreBadge(val) {
  if (val >= 80) return "✅";
  if (val >= 50) return "⚠️";
  return "🔴";
}

function formatDate(ts) {
  if (!ts) return "—";
  const d = new Date(typeof ts === "string" ? ts : ts * 1000);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export default function DealScoreView() {
  const [scores, setScores] = useState([]);
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  /* Input state */
  const [source, setSource] = useState("previous");
  const [selectedCallId, setSelectedCallId] = useState("");
  const [transcript, setTranscript] = useState("");

  /* Detail / history */
  const [selectedScore, setSelectedScore] = useState(null);
  const [view, setView] = useState("landing");

  /* Table toolbar state */
  const [searchQuery, setSearchQuery] = useState("");
  const [confidenceFilter, setConfidenceFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  /* Load data */
  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [scoreRows, callRows] = await Promise.all([
        listDealScores().catch(() => []),
        getCICalls().catch(() => []),
      ]);
      setScores(scoreRows || []);
      setCalls(callRows || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyze() {
    let finalTranscript = transcript.trim();
    let scriptId = null;
    let callId = null;

    if (source === "previous") {
      const call = calls.find((c) => String(c.id) === selectedCallId);
      if (!call) {
        setError("Please select a call to analyze");
        return;
      }
      let segments = [];
      try { segments = JSON.parse(call.segments_json || "[]"); } catch { segments = []; }
      const text = segments.map((s) => s.content || s.text || "").filter(Boolean).join("\n");
      finalTranscript = text || call.notes || "";
      scriptId = call.id;
      callId = call.id;
      if (!finalTranscript.trim()) {
        setError("Selected call has no transcript content. Mark outcomes and add notes, or paste a transcript instead.");
        return;
      }
    }

    if (!finalTranscript.trim()) {
      setError("Please paste a transcript to analyze");
      return;
    }

    setAnalyzing(true);
    setError("");
    try {
      const data = await analyzeDealScore({ transcript: finalTranscript, script_id: scriptId, call_id: callId });
      const newScore = data?.score;
      if (newScore) {
        setScores((prev) => [newScore, ...prev]);
        setSelectedScore(newScore);
        setView("detail");
      }
      setTranscript("");
      setSelectedCallId("");
    } catch (e) {
      setError(e.message || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this score?")) return;
    try {
      await deleteDealScore(id);
      setScores((prev) => prev.filter((s) => s.id !== id));
      if (selectedScore?.id === id) {
        setSelectedScore(null);
        setView(scores.length <= 1 ? "landing" : "input");
      }
    } catch (e) {
      setError("Delete failed");
    }
  }

  /* ── Derived: avg metrics for KPI strip ── */
  const kpis = useMemo(() => {
    if (scores.length === 0) return null;
    const avgProb = scores.reduce((a, s) => a + (s.close_probability || 0), 0) / scores.length;
    const avgTone = scores.reduce((a, s) => a + (s.tone_score || 0), 0) / scores.length;
    const wins = scores.filter((s) => (s.close_probability || 0) >= 0.7).length;
    return {
      avgClose: Math.round(avgProb * 100),
      avgTone: Math.round(avgTone),
      total: scores.length,
      strongDeals: wins,
    };
  }, [scores]);

  /* ── Render helpers ── */

  function renderKPIs() {
    if (!kpis) return null;
    const items = [
      { label: "Deals scored", value: kpis.total, sub: `${kpis.strongDeals} likely to close`, icon: Target },
      { label: "Avg close prob", value: `${kpis.avgClose}%`, sub: "Across all analyses", icon: TrendingUp },
      { label: "Avg tone", value: kpis.avgTone, sub: "Out of 100", icon: MessageSquare },
      { label: "Strong deals", value: kpis.strongDeals, sub: "Close prob ≥ 70%", icon: CheckCircle2 },
    ];
    return (
      <div className="ci-kpi-bar" style={{ marginBottom: 24 }}>
        {items.map((k) => (
          <div key={k.label} className="ci-kpi">
            <div className="ci-kpi-label" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <k.icon size={14} /> {k.label}
            </div>
            <div className="ci-kpi-value">{k.value}</div>
            <div className="ci-kpi-sublabel">{k.sub}</div>
          </div>
        ))}
      </div>
    );
  }

  function renderLanding() {
    const hasCalls = calls.length > 0;
    return (
      <>
        {renderKPIs()}

        {/* Analyze CTA card */}
        <div className="ps-card" style={{ padding: 28, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14, background: "var(--accent-bg)", color: "var(--accent)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Target size={28} />
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 18, marginBottom: 6 }}>
                Score a deal
              </div>
              <div style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.55, marginBottom: 18 }}>
                Analyze a sales conversation to predict close probability, identify risk factors, and get a recommended next action.
              </div>

              {!hasCalls ? (
                <div style={{
                  background: "#FBF1DE", border: "1px solid #F0D9A6", borderRadius: 10, padding: "12px 14px",
                  fontSize: 13, color: "var(--amber)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8,
                }}>
                  <Lightbulb size={16} />
                  You need calls with outcomes first. Go to Call Studio, run a script, and mark it as Won or Lost.
                </div>
              ) : null}

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="ds-btn-pri" onClick={() => setView("input")}>
                  <Zap size={16} /> Analyze a deal
                </button>
                <button className="ds-btn-sec" onClick={() => setView("input")}>
                  <FileText size={16} /> Paste transcript
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* History: Toolbar + Table + Pagination */}
        {scores.length > 0 ? (
          <div className="ps-card">
            <div className="dt-header">
              <div className="dt-search">
                <Search size={15} className="dt-search-icon" />
                <input placeholder="Search analyses…" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }} />
                {searchQuery && <button className="dt-search-clear" onClick={() => { setSearchQuery(""); setPage(1); }}><X size={13} /></button>}
              </div>
              <button className={`dt-filter-btn ${confidenceFilter !== "all" ? "on" : ""}`} onClick={() => setShowFilters((s) => !s)}>
                <SlidersHorizontal size={14} /> Filters {confidenceFilter !== "all" && <span className="count">1</span>}
              </button>
              <button className="ds-btn-ter" onClick={() => setView("input")}><RotateCcw size={14} /> New</button>
            </div>

            {showFilters && (
              <div className="dt-filter-panel" style={{ marginBottom: 14 }}>
                <div className="dt-filter-group">
                  <label>Confidence</label>
                  <select className="fsel" value={confidenceFilter} onChange={(e) => { setConfidenceFilter(e.target.value); setPage(1); }}>
                    <option value="all">All</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div className="dt-filter-actions">
                  <button className="ps-btn ghost sm" onClick={() => { setConfidenceFilter("all"); setPage(1); }}><X size={14} /> Clear</button>
                  <button className="ps-btn pri sm" onClick={() => setShowFilters(false)}>Done</button>
                </div>
              </div>
            )}

            <div className="dt-table-wrap">
              <table className="dt-table">
                <thead>
                  <tr>
                    <th style={{ width: "16%" }}>Date</th>
                    <th style={{ width: "14%", textAlign: "right" }}>Score</th>
                    <th style={{ width: "12%", textAlign: "right" }}>Tone</th>
                    <th style={{ width: "18%" }}>Confidence</th>
                    <th style={{ width: "36%" }}>Summary</th>
                    <th style={{ width: "6%" }} />
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((s) => {
                    const prob = Math.round((s.close_probability || 0) * 100);
                    return (
                      <tr key={s.id} onClick={() => { setSelectedScore(s); setView("detail"); }}>
                        <td style={{ fontSize: 13 }}>{formatDate(s.created_at)}</td>
                        <td style={{ textAlign: "right" }}>
                          <span className={`ds-status ${prob >= 80 ? "ok" : prob >= 50 ? "warn" : "bad"}`}>
                            <span className="ds-status-dot" />{prob}%
                          </span>
                        </td>
                        <td style={{ textAlign: "right", fontSize: 13, color: "var(--muted)" }}>{s.tone_score || "—"}</td>
                        <td>
                          <span className={`ds-status ${s.confidence === "high" ? "ok" : s.confidence === "low" ? "bad" : "warn"}`}>
                            <span className="ds-status-dot" />
                            {(CONFIDENCE_META[s.confidence || "medium"] || CONFIDENCE_META.medium).label}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: 13, color: "var(--muted)", maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {s.ai_summary || "No summary"}
                          </div>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="dt-actions">
                            <button className="dt-more-btn" title="Open" onClick={() => { setSelectedScore(s); setView("detail"); }}><Eye size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredScores.length > pageSize && (
              <div className="ds-pagination">
                <span className="ds-pagination-info">Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredScores.length)} of {filteredScores.length}</span>
                <div className="ds-pagination-actions">
                  <button className="ds-btn-ico" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}><ChevronLeft size={16} /></button>
                  <span className="ds-pagination-pages">Page {page} of {totalPages}</span>
                  <button className="ds-btn-ico" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}><ChevronRight size={16} /></button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="ds-empty-state">
            <div className="icon"><Target size={24} /></div>
            <h3>No deal scores yet</h3>
            <p>Analyze your first sales conversation to see close probability, buying signals, risk factors, and recommended next actions.</p>
            <div className="actions">
              <button className="ds-btn-pri" onClick={() => setView("input")}>
                <Zap size={16} style={{ marginRight: 6 }} /> Analyze a deal
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  function renderInput() {
    const hasCalls = calls.length > 0;
    return (
      <>
        {/* Back nav */}
        <button className="ds-btn-ter" style={{ marginBottom: 12 }} onClick={() => setView("landing")}>
          <ArrowRight size={14} style={{ transform: "rotate(180deg)" }} /> Back
        </button>

        {/* Source selector */}
        <div className="ps-card" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 18, marginBottom: 4 }}>
            Analyze a conversation
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>
            Select a previous call or paste a transcript. The AI will assess close probability, risks, and recommend the next action.
          </div>

          {/* Source tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <button
              className={`ds-btn-pri ${source === "previous" ? "" : "ds-btn-sec"}`}
              style={{ opacity: source === "previous" ? 1 : 0.7 }}
              onClick={() => setSource("previous")}
            >
              <MessageSquare size={14} /> Previous call
            </button>
            <button
              className={`ds-btn-pri ${source === "paste" ? "" : "ds-btn-sec"}`}
              style={{ opacity: source === "paste" ? 1 : 0.7 }}
              onClick={() => setSource("paste")}
            >
              <FileText size={14} /> Paste transcript
            </button>
          </div>

          {source === "previous" && (
            <div style={{ marginBottom: 16 }}>
              <label className="ds-label" style={{ display: "block", marginBottom: 8 }}>Select a call</label>
              {!hasCalls ? (
                <div style={{
                  padding: 14, borderRadius: 10, background: "#FBF1DE", border: "1px solid #F0D9A6",
                  fontSize: 13, color: "var(--amber)", display: "flex", alignItems: "center", gap: 8,
                }}>
                  <AlertTriangle size={16} />
                  No calls with outcomes found. Mark scripts as Won or Lost in Call Studio first.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {calls.slice(0, 10).map((c) => {
                    const isSelected = String(c.id) === selectedCallId;
                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedCallId(String(c.id))}
                        style={{
                          padding: "12px 14px", borderRadius: 10, cursor: "pointer",
                          border: isSelected ? "1.5px solid var(--accent)" : "1px solid var(--line-soft)",
                          background: isSelected ? "var(--accent-bg)" : "#FBFCFE",
                          transition: ".12s",
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: 14 }}>
                          {c.product_name || "Unnamed product"} — {c.method || "—"} / {c.call_type || "—"}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--faint)", marginTop: 4 }}>
                          {c.duration ? `${c.duration}m · ` : ""}
                          Outcome: <span style={{ fontWeight: 600, color: c.outcome === "won" ? "#1A7F5B" : c.outcome === "lost" ? "#B23237" : "var(--muted)" }}>{c.outcome || "—"}</span>
                          {" · "}{formatDate(c.saved_at || c.created_at)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {source === "paste" && (
            <div style={{ marginBottom: 16 }}>
              <label className="ds-label" style={{ display: "block", marginBottom: 8 }}>Transcript</label>
              <textarea
                className="ftext ds-textarea"
                rows={6}
                placeholder="Paste a call transcript here..."
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
              />
            </div>
          )}

          {error && (
            <div style={{
              marginBottom: 16, padding: "10px 14px", borderRadius: 10, background: "#FDF2F2",
              border: "1px solid #F0C9CA", color: "#B23237", fontSize: 13, display: "flex", alignItems: "center", gap: 8,
            }}>
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className="ds-btn-pri" onClick={handleAnalyze} disabled={analyzing}>
              {analyzing ? (
                <>
                  <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2, marginRight: 8 }} />
                  Scoring with AI...
                </>
              ) : (
                <>
                  <Zap size={16} /> Score this deal
                </>
              )}
            </button>
          </div>
        </div>
      </>
    );
  }

  function renderDetail() {
    const s = selectedScore;
    if (!s) return null;
    const prob = Math.round((s.close_probability || 0) * 100);
    const conf = CONFIDENCE_META[s.confidence || "medium"] || CONFIDENCE_META.medium;
    const risks = parseJSON(s.risk_factors);
    const recs = parseJSON(s.recommendations);
    const tone = s.tone_score || 0;
    const winMatch = Math.round((s.win_pattern_match || 0) * 100);

    /* Dimension values sorted for visual hierarchy (weakest first) */
    const dimValues = DIMENSIONS.map((d) => ({
      ...d,
      val: s[d.key] || 0,
    })).sort((a, b) => a.val - b.val);

    const weakestDim = dimValues[0];

    /* Trend (mock: if there's a previous score, compare) */
    const prevScore = scores.find((sc) => sc.id !== s.id);
    const trend = prevScore ? Math.round((s.close_probability || 0) * 100) - Math.round((prevScore.close_probability || 0) * 100) : 0;

    /* Diagnosis — split from ai_summary if possible, else build from data */
    const diagnosis = {
      good: [],
      blocking: risks.slice(0, 2),
      next: recs.slice(0, 3),
    };
    // Try to build "good" from positive dimensions
    dimValues.forEach((d) => {
      if (d.val >= 70) diagnosis.good.push(`${d.label} is well qualified (${d.val})`);
    });
    if (!diagnosis.good.length) diagnosis.good.push("Deal is being actively worked");
    if (!diagnosis.blocking.length) diagnosis.blocking.push("No major risks identified yet");
    if (!diagnosis.next.length) diagnosis.next.push("Continue discovery and build rapport");

    /* Call evidence — mock from transcript / summary */
    const evidence = [
      s.ai_summary?.slice(0, 120) + (s.ai_summary?.length > 120 ? "…" : ""),
      ...(risks.length ? [`Risk: ${risks[0]}`] : []),
      ...(recs.length ? [`Next: ${recs[0]}`] : []),
    ].filter(Boolean).slice(0, 3);

    /* Deal metadata — try to extract from related call, else fallback */
    const relatedCall = calls.find((c) => String(c.id) === String(s.call_id || s.script_id));
    const prospectName = relatedCall?.prospect_name || "Prospect";
    const companyName = relatedCall?.company_name || relatedCall?.product_name || "Company";
    const callType = relatedCall?.call_type || "Discovery Call";
    const callDate = formatDate(s.created_at);
    const duration = relatedCall?.duration ? `${relatedCall.duration} min` : "—";
    const repName = relatedCall?.rep_name || "Rep";
    const dealValue = relatedCall?.deal_value || "";
    const stage = relatedCall?.stage || "Discovery";

    /* Funnel index */
    const stageIndex = FUNNEL_STAGES.indexOf(stage) >= 0 ? FUNNEL_STAGES.indexOf(stage) : 0;

    return (
      <>
        {/* Back nav */}
        <button className="ds-btn-ter" style={{ marginBottom: 14 }} onClick={() => setView("landing")}>
          <ArrowRight size={14} style={{ transform: "rotate(180deg)" }} /> Deal Scores
        </button>

        {/* ── DEAL META HEADER ── */}
        <div className="ds-detail-meta" style={{ marginBottom: 24 }}>
          <div className="ds-meta-main">
            <div className="ds-meta-avatar">{prospectName.charAt(0)}</div>
            <div className="ds-meta-body">
              <div className="ds-meta-name">{prospectName} — {companyName}</div>
              <div className="ds-meta-line">
                <span className="ds-meta-chip"><Phone size={12} /> {callType}</span>
                <span className="ds-meta-chip"><Calendar size={12} /> {callDate}</span>
                <span className="ds-meta-chip"><Clock size={12} /> {duration}</span>
                {dealValue && <span className="ds-meta-chip"><DollarSign size={12} /> {dealValue}</span>}
              </div>
            </div>
          </div>
          <div className="ds-meta-extra">
            <span className="ds-meta-chip"><User size={12} /> Rep: {repName}</span>
            <span className="ds-meta-chip"><BadgeCheck size={12} /> Stage: {stage}</span>
          </div>
        </div>

        {/* ── COMPACT SCORE HERO ── */}
        <div className="ds-score-hero-compact" style={{ marginBottom: 28 }}>
          <div className="ds-score-left">
            <div className="ds-score-num" style={{ color: scoreColor(prob) }}>{prob}<span className="ds-score-denom">/100</span></div>
            <div className="ds-score-label">{scoreLabel(prob)} chance of closing</div>
            {trend !== 0 && (
              <div className="ds-score-trend" style={{ color: trend > 0 ? "#1A7F5B" : "#B23237" }}>
                {trend > 0 ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {Math.abs(trend)} from previous call
              </div>
            )}
          </div>
          <div className="ds-score-right">
            <div className="ds-confidence-badge" style={{ background: conf.bg, color: conf.color, border: `1px solid ${conf.color}30` }}>
              <Shield size={14} />
              {conf.label}
              <span className="ds-confidence-hint" title="Based on transcript length and qualification signals detected.">Based on 1 call transcript and {dimValues.filter((d) => d.val > 0).length} qualification signals.</span>
            </div>
            {winMatch > 0 && (
              <div className="ds-score-sub">
                <CheckCircle2 size={13} style={{ color: "#1A7F5B" }} />
                {winMatch}% match with winning patterns
              </div>
            )}
          </div>
        </div>

        {/* ── WHY THIS SCORE? ── */}
        <div className="ps-card" style={{ marginBottom: 24, padding: "22px 24px" }}>
          <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 15, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <BarChart3 size={17} /> Why this score?
          </div>
          <div className="ds-dim-grid-horiz">
            {dimValues.map((d) => {
              const DimIcon = d.icon;
              const isWeak = d.val < 50;
              const isStrong = d.val >= 80;
              return (
                <div key={d.key} className={`ds-dim-bar-row ${isWeak ? "weak" : ""}`}>
                  <div className="ds-dim-bar-info">
                    <DimIcon size={15} className="ds-dim-bar-icon" style={{ color: scoreColor(d.val) }} />
                    <span className="ds-dim-bar-label">{d.label}</span>
                    <span className="ds-dim-bar-score" style={{ color: scoreColor(d.val) }}>{d.val} {scoreLabel(d.val)} {scoreBadge(d.val)}</span>
                  </div>
                  <div className="ds-dim-bar-track">
                    <div className="ds-dim-bar-fill" style={{ width: `${d.val}%`, background: scoreColor(d.val) }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Primary risk callout */}
          {weakestDim.val < 50 && (
            <div className="ds-primary-risk" style={{ marginTop: 18 }}>
              <AlertOctagon size={16} style={{ color: "#B23237", flexShrink: 0 }} />
              <div>
                <div className="ds-risk-title">Primary risk: {weakestDim.label}</div>
                <div className="ds-risk-body">
                  {weakestDim.label} was not sufficiently discussed or confirmed during the call. This is the biggest factor dragging the score down.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── AI DEAL DIAGNOSIS ── */}
        <div className="ps-card" style={{ marginBottom: 24, padding: "22px 24px" }}>
          <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 15, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <Lightbulb size={17} /> AI Deal Diagnosis
          </div>

          <div className="ds-diagnosis-grid">
            {/* What's working */}
            <div className="ds-diagnosis-col good">
              <div className="ds-diagnosis-h">
                <CheckCircle2 size={15} style={{ color: "#1A7F5B" }} /> What looks good
              </div>
              <ul className="ds-diagnosis-list">
                {diagnosis.good.map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            </div>

            {/* What's blocking */}
            <div className="ds-diagnosis-col bad">
              <div className="ds-diagnosis-h">
                <AlertTriangle size={15} style={{ color: "#B23237" }} /> What is blocking the deal
              </div>
              <ul className="ds-diagnosis-list">
                {diagnosis.blocking.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>

            {/* What to do next */}
            <div className="ds-diagnosis-col next">
              <div className="ds-diagnosis-h">
                <Zap size={15} style={{ color: "var(--accent)" }} /> What to do next
              </div>
              <ul className="ds-diagnosis-list">
                {diagnosis.next.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ── PRIORITY ACTIONS ── */}
        <div className="ps-card" style={{ marginBottom: 24, padding: "22px 24px" }}>
          <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 15, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <Target size={17} /> Priority Actions
          </div>

          <div className="ds-priority-list">
            {risks.length > 0 || recs.length > 0 ? (
              [...risks.slice(0, 2), ...recs.slice(0, 2)].map((item, i) => {
                const severity = i === 0 ? "high" : i === 1 ? "medium" : "low";
                const colors = { high: "#B23237", medium: "#B5720F", low: "#B5720F" };
                const bg = { high: "#FDF2F2", medium: "#FBF1DE", low: "#FBF1DE" };
                const icons = { high: "🔴", medium: "🟠", low: "🟡" };
                return (
                  <div key={`pri-${i}-${item.slice(0, 20)}`} className="ds-priority-item">
                    <div className="ds-priority-severity" style={{ color: colors[severity] }}>{icons[severity]}</div>
                    <div className="ds-priority-body">
                      <div className="ds-priority-title">{item}</div>
                      <div className="ds-priority-desc">Address this in your next touchpoint to improve close probability.</div>
                    </div>
                    <button className="ds-priority-cta" onClick={() => console.warn("Task creation not yet implemented:", item)} style={{ background: bg[severity], color: colors[severity] }}>
                      <CheckSquare size={13} /> Create Task
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="ds-priority-item">
                <div className="ds-priority-severity" style={{ color: "#1A7F5B" }}>🟢</div>
                <div className="ds-priority-body">
                  <div className="ds-priority-title">No urgent actions</div>
                  <div className="ds-priority-desc">Continue following your current sales process. Monitor for any new risks.</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── CALL EVIDENCE ── */}
        {evidence.length > 0 && (
          <div className="ps-card" style={{ marginBottom: 24, padding: "22px 24px" }}>
            <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 15, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <MessageSquare size={17} /> Call Evidence
            </div>
            <div className="ds-evidence-list">
              {evidence.map((ex, i) => (
                <div key={`ev-${i}-${ex.slice(0, 20)}`} className="ds-evidence-item">
                  “{ex}”
                </div>
              ))}
            </div>
            <button className="ps-btn ghost sm" style={{ marginTop: 10 }} disabled title="Coming soon">
              <FileText size={13} /> View Full Transcript
            </button>
          </div>
        )}

        {/* ── DEAL PROGRESSION ── */}
        <div className="ps-card" style={{ marginBottom: 24, padding: "22px 24px" }}>
          <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 15, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <TrendingUp size={17} /> Deal Progression
          </div>
          <div className="ds-funnel">
            {FUNNEL_STAGES.map((st, i) => {
              const isCurrent = i === stageIndex;
              const isPast = i < stageIndex;
              return (
                <>
                  <div key={st} className={`ds-funnel-step ${isCurrent ? "current" : isPast ? "past" : ""}`}>
                    <div className="ds-funnel-dot" />
                    <div className="ds-funnel-label">{st}</div>
                  </div>
                  {i < FUNNEL_STAGES.length - 1 && (
                    <div className={`ds-funnel-connector ${isPast ? "past" : ""}`} />
                  )}
                </>
              );
            })}
          </div>          <div style={{ marginTop: 12, fontSize: 13, color: "var(--muted)" }}>
            Current stage: <b style={{ color: "var(--ink)" }}>{FUNNEL_STAGES[stageIndex]}</b>
            {stageIndex < FUNNEL_STAGES.length - 1 && (
              <> · Next recommended: <b style={{ color: "var(--accent-ink)" }}>{FUNNEL_STAGES[stageIndex + 1]}</b></>
            )}
          </div>
        </div>

        {/* ── BOTTOM ACTIONS ── */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          <button className="ps-btn pri" onClick={() => { setSelectedScore(null); setView("input"); }}>
            <RotateCcw size={16} /> Analyze another
          </button>
          <button className="ps-btn ghost" onClick={() => setView("landing")}>
            View all analyses
          </button>
          <button className="ps-btn subtle danger" onClick={() => handleDelete(s.id)}>
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </>
    );
  }

  /* ── Filtered scores + pagination ── */
  const filteredScores = useMemo(() => {
    let list = [...scores];
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((s) =>
        (s.ai_summary || "").toLowerCase().includes(q) ||
        String(s.close_probability || "").includes(q)
      );
    }
    if (confidenceFilter !== "all") {
      list = list.filter((s) => (s.confidence || "medium") === confidenceFilter);
    }
    return list;
  }, [scores, searchQuery, confidenceFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredScores.length / pageSize));
  const paginated = filteredScores.slice((page - 1) * pageSize, page * pageSize);

  /* ── Main render ── */
  return (
    <div className="ps-container">
      <div className="ps-header">
        <h1><Target size={24} style={{ marginRight: 10, verticalAlign: "-4px" }} />Deal Scoring</h1>
        <p className="ps-muted">AI-powered assessment of deal quality and likelihood to close.</p>
      </div>

      {view === "landing" && renderLanding()}
      {view === "input" && renderInput()}
      {view === "detail" && renderDetail()}
    </div>
  );
}
