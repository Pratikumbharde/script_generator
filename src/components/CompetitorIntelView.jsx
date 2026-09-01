import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  listCompetitors,
  createCompetitor,
  deleteCompetitor,
  analyzeCompetitor,
  listCompetitorIntel,
  listProducts,
} from "../api/client.js";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Target,
  Swords,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Globe,
  Plus,
  X,
  ArrowRight,
  BookOpen,
  FileText,
  Trash2,
  ChevronRight,
  Activity,
  ExternalLink,
  Sparkles,
  BarChart3,
  Lightbulb,
  Eye,
  Search, LayoutGrid, List, SlidersHorizontal, ChevronLeft, MoreHorizontal,
} from "lucide-react";
import LimitedInput from './shared/LimitedInput.jsx'
import LimitedTextarea from './shared/LimitedTextarea.jsx'
import { useOutsideClick, useDropdownPos } from './shared/DropdownHooks.js'

/* ============================================================
   Competitor Monitoring — Command Center
   Competitors → Monitor → Analyze → Battle Cards
   ============================================================ */

const THREAT_META = {
  high: { label: "High", color: "#B23237", bg: "#FDF2F2", border: "#F0C9CA", icon: ShieldAlert },
  medium: { label: "Medium", color: "#B5720F", bg: "#FBF1DE", border: "#F0D9A6", icon: Shield },
  low: { label: "Low", color: "#1A7F5B", bg: "#EDF9F2", border: "#B9E1CA", icon: ShieldCheck },
};

const SOURCE_LABELS = {
  website: "Website",
  pricing: "Pricing page",
  product: "Product page",
  blog: "Blog",
  changelog: "Changelog",
  news: "News",
  social: "Social",
  upload: "Upload",
  manual: "Manual",
};

function parseJSON(val) {
  try { return JSON.parse(val || "[]"); } catch { return []; }
}

function timeAgo(iso) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

export default function CompetitorIntelView() {
  const [mode, setMode] = useState("overview");
  const [selectedCompetitor, setSelectedCompetitor] = useState(null);
  const [competitors, setCompetitors] = useState([]);
  const [intel, setIntel] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* Toolbar state */
  const [searchQuery, setSearchQuery] = useState("");
  const [threatFilter, setThreatFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("cards");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRef = useRef(null);
  const dropdownBtnRef = useRef(null);
  const dropdownPos = useDropdownPos(dropdownBtnRef, !!activeDropdown);

  const closeDropdown = useCallback(() => setActiveDropdown(null), []);
  useOutsideClick(dropdownRef, closeDropdown);

  /* Add competitor modal */
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", category: "", website: "", product_id: "" });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  /* Analyze modal */
  const [showAnalyze, setShowAnalyze] = useState(false);
  const [analyzeComp, setAnalyzeComp] = useState(null);
  const [analyzeContent, setAnalyzeContent] = useState("");
  const [analyzeUrl, setAnalyzeUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeStep, setAnalyzeStep] = useState(0);
  const [analyzeError, setAnalyzeError] = useState("");

  /* Detail tab */
  const [detailTab, setDetailTab] = useState("overview");

  /* Load data */
  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [comps, prods] = await Promise.all([
        listCompetitors().catch(() => []),
        listProducts().catch(() => []),
      ]);
      setCompetitors(comps || []);
      setProducts(prods || []);
    } catch (e) {
      setError("Failed to load competitors");
    } finally {
      setLoading(false);
    }
  }

  async function loadIntel(cid) {
    try {
      const rows = await listCompetitorIntel(cid);
      setIntel(rows || []);
    } catch {
      setIntel([]);
    }
  }

  async function handleAddCompetitor() {
    if (!addForm.name.trim()) return;
    setAdding(true);
    setAddError("");
    try {
      const created = await createCompetitor({
        name: addForm.name.trim(),
        category: addForm.category || null,
        website: addForm.website || null,
        product_id: addForm.product_id ? parseInt(addForm.product_id) : null,
      });
      setCompetitors((prev) => [...prev, created]);
      setShowAdd(false);
      setAddForm({ name: "", category: "", website: "", product_id: "" });
      setSelectedCompetitor(created);
      setMode("detail");
      setDetailTab("overview");
    } catch (e) {
      setAddError("Failed to add competitor: " + (e.message || "try again"));
    } finally {
      setAdding(false);
    }
  }

  async function handleDeleteCompetitor(id) {
    if (!confirm("Delete this competitor and all associated intel?")) return;
    try {
      await deleteCompetitor(id);
      setCompetitors((prev) => prev.filter((c) => c.id !== id));
      if (selectedCompetitor?.id === id) {
        setSelectedCompetitor(null);
        setMode("overview");
      }
    } catch (e) {
      setError("Delete failed: " + (e.message || ""));
    }
  }

  async function handleAnalyze() {
    if (!analyzeContent.trim() || !analyzeComp) return;
    setAnalyzing(true);
    setAnalyzeStep(0);
    setAnalyzeError("");
    const timer = setInterval(() => setAnalyzeStep((s) => (s < 3 ? s + 1 : s)), 900);
    try {
      const res = await analyzeCompetitor({
        competitor_name: analyzeComp.name,
        competitor_id: analyzeComp.id,
        source_url: analyzeUrl,
        raw_content: analyzeContent,
        product_id: analyzeComp.product_id,
      });
      clearInterval(timer);
      if (res?.intel) {
        setIntel((prev) => [res.intel, ...prev]);
        setCompetitors((prev) =>
          prev.map((c) =>
            c.id === analyzeComp.id
              ? { ...c, threat_level: res.intel.threat_level || c.threat_level, intel_count: (c.intel_count || 0) + 1 }
              : c
          )
        );
      }
      setShowAnalyze(false);
      setAnalyzeContent("");
      setAnalyzeUrl("");
      if (mode !== "detail") {
        setMode("detail");
        setSelectedCompetitor(analyzeComp);
      }
      setDetailTab("intel");
    } catch (e) {
      clearInterval(timer);
      setAnalyzeError("Analysis failed: " + (e.message || "try again"));
    } finally {
      setAnalyzing(false);
      setAnalyzeStep(0);
    }
  }

  /* Derived stats */
  const stats = useMemo(() => {
    const total = competitors.length;
    const highThreat = competitors.filter((c) => c.threat_level === "high").length;
    const totalIntel = competitors.reduce((sum, c) => sum + (c.intel_count || 0), 0);
    return { total, highThreat, totalIntel };
  }, [competitors]);

  /* Recent changes from intel */
  const recentChanges = useMemo(() => {
    const changes = [];
    intel.forEach((row) => {
      const raw = parseJSON(row.raw_data);
      (raw.changes_detected || []).forEach((ch) => {
        changes.push({
          competitor: row.competitor_name,
          type: ch.type,
          description: ch.description,
          impact: ch.impact,
          date: row.created_at,
        });
      });
    });
    return changes.slice(0, 10);
  }, [intel]);

  /* Filtered + paginated competitors */
  const filteredCompetitors = useMemo(() => {
    let list = [...competitors];
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((c) =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.category || "").toLowerCase().includes(q) ||
        (c.product_name || "").toLowerCase().includes(q)
      );
    }
    if (threatFilter !== "all") {
      list = list.filter((c) => c.threat_level === threatFilter);
    }
    return list;
  }, [competitors, searchQuery, threatFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCompetitors.length / pageSize));
  const paginated = filteredCompetitors.slice((page - 1) * pageSize, page * pageSize);

  /* Latest intel for selected competitor */
  const latestIntel = useMemo(() => {
    if (!selectedCompetitor || !intel.length) return null;
    return intel.find((i) => i.competitor_id === selectedCompetitor.id || i.competitor_name === selectedCompetitor.name) || intel[0];
  }, [selectedCompetitor, intel]);

  const latestRaw = useMemo(() => {
    if (!latestIntel) return null;
    return parseJSON(latestIntel.raw_data);
  }, [latestIntel]);

  if (loading && !competitors.length) {
    return (
      <>
        <div className="ps-top">
          <div>
            <div className="ps-eyebrow">Intelligence</div>
            <div className="ps-title">Competitor Monitoring</div>
            <div className="ps-sub">Loading competitive intelligence…</div>
          </div>
        </div>
        <div className="ps-body">
          <div className="ps-empty">
            <div className="ring" style={{ width: 32, height: 32, marginBottom: 16 }} />
            <div className="big">Loading competitors…</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="ps-top">
        <div>
          <div className="ps-eyebrow">Intelligence</div>
          <div className="ps-title">Competitor Monitoring</div>
          <div className="ps-sub">Track competitors, detect changes, and keep your sales team prepared.</div>
        </div>
        {mode === "overview" && (
          <button className="ps-btn pri" onClick={() => { setShowAdd(true); setAddError(""); }}>
            <Plus size={15} /> Add competitor
          </button>
        )}
        {mode !== "overview" && (
          <button className="ps-btn ghost" onClick={() => { setMode("overview"); setSelectedCompetitor(null); }}>
            ← Back to overview
          </button>
        )}
      </div>

      <div className="ps-body">
        {/* ===== OVERVIEW ===== */}
        {mode === "overview" && (
          <>
            {competitors.length === 0 ? (
              <div className="ps-empty" style={{ padding: 72 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🛡️</div>
                <div className="big">Build your competitive intelligence</div>
                <p style={{ maxWidth: 460 }}>
                  Add competitors to monitor their positioning, pricing, product updates and sales messaging.
                </p>
                <button className="ps-btn pri" onClick={() => setShowAdd(true)} style={{ marginTop: 8 }}>
                  <Plus size={15} /> Add competitor
                </button>
                <div
                  style={{
                    marginTop: 28,
                    display: "grid",
                    gap: 10,
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    maxWidth: 640,
                    margin: "28px auto 0",
                  }}
                >
                  {[
                    { icon: Activity, label: "Product changes", desc: "New features & releases" },
                    { icon: TrendingUp, label: "Pricing changes", desc: "Price moves & models" },
                    { icon: Target, label: "Messaging changes", desc: "Positioning shifts" },
                    { icon: AlertTriangle, label: "Competitive threats", desc: "Risk to your deals" },
                    { icon: Swords, label: "Battle cards", desc: "Sales-ready counters" },
                    { icon: BookOpen, label: "AI analysis", desc: "Structured intel" },
                  ].map((f) => (
                    <div
                      key={f.label}
                      style={{
                        textAlign: "left",
                        padding: 14,
                        background: "#F6F8FB",
                        borderRadius: 10,
                        border: "1px solid var(--line-soft)",
                      }}
                    >
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
                <div className="ci-kpi-bar" style={{ marginBottom: 24 }}>
                  <div className="ci-kpi">
                    <div className="ci-icon"><Shield size={18} /></div>
                    <div className="ci-body">
                      <div className="ci-kpi-label">Competitors</div>
                      <div className="ci-kpi-value">{stats.total}</div>
                    </div>
                  </div>
                  <div className="ci-kpi">
                    <div className="ci-icon"><BarChart3 size={18} /></div>
                    <div className="ci-body">
                      <div className="ci-kpi-label">Intel snapshots</div>
                      <div className="ci-kpi-value">{stats.totalIntel}</div>
                    </div>
                  </div>
                  <div className="ci-kpi bad">
                    <div className="ci-icon"><ShieldAlert size={18} /></div>
                    <div className="ci-body">
                      <div className="ci-kpi-label">High Threat</div>
                      <div className="ci-kpi-value" style={{ color: "#B23237" }}>{stats.highThreat}</div>
                    </div>
                  </div>
                  <div className="ci-kpi">
                    <div className="ci-icon"><Activity size={18} /></div>
                    <div className="ci-body">
                      <div className="ci-kpi-label">Changes detected</div>
                      <div className="ci-kpi-value">{recentChanges.length}</div>
                    </div>
                  </div>
                </div>

                {/* Toolbar */}
                <div className="dt-header">
                  <div className="dt-search">
                    <Search size={15} className="dt-search-icon" />
                    <input placeholder="Search competitors…" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }} />
                    {searchQuery && <button className="dt-search-clear" onClick={() => { setSearchQuery(""); setPage(1); }}><X size={13} /></button>}
                  </div>
                  <button className={`dt-filter-btn ${threatFilter !== "all" ? "on" : ""}`} onClick={() => setShowFilters((s) => !s)}>
                    <SlidersHorizontal size={14} /> Filters {threatFilter !== "all" && <span className="count">1</span>}
                  </button>
                  <div className="dt-view-toggle">
                    <button className={viewMode === "list" ? "on" : ""} onClick={() => setViewMode("list")} title="List"><List size={14} /> List</button>
                    <button className={viewMode === "cards" ? "on" : ""} onClick={() => setViewMode("cards")} title="Cards"><LayoutGrid size={14} /> Cards</button>
                  </div>
                </div>

                {showFilters && (
                  <div className="dt-filter-panel" style={{ marginBottom: 14 }}>
                    <div className="dt-filter-group">
                      <label>Threat Level</label>
                      <select className="fsel" value={threatFilter} onChange={(e) => { setThreatFilter(e.target.value); setPage(1); }}>
                        <option value="all">All levels</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                    <div className="dt-filter-actions">
                      <button className="ps-btn ghost sm" onClick={() => { setThreatFilter("all"); setPage(1); }}><X size={14} /> Clear</button>
                      <button className="ps-btn pri sm" onClick={() => setShowFilters(false)}>Done</button>
                    </div>
                  </div>
                )}

                {/* Card view */}
                {viewMode === "cards" && (
                  <div className="epc-grid" style={{ marginBottom: 20 }}>
                    {paginated.map((c) => {
                      const tm = THREAT_META[c.threat_level || "low"];
                      const TIcon = tm.icon;
                      return (
                        <div
                          key={c.id}
                          className="epc-card"
                          onClick={() => {
                            setSelectedCompetitor(c);
                            loadIntel(c.id);
                            setMode("detail");
                            setDetailTab("overview");
                          }}
                        >
                          <div className="epc-top">
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="epc-name">{c.name}</div>
                              <div className="epc-desc">
                                {c.category || "Competitor"}
                                {c.product_name ? ` · vs ${c.product_name}` : ""}
                              </div>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                              <span className="ds-status" style={{ background: tm.bg, color: tm.color, border: `1px solid ${tm.border}` }}>
                                <span className="ds-status-dot" style={{ background: tm.color }} />{tm.label}
                              </span>
                            </div>
                          </div>
                          <div className="epc-meta">
                            <div className="epc-meta-item"><b>{c.intel_count || 0}</b> snapshots</div>
                            <div className="epc-meta-item">{c.last_intel_at ? timeAgo(c.last_intel_at) : "No intel"}</div>
                          </div>
                          <div className="epc-actions">
                            <button className="epc-act-open" onClick={(e) => { e.stopPropagation(); setSelectedCompetitor(c); loadIntel(c.id); setMode("detail"); setDetailTab("overview"); }}><Eye size={13} /> Open</button>
                            <button className="epc-act-del" onClick={(e) => { e.stopPropagation(); if (confirm("Delete this competitor and all associated intel?")) handleDeleteCompetitor(c.id); }}><Trash2 size={13} /></button>
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
                            <th style={{ width: "34%" }}>Competitor</th>
                            <th style={{ width: "14%" }}>Threat</th>
                            <th style={{ width: "14%" }}>Category</th>
                            <th style={{ width: "12%" }}>Intel</th>
                            <th style={{ width: "14%" }}>Last updated</th>
                            <th style={{ width: "8%" }} />
                          </tr>
                        </thead>
                        <tbody>
                          {paginated.map((c) => {
                            const tm = THREAT_META[c.threat_level || "low"];
                            return (
                              <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => { setSelectedCompetitor(c); loadIntel(c.id); setMode("detail"); setDetailTab("overview"); }}>
                                <td>
                                  <div className="dt-script-name">{c.name}</div>
                                  <div className="dt-script-meta">{c.product_name ? `vs ${c.product_name}` : "No product linked"}</div>
                                </td>
                                <td>
                                  <span className="ds-status" style={{ background: tm.bg, color: tm.color, border: `1px solid ${tm.border}` }}>
                                    <span className="ds-status-dot" style={{ background: tm.color }} />{tm.label}
                                  </span>
                                </td>
                                <td style={{ fontSize: 13, color: "var(--muted)" }}>{c.category || "—"}</td>
                                <td style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>{c.intel_count || 0}</td>
                                <td style={{ whiteSpace: "nowrap", fontSize: 12.5, color: "var(--muted)" }}>{c.last_intel_at ? timeAgo(c.last_intel_at) : "—"}</td>
                                <td onClick={(e) => e.stopPropagation()}>
                                  <div className="dt-actions" ref={activeDropdown === c.id ? dropdownRef : null}>
                                    <button ref={activeDropdown === c.id ? dropdownBtnRef : null} className="dt-more-btn" onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === c.id ? null : c.id); }}>
                                      <MoreHorizontal size={16} />
                                    </button>
                                    {activeDropdown === c.id && dropdownPos && (
                                      <div className="dt-dropdown" style={dropdownPos}>
                                        <button className="dt-dropdown-item" onClick={() => { setSelectedCompetitor(c); loadIntel(c.id); setMode("detail"); setDetailTab("overview"); setActiveDropdown(null); }}><Eye size={14} /> Open</button>
                                        <button className="dt-dropdown-item danger" onClick={() => { if (confirm("Delete this competitor and all associated intel?")) handleDeleteCompetitor(c.id); setActiveDropdown(null); }}><Trash2 size={14} /> Delete</button>
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

                    {filteredCompetitors.length > pageSize && (
                      <div className="ds-pagination">
                        <span className="ds-pagination-info">Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredCompetitors.length)} of {filteredCompetitors.length}</span>
                        <div className="ds-pagination-actions">
                          <button className="ds-btn-ico" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}><ChevronLeft size={16} /></button>
                          <span className="ds-pagination-pages">Page {page} of {totalPages}</span>
                          <button className="ds-btn-ico" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}><ChevronRight size={16} /></button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Recent changes */}
                {recentChanges.length > 0 && (
                  <div className="ps-card" style={{ marginTop: 20 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                      <Activity size={16} />
                      Recent Changes
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {recentChanges.map((ch, i) => {
                        const impactMeta = THREAT_META[ch.impact || "low"];
                        return (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              padding: "12px 14px",
                              background: "#F6F8FB",
                              borderRadius: 10,
                              borderLeft: `3px solid ${impactMeta.color}`,
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 2 }}>
                                {ch.competitor}
                              </div>
                              <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.45 }}>
                                {ch.description}
                              </div>
                            </div>
                            <span
                              className="dt-pill"
                              style={{
                                background: impactMeta.bg,
                                color: impactMeta.color,
                                fontWeight: 700,
                                fontSize: 11,
                                flexShrink: 0,
                              }}
                            >
                              {ch.type}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ===== DETAIL ===== */}
        {mode === "detail" && selectedCompetitor && (
          <>
            {/* Detail header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginBottom: 20,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: THREAT_META[selectedCompetitor.threat_level || "low"].bg,
                  border: `1.5px solid ${THREAT_META[selectedCompetitor.threat_level || "low"].border}`,
                  color: THREAT_META[selectedCompetitor.threat_level || "low"].color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {React.createElement(THREAT_META[selectedCompetitor.threat_level || "low"].icon, { size: 22 })}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 20 }}>
                  {selectedCompetitor.name}
                </div>
                <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
                  {selectedCompetitor.category || "Competitor"}
                  {selectedCompetitor.product_name && (
                    <span style={{ marginLeft: 8 }}>· vs {selectedCompetitor.product_name}</span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {selectedCompetitor.website && (
                  <a
                    href={selectedCompetitor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ps-btn ghost sm"
                    style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
                  >
                    <Globe size={14} /> Website
                  </a>
                )}
                <button
                  className="ps-btn pri sm"
                  onClick={() => {
                    setAnalyzeComp(selectedCompetitor);
                    setShowAnalyze(true); setAnalyzeError("");
                  }}
                >
                  <Sparkles size={14} /> Analyze content
                </button>
                <button
                  className="ps-btn ghost sm danger"
                  onClick={() => handleDeleteCompetitor(selectedCompetitor.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: "1.5px solid var(--line-soft)" }}>
              {[
                { id: "overview", label: "Overview" },
                { id: "intel", label: "Intel History" },
                { id: "battle", label: "Battle Card" },
                { id: "sources", label: "Sources" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setDetailTab(t.id)}
                  style={{
                    padding: "10px 18px",
                    fontSize: 13,
                    fontWeight: 600,
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: detailTab === t.id ? "var(--accent)" : "var(--muted)",
                    borderBottom: detailTab === t.id ? "2px solid var(--accent)" : "2px solid transparent",
                    marginBottom: -1.5,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Overview tab */}
            {detailTab === "overview" && (
              <>
                {!latestIntel ? (
                  <div className="ps-empty" style={{ padding: 48 }}>
                    <div className="big">No intel yet</div>
                    <p>Paste competitor content to generate structured analysis.</p>
                    <button
                      className="ps-btn pri"
                      onClick={() => {
                        setAnalyzeComp(selectedCompetitor);
                        setShowAnalyze(true); setAnalyzeError("");
                      }}
                    >
                      <Sparkles size={15} /> Analyze content
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Summary card */}
                    {latestIntel.ai_summary && (
                      <div
                        className="ps-card"
                        style={{
                          marginBottom: 20,
                          background: "var(--accent-bg)",
                          borderColor: "#C4D0F9",
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, display: "flex", alignItems: "center", gap: 8, color: "var(--accent-ink)" }}>
                          <Lightbulb size={16} /> AI Summary
                        </div>
                        <div style={{ fontSize: 14, lineHeight: 1.65, color: "var(--ink)" }}>
                          {latestIntel.ai_summary}
                        </div>
                      </div>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                      {/* Key Messages */}
                      {(latestRaw?.key_messages || []).length > 0 && (
                        <div className="ps-card">
                          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, display: "flex", alignItems: "center", gap: 8, color: "var(--accent-ink)" }}>
                            <BarChart3 size={15} /> Key Messages
                          </div>
                          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.6 }}>
                            {latestRaw.key_messages.map((m, i) => (
                              <li key={i} style={{ marginBottom: 5 }}>{m}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Threats */}
                      {(latestRaw?.threats || []).length > 0 && (
                        <div
                          className="ps-card"
                          style={{ background: "#FDF2F2", borderColor: "#F0C9CA" }}
                        >
                          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, display: "flex", alignItems: "center", gap: 8, color: "#B23237" }}>
                            <AlertTriangle size={15} /> Threats
                          </div>
                          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.6 }}>
                            {latestRaw.threats.map((t, i) => (
                              <li key={i} style={{ marginBottom: 5 }}>{t}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Positioning */}
                      {latestRaw?.positioning && (
                        <div className="ps-card">
                          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, display: "flex", alignItems: "center", gap: 8, color: "var(--accent-ink)" }}>
                            <Target size={15} /> Positioning
                          </div>
                          <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
                            <div style={{ marginBottom: 8 }}>
                              <b>Target:</b> {latestRaw.positioning.target_audience}
                            </div>
                            <div style={{ marginBottom: 8 }}>
                              <b>Value prop:</b> {latestRaw.positioning.value_proposition}
                            </div>
                            {latestRaw.positioning.differentiators?.length > 0 && (
                              <div>
                                <b>Differentiators:</b>
                                <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
                                  {latestRaw.positioning.differentiators.map((d, i) => (
                                    <li key={i}>{d}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Pricing intel */}
                      {latestRaw?.pricing_intel && (
                        <div className="ps-card">
                          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, display: "flex", alignItems: "center", gap: 8, color: "var(--accent-ink)" }}>
                            <TrendingUp size={15} /> Pricing
                          </div>
                          <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
                            <div style={{ marginBottom: 6 }}>
                              <b>Model:</b> {latestRaw.pricing_intel.pricing_model}
                            </div>
                            <div style={{ marginBottom: 6 }}>
                              <b>Range:</b> {latestRaw.pricing_intel.price_range}
                            </div>
                            <div>
                              <b>Free tier:</b> {latestRaw.pricing_intel.free_tier ? "Yes" : "No"}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Feature intel */}
                    {latestRaw?.feature_intel && (
                      <div className="ps-card" style={{ marginBottom: 20 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, display: "flex", alignItems: "center", gap: 8, color: "var(--accent-ink)" }}>
                          <CheckCircle2 size={15} /> Features
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--muted)", marginBottom: 6 }}>
                              Core features
                            </div>
                            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.6 }}>
                              {(latestRaw.feature_intel.core_features || []).map((f, i) => (
                                <li key={i}>{f}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--muted)", marginBottom: 6 }}>
                              Recent additions
                            </div>
                            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.6 }}>
                              {(latestRaw.feature_intel.recent_additions || []).map((f, i) => (
                                <li key={i}>{f}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Changes detected */}
                    {(latestRaw?.changes_detected || []).length > 0 && (
                      <div className="ps-card" style={{ marginBottom: 20 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, display: "flex", alignItems: "center", gap: 8, color: "var(--accent-ink)" }}>
                          <Activity size={15} /> Changes Detected
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {(latestRaw.changes_detected || []).map((ch, i) => {
                            const im = THREAT_META[ch.impact || "low"];
                            return (
                              <div
                                key={i}
                                style={{
                                  padding: "10px 12px",
                                  background: im.bg,
                                  borderRadius: 8,
                                  border: `1px solid ${im.border}`,
                                  fontSize: 13.5,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 10,
                                }}
                              >
                                <span
                                  className="dt-pill"
                                  style={{ background: im.bg, color: im.color, fontWeight: 700, fontSize: 10, flexShrink: 0 }}
                                >
                                  {ch.type}
                                </span>
                                <span>{ch.description}</span>
                                <span style={{ marginLeft: "auto", fontWeight: 700, fontSize: 12, color: im.color }}>
                                  {im.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* Intel History tab */}
            {detailTab === "intel" && (
              <>
                {intel.length === 0 ? (
                  <div className="ps-empty" style={{ padding: 48 }}>
                    <div className="big">No intel snapshots</div>
                    <p>Analyze competitor content to build a history of changes.</p>
                    <button
                      className="ps-btn pri"
                      onClick={() => {
                        setAnalyzeComp(selectedCompetitor);
                        setShowAnalyze(true); setAnalyzeError("");
                      }}
                    >
                      <Sparkles size={15} /> Analyze content
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {intel.map((row) => {
                      const raw = parseJSON(row.raw_data);
                      return (
                        <div
                          key={row.id}
                          className="ps-card"
                          style={{ cursor: "pointer", transition: ".12s" }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                            <span
                              className="dt-pill"
                              style={{
                                background: `${THREAT_META[row.threat_level || "low"].bg}`,
                                color: THREAT_META[row.threat_level || "low"].color,
                                fontWeight: 700,
                              }}
                            >
                              {THREAT_META[row.threat_level || "low"].label}
                            </span>
                            <span style={{ fontSize: 12, color: "var(--faint)", marginLeft: "auto" }}>
                              {new Date(row.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {row.ai_summary && (
                            <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--muted)", marginBottom: 8 }}>
                              {row.ai_summary}
                            </div>
                          )}
                          {raw.key_messages?.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                              {raw.key_messages.slice(0, 4).map((m, i) => (
                                <span key={i} className="chip" style={{ fontSize: 11 }}>
                                  {m}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* Battle Card tab */}
            {detailTab === "battle" && (
              <>
                {!latestRaw?.battle_card ? (
                  <div className="ps-empty" style={{ padding: 48 }}>
                    <div className="big">No battle card yet</div>
                    <p>Analyze competitor content to generate a sales-ready battle card.</p>
                    <button
                      className="ps-btn pri"
                      onClick={() => {
                        setAnalyzeComp(selectedCompetitor);
                        setShowAnalyze(true); setAnalyzeError("");
                      }}
                    >
                      <Sparkles size={15} /> Analyze content
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="ps-card" style={{ marginBottom: 20 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, display: "flex", alignItems: "center", gap: 8, color: "var(--accent-ink)" }}>
                        <Swords size={16} /> Battle Card: {selectedCompetitor.name}
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#1A7F5B", marginBottom: 8 }}>
                            Why customers choose them
                          </div>
                          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.6 }}>
                            {(latestRaw.battle_card.why_customers_choose_them || []).map((x, i) => (
                              <li key={i}>{x}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#B23237", marginBottom: 8 }}>
                            Where they are stronger
                          </div>
                          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.6 }}>
                            {(latestRaw.battle_card.where_they_are_stronger || []).map((x, i) => (
                              <li key={i}>{x}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#1A7F5B", marginBottom: 8 }}>
                            Where we are stronger
                          </div>
                          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.6 }}>
                            {(latestRaw.battle_card.where_we_are_stronger || []).map((x, i) => (
                              <li key={i}>{x}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--muted)", marginBottom: 8 }}>
                            Do NOT say
                          </div>
                          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.6, color: "#B23237" }}>
                            {(latestRaw.battle_card.do_not_say || []).map((x, i) => (
                              <li key={i}>❌ {x}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {latestRaw.battle_card.common_objection && (
                        <div
                          style={{
                            padding: 14,
                            background: "#EAEEFE",
                            borderRadius: 10,
                            borderLeft: "3px solid var(--accent)",
                            marginBottom: 14,
                          }}
                        >
                          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--accent-ink)", marginBottom: 6 }}>
                            Common objection
                          </div>
                          <div style={{ fontSize: 14, fontStyle: "italic", color: "var(--ink)" }}>
                            “{latestRaw.battle_card.common_objection}”
                          </div>
                        </div>
                      )}

                      {latestRaw.battle_card.recommended_response && (
                        <div
                          style={{
                            padding: 14,
                            background: "#E8F6EF",
                            borderRadius: 10,
                            borderLeft: "3px solid #12A374",
                            marginBottom: 14,
                          }}
                        >
                          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#1A7F5B", marginBottom: 6 }}>
                            Recommended response
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 500, color: "#0A3F30" }}>
                            “{latestRaw.battle_card.recommended_response}”
                          </div>
                        </div>
                      )}

                      {(latestRaw.battle_card.ask_instead || []).length > 0 && (
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--muted)", marginBottom: 8 }}>
                            Ask instead
                          </div>
                          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.6 }}>
                            {latestRaw.battle_card.ask_instead.map((q, i) => (
                              <li key={i} style={{ marginBottom: 4 }}>✓ {q}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}

            {/* Sources tab */}
            {detailTab === "sources" && (
              <div className="ps-card" style={{ maxWidth: 560 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Monitoring Sources</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { type: "website", label: "Website", url: selectedCompetitor.website },
                    { type: "pricing", label: "Pricing page" },
                    { type: "product", label: "Product page" },
                    { type: "blog", label: "Blog" },
                    { type: "changelog", label: "Changelog" },
                  ].map((src) => (
                    <div
                      key={src.type}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 12px",
                        background: "#F6F8FB",
                        borderRadius: 8,
                        fontSize: 13.5,
                      }}
                    >
                      <Globe size={15} color="var(--accent)" />
                      <span style={{ flex: 1 }}>{src.label}</span>
                      {src.url ? (
                        <a href={src.url} target="_blank" rel="noopener noreferrer" className="ps-btn-ghost sm">
                          <ExternalLink size={12} /> Open
                        </a>
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--faint)" }}>Not set</span>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 14, fontSize: 12, color: "var(--faint)", lineHeight: 1.5 }}>
                  Sources are tracked per competitor. Future versions will auto-detect changes from monitored URLs.
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ===== ADD COMPETITOR MODAL ===== */}
      {showAdd && (
        <div className="overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 18, marginBottom: 4 }}>
              Add Competitor
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 18 }}>
              Track a competitor for intelligence and battle cards.
            </div>
            {addError && <div className="err" style={{ marginBottom: 14 }}>{addError}</div>}
            <div className="frow" style={{ marginBottom: 14 }}>
              <label className="flab">Competitor name *</label>
              <LimitedInput
                className="finp"
                maxLength={200}
                placeholder="e.g. Zoho CRM"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              />
            </div>
            <div className="frow" style={{ marginBottom: 14 }}>
              <label className="flab">Category</label>
              <LimitedInput
                className="finp"
                maxLength={200}
                placeholder="e.g. CRM Software"
                value={addForm.category}
                onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
              />
            </div>
            <div className="frow" style={{ marginBottom: 14 }}>
              <label className="flab">Website</label>
              <LimitedInput
                className="finp"
                maxLength={500}
                placeholder="https://..."
                value={addForm.website}
                onChange={(e) => setAddForm({ ...addForm, website: e.target.value })}
              />
            </div>
            <div className="frow" style={{ marginBottom: 18 }}>
              <label className="flab">Product to compare against</label>
              <select
                className="finp"
                value={addForm.product_id}
                onChange={(e) => setAddForm({ ...addForm, product_id: e.target.value })}
              >
                <option value="">Select product…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="ps-btn ghost" onClick={() => setShowAdd(false)} disabled={adding}>
                Cancel
              </button>
              <button
                className="ps-btn pri"
                disabled={!addForm.name.trim() || adding}
                onClick={handleAddCompetitor}
              >
                {adding ? (
                  <>
                    <span className="spinner" /> Adding…
                  </>
                ) : (
                  <>Add competitor</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== ANALYZE CONTENT MODAL ===== */}
      {showAnalyze && analyzeComp && (
        <div className="overlay" onClick={() => !analyzing && setShowAnalyze(false)}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 18, marginBottom: 4 }}>
              Analyze {analyzeComp.name}
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 18 }}>
              Paste competitor content, messaging, or a transcript to generate structured intel.
            </div>
            {analyzeError && <div className="err" style={{ marginBottom: 14 }}>{analyzeError}</div>}
            <div className="frow" style={{ marginBottom: 12 }}>
              <label className="flab">Source URL (optional)</label>
              <LimitedInput
                className="finp"
                maxLength={500}
                placeholder="https://competitor.com/pricing"
                value={analyzeUrl}
                onChange={(e) => setAnalyzeUrl(e.target.value)}
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="flab">Content to analyze</label>
              <LimitedTextarea
                className="finp"
                maxLength={5000}
                style={{ minHeight: 200, resize: "vertical", width: "100%" }}
                placeholder="Paste competitor content here — pricing page, product announcement, sales messaging, or any intel you want analyzed…"
                value={analyzeContent}
                onChange={(e) => setAnalyzeContent(e.target.value)}
              />
              <div className="fhint" style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{analyzeContent.length.toLocaleString()} chars</span>
                <span>Paste full pages for best results</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button
                className="ps-btn pri"
                disabled={!analyzeContent.trim() || analyzing}
                onClick={handleAnalyze}
              >
                {analyzing ? (
                  <>
                    <span className="spinner" /> Analyzing…
                  </>
                ) : (
                  <>
                    <Sparkles size={15} /> Analyze & Generate Intel
                  </>
                )}
              </button>
              <button className="ps-btn ghost" disabled={analyzing} onClick={() => setShowAnalyze(false)}>
                Cancel
              </button>
            </div>

            {/* Progress steps */}
            {analyzing && (
              <div
                style={{
                  marginTop: 16,
                  padding: 14,
                  background: "#F6F8FB",
                  borderRadius: 10,
                  border: "1px solid var(--line-soft)",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
                  Analyzing competitor content…
                </div>
                {[
                  "Extracting positioning & messaging",
                  "Evaluating threats & strengths",
                  "Comparing features & pricing",
                  "Generating battle card & recommendations",
                ].map((step, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "5px 0",
                      fontSize: 13,
                      color: i <= analyzeStep ? "var(--ink)" : "var(--faint)",
                    }}
                  >
                    <span style={{ width: 18, display: "inline-flex", justifyContent: "center" }}>
                      {i < analyzeStep ? "✓" : i === analyzeStep ? (
                        <span className="spinner dark" style={{ width: 12, height: 12 }} />
                      ) : (
                        "○"
                      )}
                    </span>
                    {step}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
