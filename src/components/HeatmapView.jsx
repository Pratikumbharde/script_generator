import React, { useState, useEffect, useMemo, useRef } from "react";
import LimitedTextarea from "./shared/LimitedTextarea.jsx";
import {
  listHeatmaps,
  generateHeatmaps,
  analyzeScriptsCI,
  getCIOverview,
  getCICalls,
} from "../api/client.js";
import {
  Activity,
  BarChart3,
  TrendingUp,
  Target,
  Search,
  Filter,
  RotateCcw,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  X,
  MessageSquare,
  Play,
  Zap,
  LayoutTemplate,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

/* ============================================================
   Conversation Intelligence — Command Center
   Overview | Phrases | Calls | Trends
   Consumes existing Pitch Studio scripts with outcomes.
   Manual import is secondary.
   ============================================================ */

const TABS = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "phrases", label: "Phrases", icon: MessageSquare },
  { id: "calls", label: "Calls", icon: LayoutTemplate },
  { id: "trends", label: "Trends", icon: TrendingUp },
];

const CATEGORIES = [
  { id: "opening", label: "Opening", color: "#2B4CF0", bg: "#EAEEFE" },
  { id: "value_prop", label: "Value Proposition", color: "#0E8C7C", bg: "#E8F6EF" },
  { id: "objection", label: "Objection Handling", color: "#B5720F", bg: "#FBF1DE" },
  { id: "closing", label: "Closing", color: "#7A46C9", bg: "#F3EEFC" },
  { id: "discovery", label: "Discovery", color: "#0B7A5B", bg: "#E8F6EF" },
  { id: "rapport", label: "Rapport", color: "#D23B3F", bg: "#FDF2F2" },
];

const PATTERN_FILTERS = [
  { id: "all", label: "All patterns" },
  { id: "winning", label: "Winning patterns" },
  { id: "losing", label: "Losing patterns" },
];

const OUTCOME_OPTIONS = [
  { id: "all", label: "All outcomes" },
  { id: "won", label: "Won" },
  { id: "lost", label: "Lost" },
  { id: "no_deal", label: "No deal" },
];

function parseJSON(val) {
  try { return JSON.parse(val || "[]"); } catch { return []; }
}

function categoryMeta(id) {
  return CATEGORIES.find((c) => c.id === id) || { label: id, color: "#667180", bg: "#F4F6FA" };
}

function confidenceLabel(winCount, lossCount) {
  const total = (winCount || 0) + (lossCount || 0);
  if (total >= 10) return { label: "High confidence", color: "#1A7F5B", bg: "#EDF9F2" };
  if (total >= 5) return { label: "Medium confidence", color: "#B5720F", bg: "#FBF1DE" };
  return { label: "Low confidence", color: "#B23237", bg: "#FDF2F2" };
}

function formatDate(ts) {
  if (!ts) return "—";
  const normalized = typeof ts === 'string' && !ts.endsWith('Z') && !ts.includes('+') ? ts + 'Z' : ts;
  const d = new Date(typeof normalized === 'string' ? normalized : normalized * 1000);
  if (isNaN(d.getTime())) return "—";
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export default function ConversationIntelligenceView() {
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  /* Data states */
  const [overview, setOverview] = useState(null);
  const [phrases, setPhrases] = useState([]);
  const [calls, setCalls] = useState([]);

  /* Filters */
  const [patternFilter, setPatternFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [minConfidence, setMinConfidence] = useState(5);
  const [searchQ, setSearchQ] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  /* Calls filters */
  const [callOutcomeFilter, setCallOutcomeFilter] = useState("all");
  const [callSearch, setCallSearch] = useState("");

  /* Detail modal */
  const [selectedPhrase, setSelectedPhrase] = useState(null);

  /* Import modal (secondary) */
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);

  /* Refs */
  const abortRef = useRef(false);

  /* ── Load overview + calls on mount ── */
  useEffect(() => {
    loadOverview();
    loadCalls();
  }, []);

  /* ── Load phrases when tab switches to phrases ── */
  useEffect(() => {
    if (tab === "phrases") loadPhrases();
  }, [tab]);

  async function loadOverview() {
    try {
      const data = await getCIOverview();
      setOverview(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadPhrases() {
    setLoading(true);
    try {
      const rows = await listHeatmaps(undefined, "script_analysis");
      setPhrases(rows || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadCalls() {
    try {
      const rows = await getCICalls();
      setCalls(rows || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleAnalyzeScripts() {
    setAnalyzing(true);
    setError("");
    try {
      const data = await analyzeScriptsCI();
      setPhrases(data.heatmaps || []);
      setOverview((prev) => ({ ...prev, phrasesAnalyzed: (data.heatmaps || []).length }));
      setTab("phrases");
    } catch (e) {
      setError(e.message || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleImportTranscripts() {
    const lines = importText.split("\n").filter((t) => t.trim().length > 20);
    if (lines.length === 0) return;
    setImporting(true);
    try {
      await generateHeatmaps(lines);
      setImportText("");
      setShowImport(false);
      await loadPhrases();
      await loadOverview();
    } catch (e) {
      setError("Import failed: " + (e.message || "try again"));
    } finally {
      setImporting(false);
    }
  }

  /* ── Derived: filtered phrases ── */
  const filteredPhrases = useMemo(() => {
    let rows = [...phrases];
    if (patternFilter === "winning") rows = rows.filter((p) => (p.win_correlation || 0) > 0);
    if (patternFilter === "losing") rows = rows.filter((p) => (p.win_correlation || 0) < 0);
    if (categoryFilter !== "all") rows = rows.filter((p) => p.category === categoryFilter);
    if (minConfidence > 0) {
      rows = rows.filter((p) => ((p.win_count || 0) + (p.loss_count || 0)) >= minConfidence);
    }
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      rows = rows.filter((p) => (p.phrase || "").toLowerCase().includes(q));
    }
    return rows.sort((a, b) => (b.win_correlation || 0) - (a.win_correlation || 0));
  }, [phrases, patternFilter, categoryFilter, minConfidence, searchQ]);

  /* ── Derived: filtered calls ── */
  const filteredCalls = useMemo(() => {
    let rows = [...calls];
    if (callOutcomeFilter !== "all") rows = rows.filter((c) => c.outcome === callOutcomeFilter);
    if (callSearch.trim()) {
      const q = callSearch.toLowerCase();
      rows = rows.filter((c) =>
        (c.product_name || "").toLowerCase().includes(q) ||
        (c.method || "").toLowerCase().includes(q) ||
        (c.call_type || "").toLowerCase().includes(q)
      );
    }
    return rows;
  }, [calls, callOutcomeFilter, callSearch]);

  /* ── Derived: category breakdown for trends ── */
  const categoryTrends = useMemo(() => {
    const map = {};
    CATEGORIES.forEach((c) => { map[c.id] = { ...c, wins: 0, losses: 0, phrases: 0, avgCorr: 0 }; });
    phrases.forEach((p) => {
      const cat = map[p.category];
      if (cat) {
        cat.wins += p.win_count || 0;
        cat.losses += p.loss_count || 0;
        cat.phrases += 1;
        cat.avgCorr += p.win_correlation || 0;
      }
    });
    Object.values(map).forEach((c) => {
      if (c.phrases > 0) c.avgCorr = c.avgCorr / c.phrases;
      c.winRate = c.wins + c.losses > 0 ? c.wins / (c.wins + c.losses) : 0;
    });
    return Object.values(map);
  }, [phrases]);

  /* ── Render helpers ── */
  function renderKPIs() {
    if (!overview) return null;
    const items = [
      {
        label: "Calls analyzed",
        value: overview.totalCalls || 0,
        sub: `${overview.wins || 0} wins · ${overview.losses || 0} losses`,
        icon: MessageSquare,
      },
      {
        label: "Win rate",
        value: `${overview.winRate || 0}%`,
        sub: overview.totalCalls > 0 ? "Based on call outcomes" : "No outcomes yet",
        icon: Target,
      },
      {
        label: "Patterns found",
        value: overview.phrasesAnalyzed || 0,
        sub: overview.avgCorrelation ? `Avg correlation ${overview.avgCorrelation.toFixed(2)}` : "Run analysis to discover",
        icon: Lightbulb,
      },
      {
        label: "Top insight",
        value: overview.topWinningPhrase ? "Available" : "—",
        sub: overview.topWinningPhrase?.phrase?.slice(0, 40) + (overview.topWinningPhrase?.phrase?.length > 40 ? "…" : "") || "Analyze scripts",
        icon: Zap,
      },
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

  function renderOverviewEmpty() {
    const hasCalls = (overview?.totalCalls || 0) > 0;
    return (
      <div className="ci-empty" style={{ padding: "48px 24px", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: "var(--accent-bg)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <Activity size={28} />
        </div>
        <h3 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
          {hasCalls ? "Ready to analyze" : "No calls with outcomes yet"}
        </h3>
        <p style={{ color: "var(--muted)", fontSize: 14, maxWidth: 460, margin: "0 auto 24px", lineHeight: 1.55 }}>
          {hasCalls
            ? `You have ${overview.totalCalls} call${overview.totalCalls === 1 ? "" : "s"} with outcomes. Run conversation intelligence analysis to discover which phrases correlate with wins and losses.`
            : "Mark scripts as Won or Lost in the Call Studio or Scripts view. Once you have outcomes, Pitch Studio can analyze which language patterns drive results."}
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {hasCalls && (
            <button className="ps-btn pri" onClick={handleAnalyzeScripts} disabled={analyzing}>
              {analyzing ? (
                <>
                  <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2, marginRight: 8 }} />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap size={16} style={{ marginRight: 6 }} />
                  Analyze my calls
                </>
              )}
            </button>
          )}
          <button className="ps-btn ghost" onClick={() => setShowImport(true)}>
            <ExternalLink size={16} style={{ marginRight: 6 }} />
            Import transcripts
          </button>
        </div>
        {error && (
          <div style={{ marginTop: 16, color: "var(--aggressive)", fontSize: 13 }}>
            <AlertTriangle size={14} style={{ marginRight: 5, verticalAlign: "-2px" }} />
            {error}
          </div>
        )}
      </div>
    );
  }

  function renderOverview() {
    if (!overview || !overview.hasData) return renderOverviewEmpty();
    return (
      <>
        {renderKPIs()}

        {/* Quick actions */}
        <div className="ps-card" style={{ marginBottom: 24, padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Conversation Intelligence</div>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>
                {overview.phrasesAnalyzed > 0
                  ? `${overview.phrasesAnalyzed} patterns discovered from ${overview.totalCalls} calls`
                  : "Run analysis to discover winning and losing patterns"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="ps-btn pri" onClick={handleAnalyzeScripts} disabled={analyzing}>
                {analyzing ? (
                  <>
                    <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2, marginRight: 8 }} />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <RotateCcw size={16} style={{ marginRight: 6 }} />
                    {overview.phrasesAnalyzed > 0 ? "Re-analyze" : "Analyze calls"}
                  </>
                )}
              </button>
              <button className="ps-btn ghost sm" onClick={() => setShowImport(true)}>
                <ExternalLink size={14} style={{ marginRight: 5 }} />
                Import
              </button>
            </div>
          </div>
        </div>

        {/* Top phrases preview */}
        {phrases.length > 0 && (
          <div className="ps-card" style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 16 }}>Top patterns</div>
              <button className="ps-btn ghost sm" onClick={() => setTab("phrases")}>
                View all <ArrowRight size={14} style={{ marginLeft: 4 }} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {phrases.slice(0, 5).map((p) => {
                const cat = categoryMeta(p.category);
                const conf = confidenceLabel(p.win_count, p.loss_count);
                const isWin = (p.win_correlation || 0) > 0;
                return (
                  <div
                    key={p.id}
                    onClick={() => { setSelectedPhrase(p); }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 14px",
                      borderRadius: 10,
                      border: "1px solid var(--line-soft)",
                      cursor: "pointer",
                      transition: ".12s",
                      background: "#FBFCFE",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#F4F6FA"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#FBFCFE"; }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                      background: isWin ? "#EDF9F2" : "#FDF2F2",
                      color: isWin ? "#1A7F5B" : "#B23237",
                      fontWeight: 700, fontSize: 12, flexShrink: 0,
                    }}>
                      {isWin ? "+" : ""}{((p.win_correlation || 0) * 100).toFixed(0)}%
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {p.phrase}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: cat.bg, color: cat.color }}>
                          {cat.label}
                        </span>
                        <span style={{ fontSize: 11, color: "var(--faint)", fontWeight: 500 }}>
                          {p.usage_count || 0} occurrences
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: conf.bg, color: conf.color }}>
                          {conf.label}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={16} color="var(--faint)" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Category breakdown */}
        {overview.categoryBreakdown?.length > 0 && (
          <div className="ps-card" style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Performance by category</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {overview.categoryBreakdown.map((c) => {
                const meta = categoryMeta(c.category);
                const total = (c.total_wins || 0) + (c.total_losses || 0);
                const winRate = total > 0 ? Math.round((c.total_wins / total) * 100) : 0;
                return (
                  <div key={c.category}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: meta.bg, color: meta.color }}>
                          {meta.label}
                        </span>
                        <span style={{ fontSize: 12, color: "var(--faint)" }}>{c.phrase_count} patterns</span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: winRate >= 50 ? "#1A7F5B" : "#B23237" }}>
                        {winRate}% win rate
                      </div>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: "var(--line-soft)", overflow: "hidden" }}>
                      <div style={{
                        height: "100%",
                        borderRadius: 4,
                        width: `${winRate}%`,
                        background: winRate >= 50 ? "linear-gradient(90deg, #1A7F5B, #34D399)" : "linear-gradient(90deg, #B23237, #FCA5A5)",
                        transition: "width .6s ease",
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </>
    );
  }

  function renderPhrases() {
    if (phrases.length === 0) {
      return (
        <div className="ci-empty" style={{ padding: "48px 24px", textAlign: "center" }}>
          <MessageSquare size={32} style={{ margin: "0 auto 16px", color: "var(--faint)" }} />
          <h3 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>No patterns analyzed yet</h3>
          <p style={{ color: "var(--muted)", fontSize: 14, maxWidth: 420, margin: "0 auto 20px", lineHeight: 1.55 }}>
            Run analysis on your existing calls with outcomes to discover which phrases drive wins and losses.
          </p>
          <button className="ps-btn pri" onClick={handleAnalyzeScripts} disabled={analyzing}>
            {analyzing ? "Analyzing..." : "Analyze my calls"}
          </button>
        </div>
      );
    }

    return (
      <>
        {/* Filter bar */}
        <div className="dt-header" style={{ marginBottom: 16 }}>
          <div className="dt-search" style={{ maxWidth: 320 }}>
            <Search size={15} className="dt-search-icon" />
            <input
              type="text"
              placeholder="Search phrases..."
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
            />
          </div>
          <button className={`dt-filter-btn ${showFilters ? "on" : ""}`} onClick={() => setShowFilters((s) => !s)}>
            <Filter size={14} /> Filters
          </button>
          <button className="ps-btn ghost sm" onClick={handleAnalyzeScripts} disabled={analyzing}>
            <RotateCcw size={14} style={{ marginRight: 4 }} />
            {analyzing ? "Analyzing..." : "Re-analyze"}
          </button>
          <button className="ps-btn ghost sm" onClick={() => setShowImport(true)}>
            <ExternalLink size={14} style={{ marginRight: 4 }} />
            Import
          </button>
        </div>

        {showFilters && (
          <div className="dt-filter-panel" style={{ marginBottom: 16 }}>
            <div className="dt-filter-group">
              <label>Pattern type</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {PATTERN_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    className={`ps-btn ${patternFilter === f.id ? "pri sm" : "ghost sm"}`}
                    onClick={() => setPatternFilter(f.id)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="dt-filter-group">
              <label>Category</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button className={`ps-btn ${categoryFilter === "all" ? "pri sm" : "ghost sm"}`} onClick={() => setCategoryFilter("all")}>All</button>
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    className={`ps-btn ${categoryFilter === c.id ? "pri sm" : "ghost sm"}`}
                    onClick={() => setCategoryFilter(c.id)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="dt-filter-group">
              <label>Min occurrences (confidence)</label>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={minConfidence}
                  onChange={(e) => setMinConfidence(parseInt(e.target.value))}
                  style={{ flex: 1, maxWidth: 200 }}
                />
                <span style={{ fontSize: 13, fontWeight: 600, minWidth: 60 }}>{minConfidence}+</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 4 }}>Patterns with fewer occurrences are hidden to avoid noise</div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontSize: 13, color: "var(--muted)" }}>
          <span style={{ fontWeight: 600, color: "var(--ink)" }}>{filteredPhrases.length}</span> patterns
          {patternFilter !== "all" && (
            <span className="dt-chip-removable">
              {PATTERN_FILTERS.find((f) => f.id === patternFilter)?.label}
              <button onClick={() => setPatternFilter("all")}><X size={12} /></button>
            </span>
          )}
          {categoryFilter !== "all" && (
            <span className="dt-chip-removable">
              {categoryMeta(categoryFilter).label}
              <button onClick={() => setCategoryFilter("all")}><X size={12} /></button>
            </span>
          )}
          {(patternFilter !== "all" || categoryFilter !== "all" || searchQ.trim()) && (
            <button className="ps-btn-ghost" style={{ fontSize: 11.5 }} onClick={() => { setPatternFilter("all"); setCategoryFilter("all"); setSearchQ(""); }}>Clear all</button>
          )}
        </div>

        {/* Table */}
        <div className="dt-table-wrap">
          <table className="dt-table">
            <thead>
              <tr>
                <th>Phrase</th>
                <th>Category</th>
                <th style={{ textAlign: "right" }}>Associated with</th>
                <th style={{ textAlign: "right" }}>Occurrences</th>
                <th style={{ textAlign: "right" }}>Confidence</th>
                <th style={{ width: 40 }} />
              </tr>
            </thead>
            <tbody>
              {filteredPhrases.map((p) => {
                const cat = categoryMeta(p.category);
                const isWin = (p.win_correlation || 0) > 0;
                const conf = confidenceLabel(p.win_count, p.loss_count);
                const total = (p.win_count || 0) + (p.loss_count || 0);
                const evidence = parseJSON(p.evidence_json);
                return (
                  <tr key={p.id} onClick={() => setSelectedPhrase(p)}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{p.phrase}</div>
                    </td>
                    <td>
                      <span className="ds-status neu"><span className="ds-status-dot" />{cat.label}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span className={`ds-status ${isWin ? "ok" : "bad"}`}>
                        <span className="ds-status-dot" />
                        {isWin ? "Wins" : "Losses"}
                      </span>
                      <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 2 }}>
                        {p.win_count || 0}W · {p.loss_count || 0}L
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontSize: 13, fontWeight: 600 }}>
                      {total}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span className={`ds-status ${total >= 10 ? "ok" : total >= 5 ? "warn" : "bad"}`}>
                        <span className="ds-status-dot" />
                        {conf.label}
                      </span>
                    </td>
                    <td>
                      <ChevronRight size={14} color="var(--faint)" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  function renderCalls() {
    if (calls.length === 0) {
      return (
        <div className="ci-empty" style={{ padding: "48px 24px", textAlign: "center" }}>
          <LayoutTemplate size={32} style={{ margin: "0 auto 16px", color: "var(--faint)" }} />
          <h3 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>No calls with outcomes</h3>
          <p style={{ color: "var(--muted)", fontSize: 14, maxWidth: 420, margin: "0 auto 20px", lineHeight: 1.55 }}>
            Mark scripts as Won or Lost in the Call Studio to build your conversation intelligence dataset.
          </p>
        </div>
      );
    }

    return (
      <>
        <div className="dt-header" style={{ marginBottom: 16 }}>
          <div className="dt-search" style={{ maxWidth: 320 }}>
            <Search size={15} className="dt-search-icon" />
            <input
              type="text"
              placeholder="Search calls..."
              value={callSearch}
              onChange={(e) => setCallSearch(e.target.value)}
            />
          </div>
          <div className="dt-filter-group" style={{ display: "flex", gap: 6 }}>
            {OUTCOME_OPTIONS.map((o) => (
              <button
                key={o.id}
                className={`ps-btn ${callOutcomeFilter === o.id ? "pri sm" : "ghost sm"}`}
                onClick={() => setCallOutcomeFilter(o.id)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="dt-table-wrap">
          <table className="dt-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Method</th>
                <th>Type</th>
                <th style={{ textAlign: "right" }}>Duration</th>
                <th>Outcome</th>
                <th style={{ textAlign: "right" }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredCalls.map((c) => {
                const outcomeMeta = {
                  won: { label: "Won", color: "#1A7F5B", bg: "#EDF9F2" },
                  lost: { label: "Lost", color: "#B23237", bg: "#FDF2F2" },
                  no_deal: { label: "No deal", color: "#667180", bg: "#F4F6FA" },
                  pending: { label: "Pending", color: "#B5720F", bg: "#FBF1DE" },
                }[c.outcome || "pending"] || { label: c.outcome || "—", color: "#667180", bg: "#F4F6FA" };
                return (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600, fontSize: 13.5 }}>{c.product_name || "—"}</td>
                    <td style={{ fontSize: 13, color: "var(--muted)" }}>{c.method || "—"}</td>
                    <td style={{ fontSize: 13, color: "var(--muted)" }}>{c.call_type || "—"}</td>
                    <td style={{ textAlign: "right", fontSize: 13 }}>{c.duration ? `${c.duration}m` : "—"}</td>
                    <td>
                      <span className={`ds-status ${c.outcome === "won" ? "ok" : c.outcome === "lost" ? "bad" : c.outcome === "no_deal" ? "neu" : "warn"}`}>
                        <span className="ds-status-dot" />
                        {outcomeMeta.label}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", fontSize: 12, color: "var(--faint)" }}>{formatDate(c.saved_at || c.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  function renderTrends() {
    if (phrases.length === 0) {
      return (
        <div className="ci-empty" style={{ padding: "48px 24px", textAlign: "center" }}>
          <TrendingUp size={32} style={{ margin: "0 auto 16px", color: "var(--faint)" }} />
          <h3 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>No trend data yet</h3>
          <p style={{ color: "var(--muted)", fontSize: 14, maxWidth: 420, margin: "0 auto 20px", lineHeight: 1.55 }}>
            Analyze your calls first to see category performance and win rate trends.
          </p>
          <button className="ps-btn pri" onClick={handleAnalyzeScripts} disabled={analyzing}>
            {analyzing ? "Analyzing..." : "Analyze calls"}
          </button>
        </div>
      );
    }

    return (
      <>
        {/* Category heatmap matrix */}
        <div className="ps-card" style={{ marginBottom: 24, padding: 20 }}>
          <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Category performance matrix</div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>Win rate intensity by conversation category</div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8, marginBottom: 12 }}>
            {categoryTrends.map((c) => {
              const intensity = Math.max(0, Math.min(1, c.winRate));
              const red = Math.round(178 + (178 - 178) * intensity); // stays
              const green = Math.round(50 + (127 - 50) * intensity);
              const blue = Math.round(55 + (91 - 55) * intensity);
              const cellColor = `rgb(${Math.round(178 * (1 - intensity) + 26 * intensity)}, ${Math.round(50 * (1 - intensity) + 127 * intensity)}, ${Math.round(55 * (1 - intensity) + 91 * intensity)})`;
              return (
                <div key={c.id} style={{ textAlign: "center" }}>
                  <div
                    style={{
                      height: 80,
                      borderRadius: 12,
                      background: cellColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: intensity > 0.5 ? "#fff" : "#fff",
                      fontFamily: "'Space Grotesk'",
                      fontWeight: 700,
                      fontSize: 18,
                      marginBottom: 8,
                      transition: "background .3s",
                    }}
                  >
                    {Math.round(c.winRate * 100)}%
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)" }}>{c.label}</div>
                  <div style={{ fontSize: 11, color: "var(--faint)" }}>{c.phrases} patterns</div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--faint)" }}>
              <div style={{ width: 14, height: 14, borderRadius: 4, background: "#B23237" }} />
              Low win rate
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--faint)" }}>
              <div style={{ width: 14, height: 14, borderRadius: 4, background: "#1A7F5B" }} />
              High win rate
            </div>
          </div>
        </div>

        {/* Phrase distribution */}
        <div className="ps-card" style={{ padding: 20 }}>
          <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Pattern distribution</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {categoryTrends.map((c) => {
              const totalPhrases = phrases.length || 1;
              const pct = Math.round((c.phrases / totalPhrases) * 100);
              return (
                <div key={c.id}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{c.label}</span>
                    <span style={{ fontSize: 12, color: "var(--faint)" }}>{c.phrases} patterns ({pct}%)</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: "var(--line-soft)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      borderRadius: 4,
                      width: `${pct}%`,
                      background: c.color,
                      transition: "width .6s ease",
                      minWidth: 4,
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </>
    );
  }

  /* ── Phrase detail modal ── */
  function renderPhraseModal() {
    if (!selectedPhrase) return null;
    const p = selectedPhrase;
    const cat = categoryMeta(p.category);
    const isWin = (p.win_correlation || 0) > 0;
    const conf = confidenceLabel(p.win_count, p.loss_count);
    const evidence = parseJSON(p.evidence_json);
    const total = (p.win_count || 0) + (p.loss_count || 0);

    return (
      <div className="ps-overlay" onClick={() => setSelectedPhrase(null)}>
        <div className="ps-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: cat.bg, color: cat.color, marginBottom: 8, display: "inline-block" }}>
                {cat.label}
              </span>
              <h3 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 18, margin: "8px 0 4px" }}>
                {p.phrase}
              </h3>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>
                Found in {total} call{total === 1 ? "" : "s"}
              </div>
            </div>
            <button className="ps-btn ghost sm" onClick={() => setSelectedPhrase(null)}><X size={16} /></button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div style={{ padding: 14, borderRadius: 10, background: isWin ? "#EDF9F2" : "#FDF2F2", border: `1px solid ${isWin ? "#B9E1CA" : "#F0C9CA"}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Associated with</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: isWin ? "#1A7F5B" : "#B23237" }}>
                {isWin ? "Wins" : "Losses"}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                {p.win_count || 0} wins · {p.loss_count || 0} losses
              </div>
            </div>
            <div style={{ padding: 14, borderRadius: 10, background: conf.bg, border: `1px solid ${conf.color}20` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Confidence</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: conf.color }}>{conf.label}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Based on {total} occurrences</div>
            </div>
          </div>

          {/* Evidence */}
          {evidence.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Evidence</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {evidence.slice(0, 10).map((id, idx) => (
                  <div key={idx} style={{ fontSize: 13, color: "var(--muted)", padding: "6px 10px", background: "#F8FAFC", borderRadius: 6 }}>
                    Script ID: {id}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, borderTop: "1px solid var(--line-soft)", paddingTop: 16 }}>
            <button
              className="ps-btn pri"
              onClick={() => {
                /* Could navigate to practice with this phrase */
                console.warn("Practice module integration: not yet implemented");
              }}
            >
              <Target size={16} style={{ marginRight: 6 }} />
              Practice this
            </button>
            <button className="ps-btn ghost" onClick={() => setSelectedPhrase(null)}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Import modal (secondary) ── */
  function renderImportModal() {
    if (!showImport) return null;
    return (
      <div className="ps-overlay" onClick={() => setShowImport(false)}>
        <div className="ps-modal" onClick={(e) => e.stopPropagation()}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h3 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 18 }}>Import transcripts</h3>
            <button className="ps-btn ghost sm" onClick={() => setShowImport(false)}><X size={16} /></button>
          </div>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12, lineHeight: 1.5 }}>
            Paste call transcripts to analyze phrases manually. For best results, use the automatic analysis which consumes your existing Call Studio data.
          </p>
          <LimitedTextarea
            className="ftext"
            rows={6}
            placeholder="Paste transcripts here, one per line..."
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            maxLength={10000}
            style={{ marginBottom: 12 }}
          />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button className="ps-btn ghost" onClick={() => setShowImport(false)}>Cancel</button>
            <button className="ps-btn pri" onClick={handleImportTranscripts} disabled={importing || !importText.trim()}>
              {importing ? "Analyzing..." : "Analyze transcripts"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main render ── */
  return (
    <div className="ps-container">
      <div className="ps-top">
        <div>
          <div className="ps-eyebrow">Intelligence</div>
          <div className="ps-title"><Activity size={22} style={{ marginRight: 8, verticalAlign: "-3px" }} />Conversation Intelligence</div>
          <div className="ps-sub">Discover which phrases and approaches correlate with wins and losses.</div>
        </div>
      </div>

      {/* Global error */}
      {error && (
        <div style={{
          marginBottom: 16,
          padding: "12px 16px",
          borderRadius: 10,
          background: "#FDF2F2",
          border: "1px solid #F0C9CA",
          color: "#B23237",
          fontSize: 13,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <AlertTriangle size={16} />
          {error}
          <button
            className="ps-btn ghost sm"
            style={{ marginLeft: "auto" }}
            onClick={() => setError("")}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="pd-tabs" style={{ marginBottom: 24 }}>
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              className={`pd-tab ${tab === t.id ? "on" : ""}`}
              onClick={() => setTab(t.id)}
            >
              <Icon size={14} style={{ marginRight: 6, verticalAlign: "-2px" }} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "overview" && renderOverview()}
      {tab === "phrases" && renderPhrases()}
      {tab === "calls" && renderCalls()}
      {tab === "trends" && renderTrends()}

      {renderPhraseModal()}
      {renderImportModal()}
    </div>
  );
}
