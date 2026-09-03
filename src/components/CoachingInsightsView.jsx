import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import LimitedInput from "./shared/LimitedInput.jsx";
import LimitedTextarea from "./shared/LimitedTextarea.jsx";
import { useOutsideClick, useDropdownPos } from "./shared/DropdownHooks.js";
import {
  listCoachingInsights,
  generateCoachingInsight,
  deleteCoachingInsight,
  listScripts,
} from "../api/client.js";
import {
  Sparkles,
  TrendingUp,
  Target,
  Trophy,
  ArrowRight,
  RotateCcw,
  ChevronRight,
  Mic,
  FileText,
  BarChart3,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  X,
  Trash2,
  Zap,
  Search, LayoutGrid, List, SlidersHorizontal, ChevronLeft, MoreHorizontal, Eye,
} from "lucide-react";

/* ============================================================
   AI Coaching Insights — Command Center
   Overview + Analyze + Session Detail
   ============================================================ */

const CI_STORAGE = "ps_coaching_sessions";

function loadSessions() {
  try {
    const raw = localStorage.getItem(CI_STORAGE);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveSessions(list) {
  try { localStorage.setItem(CI_STORAGE, JSON.stringify(list.slice(0, 100))); } catch {}
}

function parseJSON(val) {
  try { return JSON.parse(val || "[]"); } catch { return []; }
}

function normalizeArray(val) {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return []; }
  }
  return [];
}

function scoreColor(s) {
  if (s >= 80) return "#1A7F5B";
  if (s >= 60) return "#B5720F";
  return "#B23237";
}

function scoreGrade(s) {
  if (s >= 85) return "Excellent";
  if (s >= 70) return "Good";
  if (s >= 55) return "Fair";
  return "Needs work";
}

function skillLabel(key) {
  const map = {
    discovery: "Discovery",
    questioning: "Questioning",
    listening: "Listening",
    painIdentification: "Pain ID",
    valuePositioning: "Value Pitch",
    objectionHandling: "Objections",
    closing: "Closing",
  };
  return map[key] || key;
}

function avg(arr) {
  if (!arr.length) return 0;
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}

export default function CoachingInsightsView() {
  const [mode, setMode] = useState("overview");
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [analyzeStep, setAnalyzeStep] = useState(0);

  /* Analyze form */
  const [analyzeTab, setAnalyzeTab] = useState("manual");
  const [transcriptInput, setTranscriptInput] = useState("");
  const [analysisType, setAnalysisType] = useState("call");
  const [savedScripts, setSavedScripts] = useState([]);
  const [practiceHistory, setPracticeHistory] = useState([]);
  const [scriptsLoading, setScriptsLoading] = useState(false);

  /* Toolbar state */
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRef = useRef(null);
  const dropdownBtnRef = useRef(null);
  const dropdownPos = useDropdownPos(dropdownBtnRef, !!activeDropdown);

  const closeDropdown = useCallback(() => setActiveDropdown(null), []);
  useOutsideClick(dropdownRef, closeDropdown);

  /* Refs for cleanup */
  const abortRef = useRef(false);

  /* ── Load sessions ── */
  useEffect(() => {
    loadSessionsData();
  }, []);

  async function loadSessionsData() {
    setLoading(true);
    try {
      const apiRows = await listCoachingInsights();
      const local = loadSessions();
      const merged = mergeSessions(apiRows || [], local);
      setSessions(merged);
    } catch (e) {
      console.error(e);
      const local = loadSessions();
      setSessions(local);
    } finally {
      setLoading(false);
    }
  }

  function mergeSessions(apiRows, local) {
    const map = new Map();
    local.forEach((s) => map.set(s.id, s));
    apiRows.forEach((api) => {
      const existing = map.get(api.id);
      if (existing) {
        map.set(api.id, { ...existing, ...api, raw_data: existing.raw_data || api.raw_data });
      } else {
        map.set(api.id, { ...api });
      }
    });
    return Array.from(map.values()).map((s) => ({
      ...s,
      strengths: normalizeArray(s.strengths),
      improvements: normalizeArray(s.improvements),
      exact_moments: normalizeArray(s.exact_moments),
      recommended_practice: normalizeArray(s.recommended_practice),
    })).sort((a, b) => {
      const da = new Date(b.created_at || 0).getTime();
      const db = new Date(a.created_at || 0).getTime();
      return da - db;
    });
  }

  /* ── Load import sources ── */
  useEffect(() => {
    if (mode !== "analyze") return;
    if (analyzeTab === "scripts") loadSavedScripts();
    if (analyzeTab === "practice") loadPracticeHistory();
  }, [mode, analyzeTab]);

  async function loadSavedScripts() {
    setScriptsLoading(true);
    try {
      const rows = await listScripts();
      setSavedScripts(rows || []);
    } catch { setSavedScripts([]); }
    setScriptsLoading(false);
  }

  function loadPracticeHistory() {
    try {
      const raw = localStorage.getItem("ps_practice_history");
      setPracticeHistory(raw ? JSON.parse(raw).slice(0, 20) : []);
    } catch { setPracticeHistory([]); }
  }

  /* ── Generate insight ── */
  async function handleGenerate(sourceTranscript, type = "call", title = "Manual transcript") {
    if (!sourceTranscript.trim()) return;
    setGenerating(true);
    setError("");
    setAnalyzeStep(0);
    abortRef.current = false;

    const stepTimer = setInterval(() => {
      setAnalyzeStep((s) => (s < 3 ? s + 1 : s));
    }, 900);

    try {
      const res = await generateCoachingInsight({ transcript: sourceTranscript, type });
      clearInterval(stepTimer);
      if (abortRef.current) return;

      const raw = res.generated || res.insight?.raw_data || {};
      const session = {
        id: res.insight?.id || Date.now(),
        title,
        type,
        product_name: res.insight?.product_name || "",
        overall_score: raw.overall_score || res.insight?.overall_score || 0,
        skill_scores: raw.skill_scores || {
          discovery: res.insight?.discovery_score || 0,
          questioning: res.insight?.rapport_score || 0,
          listening: res.insight?.rapport_score || 0,
          painIdentification: 0,
          valuePositioning: 0,
          objectionHandling: res.insight?.objection_score || 0,
          closing: res.insight?.closing_score || 0,
        },
        strengths: normalizeArray(raw.strengths || res.insight?.strengths),
        improvements: normalizeArray(raw.improvements || res.insight?.improvements),
        exact_moments: normalizeArray(raw.exact_moments),
        recommended_practice: normalizeArray(raw.recommended_practice),
        ai_summary: raw.ai_summary || res.insight?.ai_summary || "",
        transcript: sourceTranscript,
        created_at: res.insight?.created_at || new Date().toISOString(),
        raw_data: raw,
      };

      setSessions((prev) => {
        const next = [session, ...prev];
        saveSessions(next);
        return next;
      });
      setSelectedSession(session);
      setMode("detail");
      setTranscriptInput("");
    } catch (e) {
      clearInterval(stepTimer);
      setError("Analysis failed: " + (e.message || "try again"));
    } finally {
      setGenerating(false);
      setAnalyzeStep(0);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this coaching session?")) return;
    try {
      await deleteCoachingInsight(id);
      setSessions((prev) => {
        const next = prev.filter((s) => s.id !== id);
        saveSessions(next);
        return next;
      });
      if (selectedSession?.id === id) {
        setSelectedSession(null);
        setMode("overview");
      }
    } catch (e) {
      console.error(e);
    }
  }

  /* ── Derived stats ── */
  const stats = useMemo(() => {
    if (!sessions.length) return null;
    const scores = sessions.map((s) => s.overall_score || 0).filter(Boolean);
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    const skillMap = {};
    sessions.forEach((s) => {
      if (!s.skill_scores) return;
      Object.entries(s.skill_scores).forEach(([k, v]) => {
        if (!skillMap[k]) skillMap[k] = [];
        skillMap[k].push(v);
      });
    });
    const skillAvgs = Object.entries(skillMap).map(([k, vals]) => ({
      key: k,
      label: skillLabel(k),
      avg: avg(vals),
    }));
    const bestSkill = skillAvgs.length ? skillAvgs.sort((a, b) => b.avg - a.avg)[0] : null;
    const focusSkill = skillAvgs.length ? skillAvgs.sort((a, b) => a.avg - b.avg)[0] : null;

    return { sessions: sessions.length, avgScore, bestSkill, focusSkill, skillAvgs };
  }, [sessions]);

  /* ── Filtered sessions + pagination ── */
  const filteredSessions = useMemo(() => {
    let list = [...sessions];
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((s) =>
        (s.title || "").toLowerCase().includes(q) ||
        (s.product_name || "").toLowerCase().includes(q) ||
        (s.ai_summary || "").toLowerCase().includes(q)
      );
    }
    if (typeFilter !== "all") {
      list = list.filter((s) => s.type === typeFilter);
    }
    return list;
  }, [sessions, searchQuery, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredSessions.length / pageSize));
  const paginated = filteredSessions.slice((page - 1) * pageSize, page * pageSize);

  /* ── Helpers ── */
  const typeBadge = (type) => {
    if (type === "call") return { cls: "ok", label: "Live Call" };
    if (type === "roleplay") return { cls: "accent", label: "Role-play" };
    if (type === "practice") return { cls: "warn", label: "Practice" };
    return { cls: "neu", label: type || "Session" };
  };

  /* ── Render ── */
  return (
    <>
      {/* Header */}
      <div className="ps-top">
        <div>
          <div className="ps-eyebrow">Insights</div>
          <div className="ps-title">AI Coaching</div>
          <div className="ps-sub">Personalized feedback from your calls, roleplays and practice.</div>
        </div>
        {mode === "overview" && (
          <button className="ps-btn pri" onClick={() => { setMode("analyze"); setError(""); }}>
            <Sparkles size={15} /> Analyze Session
          </button>
        )}
        {mode !== "overview" && (
          <button className="ps-btn ghost" onClick={() => { setMode("overview"); setSelectedSession(null); }}>
            ← Back to overview
          </button>
        )}
      </div>

      <div className="ps-body">
        {/* ===== OVERVIEW ===== */}
        {mode === "overview" && (
          <>
            {sessions.length === 0 ? (
              <div className="ps-empty" style={{ padding: 72 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
                <div className="big">No coaching insights yet</div>
                <p style={{ maxWidth: 420 }}>
                  Analyze your first call or roleplay to see what you're doing well and where to improve.
                </p>
                <button className="ps-btn pri" onClick={() => setMode("analyze")} style={{ marginTop: 8 }}>
                  <Sparkles size={15} /> Analyze a Session
                </button>
                <div style={{ marginTop: 28, display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", maxWidth: 640, margin: "28px auto 0" }}>
                  {[
                    { icon: BarChart3, label: "Conversation Score", desc: "Overall performance rating" },
                    { icon: CheckCircle2, label: "Strengths", desc: "What you did well" },
                    { icon: AlertTriangle, label: "Missed Opportunities", desc: "Where the deal slipped" },
                    { icon: Target, label: "Objection Handling", desc: "How you handled pushback" },
                    { icon: Lightbulb, label: "Better Responses", desc: "Exact wording to try next time" },
                    { icon: Zap, label: "Recommended Practice", desc: "Drills tailored to your gaps" },
                  ].map((f) => (
                    <div key={f.label} style={{ textAlign: "left", padding: 14, background: "#F6F8FB", borderRadius: 10, border: "1px solid var(--line-soft)" }}>
                      <f.icon size={18} style={{ color: "var(--accent)", marginBottom: 6 }} />
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{f.label}</div>
                      <div style={{ fontSize: 12, color: "var(--faint)" }}>{f.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* KPI bar */}
                {stats && (
                  <div className="ci-kpi-bar">
                    <div className="ci-kpi">
                      <div className="ci-icon"><BarChart3 size={18} /></div>
                      <div className="ci-body">
                        <div className="ci-kpi-label">Sessions</div>
                        <div className="ci-kpi-value">{stats.sessions}</div>
                      </div>
                    </div>
                    <div className={`ci-kpi ${stats.avgScore >= 80 ? "ok" : stats.avgScore >= 60 ? "warn" : "bad"}`}>
                      <div className="ci-icon"><TrendingUp size={18} /></div>
                      <div className="ci-body">
                        <div className="ci-kpi-label">Avg Score</div>
                        <div className="ci-kpi-value" style={{ color: scoreColor(stats.avgScore) }}>{stats.avgScore}%</div>
                      </div>
                    </div>
                    <div className="ci-kpi ok">
                      <div className="ci-icon"><Trophy size={18} /></div>
                      <div className="ci-body">
                        <div className="ci-kpi-label">Best Skill</div>
                        <div className="ci-kpi-value" style={{ color: scoreColor(stats.bestSkill?.avg || 0) }}>{stats.bestSkill?.label || "—"}</div>
                        <div className="ci-kpi-sublabel">{stats.bestSkill?.avg || 0}% avg</div>
                      </div>
                    </div>
                    <div className={`ci-kpi ${(stats.focusSkill?.avg || 0) >= 80 ? "ok" : (stats.focusSkill?.avg || 0) >= 60 ? "warn" : "bad"}`}>
                      <div className="ci-icon"><Target size={18} /></div>
                      <div className="ci-body">
                        <div className="ci-kpi-label">Focus Area</div>
                        <div className="ci-kpi-value" style={{ color: scoreColor(stats.focusSkill?.avg || 0) }}>{stats.focusSkill?.label || "—"}</div>
                        <div className="ci-kpi-sublabel">{stats.focusSkill?.avg || 0}% avg</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Skill performance */}
                {stats?.skillAvgs?.length > 0 && (
                  <div className="ps-card" style={{ marginBottom: 20 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                      <TrendingUp size={16} /> Performance by Skill
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {stats.skillAvgs.map((s) => (
                        <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                          <div style={{ width: 130, fontSize: 13, fontWeight: 600, textAlign: "right", flexShrink: 0 }}>
                            {s.label}
                          </div>
                          <div style={{ flex: 1, height: 10, background: "var(--line-soft)", borderRadius: 5, overflow: "hidden" }}>
                            <div
                              style={{
                                width: `${Math.min(100, s.avg)}%`,
                                height: "100%",
                                background: scoreColor(s.avg),
                                borderRadius: 5,
                                transition: "width .6s ease",
                              }}
                            />
                          </div>
                          <div style={{ width: 40, fontSize: 13, fontWeight: 700, color: scoreColor(s.avg), flexShrink: 0 }}>
                            {s.avg}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Toolbar */}
                <div className="dt-header">
                  <div className="dt-search">
                    <Search size={15} className="dt-search-icon" />
                    <input placeholder="Search sessions…" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }} />
                    {searchQuery && <button className="dt-search-clear" onClick={() => { setSearchQuery(""); setPage(1); }}><X size={13} /></button>}
                  </div>
                  <button className={`dt-filter-btn ${typeFilter !== "all" ? "on" : ""}`} onClick={() => setShowFilters((s) => !s)}>
                    <SlidersHorizontal size={14} /> Filters {typeFilter !== "all" && <span className="count">1</span>}
                  </button>
                  <div className="dt-view-toggle">
                    <button className={viewMode === "list" ? "on" : ""} onClick={() => setViewMode("list")} title="List"><List size={14} /> List</button>
                    <button className={viewMode === "cards" ? "on" : ""} onClick={() => setViewMode("cards")} title="Cards"><LayoutGrid size={14} /> Cards</button>
                  </div>
                </div>

                {showFilters && (
                  <div className="dt-filter-panel" style={{ marginBottom: 14 }}>
                    <div className="dt-filter-group">
                      <label>Type</label>
                      <select className="fsel" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
                        <option value="all">All types</option>
                        <option value="call">Live Call</option>
                        <option value="roleplay">Role-play</option>
                        <option value="practice">Practice</option>
                      </select>
                    </div>
                    <div className="dt-filter-actions">
                      <button className="ps-btn ghost sm" onClick={() => { setTypeFilter("all"); setPage(1); }}><X size={14} /> Clear</button>
                      <button className="ps-btn pri sm" onClick={() => setShowFilters(false)}>Done</button>
                    </div>
                  </div>
                )}

                {/* Card view */}
                {viewMode === "cards" && (
                  <div className="epc-grid" style={{ marginBottom: 20 }}>
                    {paginated.map((s) => {
                      const badge = typeBadge(s.type);
                      return (
                        <div key={s.id} className="epc-card" onClick={() => { setSelectedSession(s); setMode("detail"); }}>
                          <div className="epc-top">
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="epc-name">{s.title || s.product_name || "Coaching Session"}</div>
                              <div className="epc-desc">{s.ai_summary?.slice(0, 120) || "No summary available"}{s.ai_summary && s.ai_summary.length > 120 ? "…" : ""}</div>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                              <span className={`ds-status ${badge.cls}`}><span className="ds-status-dot" />{badge.label}</span>
                              <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 22, color: scoreColor(s.overall_score || 0) }}>
                                {s.overall_score || "—"}
                              </div>
                            </div>
                          </div>
                          <div className="epc-meta">
                            <div className="epc-meta-item"><b>Date:</b> {new Date(s.created_at).toLocaleDateString()}</div>
                            <div className="epc-meta-item"><b>Grade:</b> {scoreGrade(s.overall_score || 0)}</div>
                          </div>
                          <div className="epc-actions">
                            <button className="epc-act-open" onClick={(e) => { e.stopPropagation(); setSelectedSession(s); setMode("detail"); }}><Eye size={13} /> Open</button>
                            <button className="epc-act-del" onClick={(e) => { e.stopPropagation(); if (confirm("Delete this coaching session?")) handleDelete(s.id); }}><Trash2 size={13} /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Table view */}
                {viewMode === "list" && (
                  <>
                    <div className="dt-table-wrap">
                      <table className="dt-table">
                        <thead>
                          <tr>
                            <th style={{ width: "36%" }}>Session</th>
                            <th style={{ width: "14%" }}>Type</th>
                            <th style={{ width: "12%" }}>Score</th>
                            <th style={{ width: "12%" }}>Grade</th>
                            <th style={{ width: "14%" }}>Date</th>
                            <th style={{ width: "8%" }} />
                          </tr>
                        </thead>
                        <tbody>
                          {paginated.map((s) => {
                            const badge = typeBadge(s.type);
                            return (
                              <tr key={s.id} style={{ cursor: "pointer" }} onClick={() => { setSelectedSession(s); setMode("detail"); }}>
                                <td>
                                  <div className="dt-script-name">{s.title || s.product_name || "Coaching Session"}</div>
                                  <div className="dt-script-meta">{s.ai_summary?.slice(0, 80) || "No summary"}{s.ai_summary && s.ai_summary.length > 80 ? "…" : ""}</div>
                                </td>
                                <td><span className={`ds-status ${badge.cls}`}><span className="ds-status-dot" />{badge.label}</span></td>
                                <td>
                                  <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 15, color: scoreColor(s.overall_score || 0) }}>
                                    {s.overall_score || "—"}
                                  </span>
                                </td>
                                <td>
                                  <span className={`ds-status ${(s.overall_score || 0) >= 80 ? "ok" : (s.overall_score || 0) >= 60 ? "warn" : "bad"}`}>
                                    <span className="ds-status-dot" />{scoreGrade(s.overall_score || 0)}
                                  </span>
                                </td>
                                <td style={{ whiteSpace: "nowrap", fontSize: 12.5, color: "var(--muted)" }}>{new Date(s.created_at).toLocaleDateString()}</td>
                                <td onClick={(e) => e.stopPropagation()}>
                                  <div className="dt-actions" ref={activeDropdown === s.id ? dropdownRef : null}>
                                    <button ref={activeDropdown === s.id ? dropdownBtnRef : null} className="dt-more-btn" onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === s.id ? null : s.id); }}>
                                      <MoreHorizontal size={16} />
                                    </button>
                                    {activeDropdown === s.id && dropdownPos && (
                                      <div className="dt-dropdown" style={dropdownPos}>
                                        <button className="dt-dropdown-item" onClick={() => { setSelectedSession(s); setMode("detail"); setActiveDropdown(null); }}><Eye size={14} /> Open</button>
                                        <button className="dt-dropdown-item danger" onClick={() => { if (confirm("Delete this coaching session?")) handleDelete(s.id); setActiveDropdown(null); }}><Trash2 size={14} /> Delete</button>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {filteredSessions.length > pageSize && (
                      <div className="ds-pagination">
                        <span className="ds-pagination-info">Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredSessions.length)} of {filteredSessions.length}</span>
                        <div className="ds-pagination-actions">
                          <button className="ds-btn-ico" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}><ChevronLeft size={16} /></button>
                          <span className="ds-pagination-pages">Page {page} of {totalPages}</span>
                          <button className="ds-btn-ico" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}><ChevronRight size={16} /></button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}

        {/* ===== ANALYZE ===== */}
        {mode === "analyze" && (
          <div className="ps-card" style={{ maxWidth: 800, margin: "0 auto", padding: "28px 32px" }}>
            <div style={{ textAlign: "center", marginBottom: 6 }}>
              <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 20, marginBottom: 6 }}>Analyze a Session</div>
              <div style={{ fontSize: 14, color: "var(--muted)", maxWidth: 480, margin: "0 auto", lineHeight: 1.55 }}>
                Paste a transcript or import from your saved scripts and practice history. AI will score every skill and give you actionable feedback.
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 0, marginBottom: 24, marginTop: 24, borderBottom: "1.5px solid var(--line-soft)", justifyContent: "center" }}>
              {[
                { id: "manual", label: "Paste transcript", icon: FileText },
                { id: "scripts", label: "Call Studio scripts", icon: BookOpen },
                { id: "practice", label: "Practice history", icon: Target },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setAnalyzeTab(t.id)}
                  style={{
                    padding: "10px 18px",
                    fontSize: 13,
                    fontWeight: 600,
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: analyzeTab === t.id ? "var(--accent)" : "var(--muted)",
                    borderBottom: analyzeTab === t.id ? "2.5px solid var(--accent)" : "2.5px solid transparent",
                    marginBottom: -1.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                  }}
                >
                  <t.icon size={14} /> {t.label}
                </button>
              ))}
            </div>

            {/* Manual transcript */}
            {analyzeTab === "manual" && (
              <>
                <div className="frow" style={{ marginBottom: 16 }}>
                  <label className="flab">Session type<span className="req">*</span></label>
                  <div className="pill-row">
                    {[
                      { id: "call", label: "Live Call" },
                      { id: "roleplay", label: "Role-play" },
                      { id: "practice", label: "Practice" },
                    ].map((t) => (
                      <button
                        key={t.id}
                        className={`pill ${analysisType === t.id ? "on" : ""}`}
                        onClick={() => setAnalysisType(t.id)}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label className="flab">Transcript<span className="req">*</span></label>
                  <LimitedTextarea
                    className="finp"
                    style={{ minHeight: 280, resize: "vertical", width: "100%", fontSize: 14, lineHeight: 1.6 }}
                    placeholder="Paste your call or roleplay transcript here…

Salesperson: Hello, how are you today?
Prospect: I'm good, just busy with quarter-end.
Salesperson: I understand — that's exactly why I called…"
                    value={transcriptInput}
                    onChange={(e) => setTranscriptInput(e.target.value)}
                    maxLength={10000}
                  />
                  <div className="fhint" style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                    <span>{transcriptInput.length.toLocaleString()} characters</span>
                    <span>Paste conversation with speaker labels for best results</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "center" }}>
                  <button
                    className="ps-btn pri"
                    disabled={!transcriptInput.trim() || generating}
                    onClick={() => handleGenerate(transcriptInput, analysisType, "Manual transcript")}
                    style={{ padding: "12px 28px", fontSize: 14 }}
                  >
                    {generating ? (
                      <>
                        <span className="spinner" /> Analyzing transcript…
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} /> Analyze & Generate Insights
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {/* Import from scripts */}
            {analyzeTab === "scripts" && (
              <>
                {scriptsLoading ? (
                  <div className="loading-box" style={{ padding: 40 }}>
                    <span className="spinner dark" />
                    <div className="msg">Loading saved scripts…</div>
                  </div>
                ) : savedScripts.length === 0 ? (
                  <div className="ps-empty" style={{ padding: 48 }}>
                    <BookOpen size={36} style={{ color: "var(--faint)", marginBottom: 14 }} />
                    <div className="big">No saved scripts</div>
                    <p>Generate a script in Call Studio first, then analyze it here.</p>
                    <button className="ps-btn ghost" style={{ marginTop: 8 }} onClick={() => { /* navigate to scripts */ }}>
                      Go to Call Studio →
                    </button>
                  </div>
                ) : (
                  <div className="ps-grid" style={{ marginBottom: 10 }}>
                    {savedScripts.map((s) => (
                      <div
                        key={s.id}
                        className="pcard"
                        onClick={() => {
                          const transcript = [
                            `Script: ${s.product_name || "Product"}`,
                            `Opening: ${s.data?.opening || ""}`,
                            "",
                            ...(s.data?.segments?.flatMap((seg, i) => [
                              `Segment ${i + 1}: ${seg.label || ""}`,
                              ...(seg.say?.map((line) => `Rep: ${line}`) || []),
                              ...(seg.ask?.map((line) => `Rep (question): ${line}`) || []),
                              ...(seg.do?.map((line) => `Coach: ${line}`) || []),
                              "",
                            ]) || []),
                            ...(s.data?.objections?.flatMap((o) => [
                              `Objection: ${o.objection}`,
                              `Response: ${o.response}`,
                              "",
                            ]) || []),
                          ].join("\n");
                          handleGenerate(transcript, "call", s.product_name || "Script analysis");
                        }}
                      >
                        <div className="cat">{s.product_name || "Product"}</div>
                        <div className="nm">Script analysis</div>
                        <div className="ln">
                          {s.data?.opening?.slice(0, 80) || ""}…
                        </div>
                        <div className="foot">
                          <span>Analyze as transcript →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Import from practice */}
            {analyzeTab === "practice" && (
              <>
                {practiceHistory.length === 0 ? (
                  <div className="ps-empty" style={{ padding: 48 }}>
                    <Target size={36} style={{ color: "var(--faint)", marginBottom: 14 }} />
                    <div className="big">No practice history</div>
                    <p>Complete a practice session in Objection Drill first, then analyze it here.</p>
                    <button className="ps-btn ghost" style={{ marginTop: 8 }}>
                      Go to Practice →
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {practiceHistory.slice(0, 20).map((h, i) => (
                      <div
                        key={h.id || i}
                        className="lib-row"
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          const transcript = [
                            `Practice session: ${h.product || "Product"}`,
                            "",
                            `Buyer objection: "${h.buyerLine}"`,
                            "",
                            `Rep response: "${h.response}"`,
                            "",
                            `Scores: Confidence ${h.scores.confidence}, Coverage ${h.scores.coverage}, Tone ${h.scores.tone}`,
                            "",
                            `Feedback: ${h.feedback || ""}`,
                            `Strength: ${h.strength || ""}`,
                            `Improvement: ${h.improvement || ""}`,
                          ].join("\n");
                          handleGenerate(transcript, "practice", `${h.product || "Practice"} drill`);
                        }}
                      >
                        <div className="ph-info" style={{ flex: 1 }}>
                          <div className="ph-prod">{h.product || "Practice"}</div>
                          <div className="ph-line">Buyer: “{h.buyerLine.slice(0, 100)}…”</div>
                        </div>
                        <div className="ph-score" style={{ color: scoreColor(avg([h.scores.confidence, h.scores.coverage, h.scores.tone])) }}>
                          {avg([h.scores.confidence, h.scores.coverage, h.scores.tone])}
                        </div>
                        <ChevronRight size={16} color="var(--faint)" />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {error && <div className="err" style={{ marginTop: 18 }}>{error}</div>}

            {/* Loading steps */}
            {generating && (
              <div style={{ marginTop: 24, padding: 20, background: "#F6F8FB", borderRadius: 12, border: "1px solid var(--line-soft)", maxWidth: 480, margin: "24px auto 0" }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, textAlign: "center" }}>Analyzing conversation…</div>
                {[
                  "Understanding context",
                  "Evaluating discovery & questioning",
                  "Checking objections & closing",
                  "Generating coaching insights",
                ].map((step, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", fontSize: 13, color: i <= analyzeStep ? "var(--ink)" : "var(--faint)" }}>
                    <span style={{ width: 20, display: "inline-flex", justifyContent: "center" }}>
                      {i < analyzeStep ? (
                        <CheckCircle2 size={14} style={{ color: "#1A7F5B" }} />
                      ) : i === analyzeStep ? (
                        <span className="spinner dark" style={{ width: 12, height: 12 }} />
                      ) : (
                        <span style={{ color: "var(--faint)" }}>○</span>
                      )}
                    </span>
                    {step}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== DETAIL ===== */}
        {mode === "detail" && selectedSession && (
          <>
            {/* Score header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                padding: "20px 22px",
                background: `${scoreColor(selectedSession.overall_score || 0)}08`,
                border: `1.5px solid ${scoreColor(selectedSession.overall_score || 0)}25`,
                borderRadius: 14,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: scoreColor(selectedSession.overall_score || 0),
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'Space Grotesk'",
                  fontWeight: 700,
                  fontSize: 24,
                  flexShrink: 0,
                }}
              >
                {selectedSession.overall_score || "—"}
              </div>
              <div>
                <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 18, color: scoreColor(selectedSession.overall_score || 0) }}>
                  {scoreGrade(selectedSession.overall_score || 0)}
                </div>
                <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 3 }}>
                  {selectedSession.title || selectedSession.product_name || "Coaching Session"} ·{" "}
                  {selectedSession.type} · {new Date(selectedSession.created_at).toLocaleDateString()}
                </div>
              </div>
              <button
                className="ps-btn ghost sm"
                style={{ marginLeft: "auto" }}
                onClick={() => handleDelete(selectedSession.id)}
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>

            {/* Skill bars */}
            {selectedSession.skill_scores && (
              <div className="ps-card" style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Skill Scores</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {Object.entries(selectedSession.skill_scores).map(([k, v]) => (
                    <div key={k} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ width: 130, fontSize: 13, fontWeight: 600, textAlign: "right", flexShrink: 0 }}>
                        {skillLabel(k)}
                      </div>
                      <div style={{ flex: 1, height: 10, background: "var(--line-soft)", borderRadius: 5, overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${Math.min(100, v)}%`,
                            height: "100%",
                            background: scoreColor(v),
                            borderRadius: 5,
                            transition: "width .6s ease",
                          }}
                        />
                      </div>
                      <div style={{ width: 40, fontSize: 13, fontWeight: 700, color: scoreColor(v), flexShrink: 0 }}>
                        {v}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Summary */}
            {selectedSession.ai_summary && (
              <div
                className="ps-card"
                style={{
                  marginBottom: 20,
                  background: "var(--accent-bg)",
                  borderColor: "#C4D0F9",
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, display: "flex", alignItems: "center", gap: 8, color: "var(--accent-ink)" }}>
                  <Lightbulb size={16} /> Coach Summary
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.65, color: "var(--ink)" }}>
                  {selectedSession.ai_summary}
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              {/* Strengths */}
              {normalizeArray(selectedSession.strengths).length > 0 && (
                <div
                  style={{
                    background: "#EDF9F2",
                    border: "1.5px solid #B9E1CA",
                    borderRadius: 12,
                    padding: "16px 18px",
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#1A7F5B", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                    <CheckCircle2 size={16} /> What you did well
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.6, color: "var(--ink)" }}>
                    {normalizeArray(selectedSession.strengths).map((s, i) => (
                      <li key={i} style={{ marginBottom: 6 }}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improvements */}
              {normalizeArray(selectedSession.improvements).length > 0 && (
                <div
                  style={{
                    background: "#FBF1DE",
                    border: "1.5px solid #F0D9A6",
                    borderRadius: 12,
                    padding: "16px 18px",
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#9A5B08", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                    <AlertTriangle size={16} /> Missed opportunities
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.6, color: "var(--ink)" }}>
                    {normalizeArray(selectedSession.improvements).map((s, i) => (
                      <li key={i} style={{ marginBottom: 6 }}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Exact moments */}
            {normalizeArray(selectedSession.exact_moments).length > 0 && (
              <div className="ps-card" style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                  <Zap size={16} /> Exact Moments
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {normalizeArray(selectedSession.exact_moments).map((m, i) => (
                    <div
                      key={i}
                      style={{
                        padding: 14,
                        background: "#F6F8FB",
                        borderRadius: 10,
                        border: "1px solid var(--line-soft)",
                        fontSize: 13.5,
                        lineHeight: 1.65,
                      }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: 6, color: "var(--accent-ink)", fontSize: 13 }}>
                        💬 Context:
                      </div>
                      <div style={{ fontStyle: "italic", color: "var(--muted)", marginBottom: 10 }}>
                        “{m.context}”
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#B23237", marginBottom: 4 }}>
                            What you did
                          </div>
                          <div>{m.whatYouDid}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#1A7F5B", marginBottom: 4 }}>
                            Better approach
                          </div>
                          <div>{m.whatYouShouldHaveDone}</div>
                        </div>
                      </div>
                      {m.betterResponse && (
                        <div
                          style={{
                            marginTop: 10,
                            padding: "10px 12px",
                            background: "#E8F6EF",
                            borderRadius: 8,
                            borderLeft: "3px solid #12A374",
                            fontWeight: 500,
                            color: "#0A3F30",
                          }}
                        >
                          “{m.betterResponse}”
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended practice */}
            {normalizeArray(selectedSession.recommended_practice).length > 0 && (
              <div className="ps-card" style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                  <Target size={16} /> Recommended Practice
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {normalizeArray(selectedSession.recommended_practice).map((rp, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "12px 14px",
                        background: "var(--accent-bg)",
                        borderRadius: 10,
                        border: "1px solid #C4D0F9",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "var(--accent-ink)", marginBottom: 3 }}>
                          {rp.label}
                        </div>
                        <div style={{ fontSize: 13, color: "var(--muted)" }}>
                          {rp.weakness}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transcript toggle */}
            {selectedSession.transcript && (
              <div className="ps-card" style={{ marginBottom: 20 }}>
                <details>
                  <summary style={{ fontWeight: 700, fontSize: 14, cursor: "pointer", color: "var(--ink)" }}>
                    📝 View transcript
                  </summary>
                  <div
                    style={{
                      marginTop: 12,
                      padding: 14,
                      background: "#F6F8FB",
                      borderRadius: 10,
                      fontSize: 13,
                      lineHeight: 1.65,
                      color: "var(--muted)",
                      whiteSpace: "pre-wrap",
                      maxHeight: 400,
                      overflow: "auto",
                    }}
                  >
                    {selectedSession.transcript}
                  </div>
                </details>
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="ps-btn pri"
                onClick={() => { setMode("analyze"); setSelectedSession(null); }}
              >
                <Sparkles size={15} /> Analyze another session
              </button>
              <button
                className="ps-btn ghost"
                onClick={() => { setMode("overview"); setSelectedSession(null); }}
              >
                Back to overview
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
