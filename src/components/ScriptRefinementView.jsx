import React, { useState, useEffect, useMemo } from "react";
import {
  listScripts,
  generateScriptRefinement,
  listScriptRefinements,
  listScriptRefinementsForScript,
  deleteScriptRefinement,
} from "../api/client.js";
import {
  Search,
  Wand2,
  ArrowLeft,
  Play,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  FileText,
  Sparkles,
  Trash2,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Save,
  Clock,
  BarChart3,
  PenTool,
} from "lucide-react";

/* ============================================================
   ScriptRefinementView — Enterprise AI Script Refinement Workspace
   Workflow: select → baseline → refining → workspace → history
   ============================================================ */

const GOALS = [
  { id: "improve_conversion", label: "Improve conversion" },
  { id: "make_shorter", label: "Make it shorter" },
  { id: "more_conversational", label: "More conversational" },
  { id: "improve_objections", label: "Improve objection handling" },
  { id: "improve_discovery", label: "Improve discovery" },
  { id: "more_persuasive", label: "More persuasive" },
  { id: "for_beginners", label: "Suitable for beginners" },
  { id: "localize", label: "Localize language" },
];

const FOCUS_AREAS = [
  { id: "opening", label: "Opening" },
  { id: "discovery", label: "Discovery" },
  { id: "value_prop", label: "Value Prop" },
  { id: "objections", label: "Objections" },
  { id: "closing", label: "Closing" },
];

const DIM_LABELS = {
  opening: "Opening",
  discovery: "Discovery",
  value_prop: "Value Prop",
  objections: "Objections",
  closing: "Closing",
};

function parseJSON(val) {
  try { return JSON.parse(val || "[]"); } catch { return []; }
}

function scoreColor(val) {
  if (val >= 80) return "#1A7F5B";
  if (val >= 50) return "#B5720F";
  return "#B23237";
}

function fmtDate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

/* --- Score Ring (SVG circular progress) --- */
function ScoreRing({ value, size = 120, stroke = 8, previous }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const color = scoreColor(value);
  const delta = previous != null ? value - previous : null;
  return (
    <div className="ds-score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle className="track" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} />
        <circle className="fill" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={offset} style={{ stroke: color }} />
      </svg>
      <div style={{ textAlign: "center" }}>
        <div className="value" style={{ color }}>{value}</div>
        <div className="label">Quality</div>
        {delta != null && (
          <div style={{ fontSize: 12, fontWeight: 700, color: delta >= 0 ? "#1A7F5B" : "#B23237", display: "flex", alignItems: "center", justifyContent: "center", gap: 2, marginTop: 2 }}>
            {delta >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {delta > 0 ? `+${delta}` : delta}
          </div>
        )}
      </div>
    </div>
  );
}

/* --- Dimension Bars --- */
function DimensionBars({ scores }) {
  const entries = Object.entries(DIM_LABELS);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {entries.map(([key, label]) => {
        const val = scores?.[key] || 0;
        return (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", width: 90, flexShrink: 0 }}>{label}</span>
            <div style={{ flex: 1, height: 8, borderRadius: 4, background: "var(--line-soft)", overflow: "hidden" }}>
              <div style={{ width: `${val}%`, height: "100%", borderRadius: 4, background: scoreColor(val), transition: "width .6s ease" }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor(val), width: 30, textAlign: "right" }}>{val}</span>
          </div>
        );
      })}
    </div>
  );
}

/* --- Script Selection Card --- */
function ScriptCard({ script, products, latestRefinement, onSelect }) {
  const score = latestRefinement?.improvement_score;
  const productName = (products.find((p) => String(p.id) === String(script.product_id)) || {}).name || script.product_name || "Product";
  return (
    <button className="ds-script-card" onClick={() => onSelect(script)}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--accent-bg)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <FileText size={16} />
        </div>
        <div style={{ textAlign: "left", flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)" }}>{productName}</div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
            {script.method} · {script.call_type} · {script.language} · {script.duration}m
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          {score ? (
            <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 18, color: scoreColor(score) }}>{score}</div>
          ) : (
            <span style={{ fontSize: 11, color: "var(--faint)", fontWeight: 600 }}>Not refined</span>
          )}
          <div style={{ fontSize: 11, color: "var(--faint)" }}>{fmtDate(script.saved_at || script.created_at)}</div>
        </div>
      </div>
    </button>
  );
}

/* --- AI Change Block --- */
function ChangeBlock({ change, index }) {
  const area = change.area || "General";
  const what = change.what || change;
  const why = change.why || "";
  const impact = change.impact || "";
  return (
    <div className="ds-insight-block">
      <div className="icon" style={{ color: "var(--accent)" }}>
        <Sparkles size={16} />
      </div>
      <div className="content">
        <div className="title">{area}</div>
        <div className="body" style={{ marginBottom: why ? 6 : 0 }}>{what}</div>
        {why && (
          <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5, marginBottom: impact ? 4 : 0 }}>
            <strong style={{ color: "var(--ink)" }}>Why:</strong> {why}
          </div>
        )}
        {impact && (
          <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
            <strong style={{ color: "var(--ink)" }}>Expected impact:</strong> {impact}
          </div>
        )}
      </div>
    </div>
  );
}

/* --- Version Row --- */
function VersionRow({ refItem, isCurrent, onOpen, onDelete }) {
  const score = refItem.improvement_score;
  const prev = refItem.previous_score;
  const delta = prev != null && score != null ? score - prev : null;
  const type = refItem.version_number === 1 ? "Original" : "AI refined";
  return (
    <div className="ds-version-row">
      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
        <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 13, color: "var(--ink)", minWidth: 36 }}>v{refItem.version_number}</span>
        {score != null && (
          <span style={{ fontWeight: 700, fontSize: 13, color: scoreColor(score) }}>{score}/100</span>
        )}
        {delta != null && (
          <span style={{ fontSize: 11, fontWeight: 700, color: delta >= 0 ? "#1A7F5B" : "#B23237" }}>
            {delta > 0 ? `+${delta}` : delta}
          </span>
        )}
        <span style={{ fontSize: 12, color: "var(--muted)" }}>{type}</span>
        <span style={{ fontSize: 12, color: "var(--faint)", marginLeft: "auto" }}>{fmtDate(refItem.created_at)}</span>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button className="ds-btn-ter sm" onClick={() => onOpen(refItem)}><ChevronRight size={14} /> Open</button>
        {!isCurrent && (
          <button className="ds-btn-ico" onClick={() => onDelete(refItem.id)} title="Delete version"><Trash2 size={14} /></button>
        )}
      </div>
    </div>
  );
}

export default function ScriptRefinementView({ products = [], onOpenStudio }) {
  const [phase, setPhase] = useState("select");
  const [scripts, setScripts] = useState([]);
  const [refinements, setRefinements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refining, setRefining] = useState(false);
  const [selectedScript, setSelectedScript] = useState(null);
  const [scriptHistory, setScriptHistory] = useState([]);
  const [latestRefinement, setLatestRefinement] = useState(null);
  const [search, setSearch] = useState("");
  const [goal, setGoal] = useState("improve_conversion");
  const [focusAreas, setFocusAreas] = useState([]);
  const [workspaceTab, setWorkspaceTab] = useState("compare");
  const [confirmDel, setConfirmDel] = useState(null);

  /* Load scripts and refinements */
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const [s, r] = await Promise.all([listScripts(), listScriptRefinements()]);
        if (!live) return;
        setScripts(s || []);
        setRefinements(r || []);
      } catch (e) {
        console.error(e);
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => { live = false; };
  }, []);

  /* When a script is selected, load its history */
  useEffect(() => {
    if (!selectedScript) return;
    (async () => {
      try {
        const rows = await listScriptRefinementsForScript(selectedScript.id);
        setScriptHistory(rows || []);
        setLatestRefinement(rows?.[0] || null);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [selectedScript]);

  const latestByScript = useMemo(() => {
    const map = new Map();
    (refinements || []).forEach((r) => {
      const existing = map.get(r.script_id);
      if (!existing || (r.version_number || 0) > (existing.version_number || 0)) {
        map.set(r.script_id, r);
      }
    });
    return map;
  }, [refinements]);

  const filteredScripts = useMemo(() => {
    if (!search.trim()) return scripts;
    const q = search.toLowerCase();
    return scripts.filter((s) => {
      const hay = `${s.product_name || ""} ${s.method || ""} ${s.call_type || ""} ${s.language || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [scripts, search]);

  const toggleFocus = (id) => {
    setFocusAreas((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return [...n];
    });
  };

  const handleRefine = async () => {
    if (!selectedScript) return;
    setRefining(true);
    try {
      await generateScriptRefinement({
        script_id: selectedScript.id,
        segments_json: selectedScript.segments_json || JSON.stringify(selectedScript.segments || []),
        goal,
        focus_areas: focusAreas,
      });
      // Reload history and global refinements
      const [rows, all] = await Promise.all([
        listScriptRefinementsForScript(selectedScript.id),
        listScriptRefinements(),
      ]);
      setScriptHistory(rows || []);
      setLatestRefinement(rows?.[0] || null);
      setRefinements(all || []);
      setPhase("workspace");
    } catch (e) {
      console.error("Refinement failed:", e);
    } finally {
      setRefining(false);
    }
  };

  const handleDelete = async (id) => {
    await deleteScriptRefinement(id);
    const [rows, all] = await Promise.all([
      selectedScript ? listScriptRefinementsForScript(selectedScript.id) : Promise.resolve([]),
      listScriptRefinements(),
    ]);
    setScriptHistory(rows || []);
    setLatestRefinement(rows?.[0] || null);
    setRefinements(all || []);
    setConfirmDel(null);
  };

  const dimScores = useMemo(() => {
    try {
      return JSON.parse(latestRefinement?.dimension_scores_json || "{}") || {};
    } catch { return {}; }
  }, [latestRefinement]);

  const changes = useMemo(() => {
    const raw = latestRefinement?.changes_made;
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      return [];
    } catch { return []; }
  }, [latestRefinement]);

  const opportunities = useMemo(() => {
    // Derive opportunities from lowest dimension scores
    const scores = dimScores || {};
    const entries = Object.entries(scores)
      .filter(([k]) => DIM_LABELS[k])
      .sort((a, b) => (a[1] || 0) - (b[1] || 0));
    return entries.slice(0, 3).map(([key, val]) => ({
      area: DIM_LABELS[key],
      impact: val < 50 ? "High" : "Medium",
      suggestion: `Improve ${DIM_LABELS[key].toLowerCase()} to lift overall quality.`,
    }));
  }, [dimScores]);

  /* ============================================================
     RENDER PHASES
     ============================================================ */

  /* ---------- REFINING PHASE ---------- */
  if (phase === "refining") {
    return (
      <>
        <div className="ps-top">
          <div style={{ flex: 1 }}>
            <div className="ps-eyebrow">Optimize</div>
            <div className="ps-title"><PenTool size={22} style={{ marginRight: 8, verticalAlign: "-3px" }} />Script Refinement</div>
          </div>
        </div>
        <div className="ds-template-f" style={{ padding: "48px 34px", maxWidth: 520, margin: "0 auto", textAlign: "center" }}>
          <div className="spinner dark" style={{ width: 40, height: 40, margin: "0 auto 24px" }} />
          <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Analyzing script...</div>
          <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.55 }}>
            The AI is comparing your script against winning patterns and generating specific improvements with explanations.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="ps-top">
        <div style={{ flex: 1 }}>
          <div className="ps-eyebrow">Optimize</div>
          <div className="ps-title"><PenTool size={22} style={{ marginRight: 8, verticalAlign: "-3px" }} />AI Script Refinement</div>
        </div>
        {phase !== "select" && (
          <button className="ds-btn-sec" onClick={() => { setPhase("select"); setSelectedScript(null); }}>
            <ArrowLeft size={14} /> Back to scripts
          </button>
        )}
      </div>

      <div className="ps-body">
        {/* SELECT PHASE CONTENT */}
        {phase === "select" && (
          <div className="ds-template-b">
            {/* Search */}
            <div className="dt-search" style={{ maxWidth: 480 }}>
              <Search size={15} className="dt-search-icon" />
              <input
                type="text"
                placeholder="Search scripts by product, method, or language..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Script list */}
            {loading ? (
              <div className="dt-empty" style={{ padding: 40 }}>
                <div className="title">Loading scripts...</div>
              </div>
            ) : filteredScripts.length === 0 ? (
              <div className="ds-empty-state">
                <div className="icon"><FileText size={24} /></div>
                <h3>{search.trim() ? "No scripts match your search" : "No scripts available"}</h3>
                <p>Generate a script in the Call Studio to start refining.</p>
                <div className="actions">
                  {onOpenStudio && (
                    <button className="ds-btn-pri" onClick={onOpenStudio}><Play size={15} /> Open Call Studio</button>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
                {filteredScripts.map((s) => (
                  <ScriptCard
                    key={s.id}
                    script={s}
                    products={products}
                    latestRefinement={latestByScript.get(s.id)}
                    onSelect={(sc) => { setSelectedScript(sc); setPhase("baseline"); }}
                  />
                ))}
              </div>
            )}

            {/* Recent refinements */}
            {!loading && refinements.length > 0 && (
              <div style={{ marginTop: 32 }}>
                <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 14, marginBottom: 12, color: "var(--ink)" }}>Recent refinements</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {refinements.slice(0, 3).map((r) => (
                    <button key={r.id} className="ds-version-row" onClick={() => {
                      const sc = scripts.find((s) => String(s.id) === String(r.script_id));
                      if (sc) { setSelectedScript(sc); setPhase("baseline"); }
                    }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: "var(--ink)" }}>{r.product_name || `Script #${r.script_id}`}</span>
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>v{r.version_number} · {r.improvement_score}/100</span>
                      <span style={{ fontSize: 12, color: "var(--faint)", marginLeft: "auto" }}>{fmtDate(r.created_at)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* BASELINE PHASE */}
        {phase === "baseline" && selectedScript && (
          <div className="ds-template-b">
            <div className="pd-head" style={{ marginBottom: 4 }}>
              <div className="pd-name">{(products.find((p) => String(p.id) === String(selectedScript.product_id)) || {}).name || selectedScript.product_name || "Script"}</div>
              <span className="dt-pill accent">{selectedScript.method} · {selectedScript.call_type} · {selectedScript.language}</span>
            </div>
            <div className="pd-sub" style={{ marginBottom: 20 }}>Select refinement goal and focus areas, then generate AI improvements.</div>

            <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 1fr) minmax(280px, 1fr)", gap: 16, alignItems: "start" }}>
              {/* Left: Performance + History */}
              <div className="ds-template-b">
                {/* Score card */}
                <div className="pd-card">
                  <div className="pd-card-h">Script Performance</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
                    <ScoreRing
                      value={latestRefinement?.improvement_score || 0}
                      previous={latestRefinement?.previous_score}
                    />
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <DimensionBars scores={dimScores} />
                    </div>
                  </div>
                  {opportunities.length > 0 && (
                    <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--line-soft)" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 8 }}>Top improvement opportunities</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {opportunities.slice(0, 3).map((o, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                            <span style={{ fontWeight: 700, color: "var(--ink)", minWidth: 20 }}>{i + 1}.</span>
                            <span style={{ flex: 1 }}>{o.area || o.suggestion}</span>
                            <span className={`ds-status ${(o.impact || "").toLowerCase() === "high" ? "bad" : "warn"}`}>
                              <span className="ds-status-dot" />{o.impact || "Medium"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Version history */}
                <div className="pd-card">
                  <div className="pd-card-h">Version History</div>
                  {scriptHistory.length === 0 ? (
                    <div style={{ fontSize: 13, color: "var(--faint)", padding: "8px 0" }}>No versions yet.</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {scriptHistory.map((r) => (
                        <VersionRow
                          key={r.id}
                          refItem={r}
                          isCurrent={r.id === latestRefinement?.id}
                          onOpen={(item) => { setLatestRefinement(item); setPhase("workspace"); }}
                          onDelete={(id) => setConfirmDel(id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Refinement Controls */}
              <div className="pd-card" style={{ position: "sticky", top: 16 }}>
                <div className="pd-card-h">Refinement Controls</div>

                <div style={{ marginBottom: 16 }}>
                  <label className="ds-label" style={{ display: "block", marginBottom: 6 }}>Goal</label>
                  <select className="ds-input ds-select" value={goal} onChange={(e) => setGoal(e.target.value)}>
                    {GOALS.map((g) => (
                      <option key={g.id} value={g.id}>{g.label}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label className="ds-label" style={{ display: "block", marginBottom: 6 }}>Focus areas</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {FOCUS_AREAS.map((f) => {
                      const on = focusAreas.includes(f.id);
                      return (
                        <button
                          key={f.id}
                          onClick={() => toggleFocus(f.id)}
                          className={`dt-pill ${on ? "accent" : ""}`}
                          style={{
                            background: on ? "var(--accent-bg)" : "var(--line-soft)",
                            color: on ? "var(--accent-ink)" : "var(--faint)",
                            border: on ? "1px solid #C4D0F9" : "1px solid transparent",
                            cursor: "pointer",
                            fontWeight: 600,
                          }}
                        >
                          {on && <CheckCircle2 size={12} style={{ marginRight: 4 }} />}
                          {f.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button className="ds-btn-pri" style={{ width: "100%", justifyContent: "center" }} onClick={handleRefine} disabled={refining}>
                  <Wand2 size={15} /> {refining ? "Refining..." : "Refine Script →"}
                </button>

                {latestRefinement && (
                  <button className="ds-btn-sec" style={{ width: "100%", justifyContent: "center", marginTop: 10 }} onClick={() => setPhase("workspace")}>
                    <BarChart3 size={14} /> View latest refinement
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* WORKSPACE PHASE */}
        {phase === "workspace" && latestRefinement && (
          <div className="ds-template-b">
            <div className="pd-head" style={{ marginBottom: 4 }}>
              <div className="pd-name">{latestRefinement.product_name || `Script #${latestRefinement.script_id}`}</div>
              <span className="dt-pill accent">v{latestRefinement.version_number} · {latestRefinement.improvement_score}/100</span>
            </div>
            <div className="pd-sub" style={{ marginBottom: 16 }}>
              {latestRefinement.previous_score != null && latestRefinement.improvement_score != null && (
                <span style={{ color: latestRefinement.improvement_score >= latestRefinement.previous_score ? "#1A7F5B" : "#B23237", fontWeight: 700 }}>
                  {latestRefinement.improvement_score > latestRefinement.previous_score ? "↑" : "↓"}
                  {" "}
                  {Math.abs(latestRefinement.improvement_score - latestRefinement.previous_score)} points from v{latestRefinement.version_number - 1}
                </span>
              )}
            </div>

            {/* Tabs */}
            <div className="pd-tabs" style={{ marginBottom: 16 }}>
              {[
                { id: "original", label: "Original" },
                { id: "refined", label: "AI Refined" },
                { id: "compare", label: "Compare" },
              ].map((t) => (
                <button key={t.id} className={`pd-tab ${workspaceTab === t.id ? "on" : ""}`} onClick={() => setWorkspaceTab(t.id)}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Script panels */}
            <div style={{ display: "grid", gridTemplateColumns: workspaceTab === "compare" ? "1fr 1fr" : "1fr", gap: 16, marginBottom: 24 }}>
              {(workspaceTab === "original" || workspaceTab === "compare") && (
                <div className="ds-refine-panel">
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 10 }}>Original Script</div>
                  <pre style={{ margin: 0, fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word", color: "var(--ink)", maxHeight: 420, overflow: "auto" }}>
                    {latestRefinement.original_segments_json || "No original text available."}
                  </pre>
                </div>
              )}
              {(workspaceTab === "refined" || workspaceTab === "compare") && (
                <div className="ds-refine-panel">
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 10 }}>AI Refined Script</div>
                  <pre style={{ margin: 0, fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word", color: "var(--ink)", maxHeight: 420, overflow: "auto" }}>
                    {latestRefinement.refined_segments_json || "No refined text available."}
                  </pre>
                </div>
              )}
            </div>

            {/* AI Changes */}
            {changes.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 15, marginBottom: 12, color: "var(--ink)" }}>AI Improvements</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {changes.map((c, i) => (
                    <ChangeBlock key={`chg-${i}-${c.title?.slice(0, 20) || i}`} change={c} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Dimension scores */}
            <div className="pd-card" style={{ marginBottom: 24 }}>
              <div className="pd-card-h">Quality Breakdown</div>
              <DimensionBars scores={dimScores} />
            </div>

            {/* Action bar */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", padding: "14px 0", borderTop: "1px solid var(--line-soft)" }}>
              <button className="ds-btn-pri" onClick={() => console.warn("Save as new version: not yet implemented")}>
                <Save size={14} /> Save as new version
              </button>
              {onOpenStudio && (
                <button className="ds-btn-sec" onClick={() => {
                  const prod = products.find((p) => String(p.id) === String(selectedScript?.product_id));
                  if (prod) onOpenStudio(prod);
                }}>
                  <Play size={14} /> Use in Call Studio →
                </button>
              )}
              <button className="ds-btn-ter" onClick={() => setPhase("baseline")}>
                <RotateCcw size={14} /> Back to controls
              </button>
              <button className="ds-btn-ter" onClick={() => setPhase("history")}>
                <Clock size={14} /> Version history
              </button>
              <div style={{ marginLeft: "auto" }}>
                <button className="ds-btn-ico" onClick={() => setConfirmDel(latestRefinement.id)} title="Delete version">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* HISTORY PHASE */}
        {phase === "history" && (
          <div className="ds-template-b">
            <div className="pd-head" style={{ marginBottom: 4 }}>
              <div className="pd-name">Version History</div>
              <span className="dt-pill accent">{(products.find((p) => String(p.id) === String(selectedScript?.product_id)) || {}).name || selectedScript?.product_name || `Script #${selectedScript?.id}`}</span>
            </div>
            <div className="pd-sub" style={{ marginBottom: 20 }}>Compare and manage all refinement versions.</div>

            {scriptHistory.length === 0 ? (
              <div className="ds-empty-state">
                <div className="icon"><Clock size={24} /></div>
                <h3>No versions yet</h3>
                <p>Refine this script to create your first version.</p>
                <div className="actions">
                  <button className="ds-btn-pri" onClick={() => setPhase("baseline")}><Wand2 size={14} /> Refine Script</button>
                </div>
              </div>
            ) : (
              <div className="pd-card">
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {scriptHistory.map((r) => (
                    <VersionRow
                      key={r.id}
                      refItem={r}
                      isCurrent={r.id === latestRefinement?.id}
                      onOpen={(item) => { setLatestRefinement(item); setPhase("workspace"); }}
                      onDelete={(id) => setConfirmDel(id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {confirmDel && (
        <div className="overlay" onClick={() => setConfirmDel(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Delete this version?</div>
            <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.55, marginBottom: 20 }}>
              This permanently removes version v{scriptHistory.find((r) => r.id === confirmDel)?.version_number || "?"}. This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="ds-btn-ter" onClick={() => setConfirmDel(null)}>Keep it</button>
              <button className="ds-btn-dan" onClick={() => handleDelete(confirmDel)}>Delete version</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
