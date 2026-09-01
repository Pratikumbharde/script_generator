import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { S, nameOf, parseScriptKey, scriptKey, generateScript } from "../utils/helpers.js";
import { METHODS, CALL_TYPES, LANGUAGES, REGIONS, DELIVERY } from "../data/constants.js";
import { Search, List, LayoutGrid, SlidersHorizontal, Columns, MoreHorizontal, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, X, FileText, Copy, Trash2, Sparkles, Globe, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { useOutsideClick, useDropdownPos } from "./shared/DropdownHooks.js";

/* ============================================================
   ScriptsView — Enterprise DataTable with List/Card toggle,
   sorting, column management, bulk actions, filter panel,
   KPI bar, URL state, and skeleton loading.
   ============================================================ */

const COLUMNS_DEF = [
  { key: "script", label: "Script", default: true, sortable: false, width: "auto" },
  { key: "method", label: "Method", default: true, sortable: true, width: 110 },
  { key: "callType", label: "Type", default: false, sortable: true, width: 120 },
  { key: "duration", label: "Duration", default: false, sortable: true, width: 90 },
  { key: "language", label: "Language", default: true, sortable: true, width: 100 },
  { key: "region", label: "Region", default: false, sortable: true, width: 100 },
  { key: "delivery", label: "Style", default: false, sortable: true, width: 110 },
  { key: "outcome", label: "Outcome", default: true, sortable: true, width: 100 },
  { key: "updated", label: "Last updated", default: true, sortable: true, width: 110 },
];

const OUTCOMES = [
  { id: "won", label: "Won", color: "ok" },
  { id: "lost", label: "Lost", color: "bad" },
  { id: "no_deal", label: "No deal", color: "warn" },
  { id: "pending", label: "Pending", color: "accent" },
];

const DATE_PRESETS = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "this_month", label: "This month" },
  { id: "last_month", label: "Last month" },
  { id: "custom", label: "Custom" },
];

function getDatePresetRange(id) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fmt = (d) => d.toISOString().split("T")[0];
  switch (id) {
    case "today": return { from: fmt(today), to: fmt(today) };
    case "yesterday": { const y = new Date(today); y.setDate(y.getDate() - 1); return { from: fmt(y), to: fmt(y) }; }
    case "7d": { const s = new Date(today); s.setDate(s.getDate() - 6); return { from: fmt(s), to: fmt(today) }; }
    case "30d": { const s = new Date(today); s.setDate(s.getDate() - 29); return { from: fmt(s), to: fmt(today) }; }
    case "this_month": { const s = new Date(today.getFullYear(), today.getMonth(), 1); return { from: fmt(s), to: fmt(today) }; }
    case "last_month": { const s = new Date(today.getFullYear(), today.getMonth() - 1, 1); const e = new Date(today.getFullYear(), today.getMonth(), 0); return { from: fmt(s), to: fmt(e) }; }
    default: return { from: "", to: "" };
  }
}

function useUrlState() {
  const read = useCallback(() => {
    const p = new URLSearchParams(window.location.search);
    return {
      product: p.get("product") || "all",
      method: p.get("method") || "all",
      language: p.get("language") || "all",
      outcome: p.get("outcome") || "all",
      dateFrom: p.get("dateFrom") || "",
      dateTo: p.get("dateTo") || "",
      q: p.get("q") || "",
      view: p.get("view") || "list",
      sort: p.get("sort") || "updated_desc",
    };
  }, []);
  const [state, setState] = useState(read);
  const write = useCallback((next) => {
    const p = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => { if (v && v !== "all" && v !== "list" && v !== "updated_desc") p.set(k, v); });
    const url = `${window.location.pathname}${p.toString() ? "?" + p.toString() : ""}`;
    window.history.replaceState({}, "", url);
    setState(next);
  }, []);
  return [state, write];
}

function SortIcon({ dir }) {
  if (!dir) return <ArrowUpDown size={12} className="sort" />;
  return dir === "asc" ? <ArrowUp size={12} className="sort" /> : <ArrowDown size={12} className="sort" />;
}

export default function ScriptsView({ products, teamLanguages = [], onOpen, onVariant, onGoStudio }) {
  const [rows, setRows] = useState(null);
  const [filters, setFilters] = useUrlState();
  const [confirmDel, setConfirmDel] = useState(null);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [syncing, setSyncing] = useState(null);
  const [syncErr, setSyncErr] = useState("");
  const [confirmSync, setConfirmSync] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showCols, setShowCols] = useState(false);
  const [visibleCols, setVisibleCols] = useState(() => {
    try {
      const raw = localStorage.getItem("ps_script_cols");
      if (raw) return new Set(JSON.parse(raw));
    } catch { /* noop */ }
    return new Set(COLUMNS_DEF.filter((c) => c.default).map((c) => c.key));
  });
  const [kpiFilter, setKpiFilter] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRef = useRef(null);
  const dropdownBtnRef = useRef(null);
  const dropdownPos = useDropdownPos(dropdownBtnRef, !!activeDropdown);
  useOutsideClick(dropdownRef, () => setActiveDropdown(null));

  const pageSize = filters.view === "cards" ? 12 : 20;
  const [page, setPage] = useState(1);

  const load = async () => {
    const keys = await S.listKeys("pscript:");
    const out = [];
    for (const k of keys) {
      const rec = await S.get(k);
      if (!rec || !rec.data) continue;
      const meta = rec.meta || parseScriptKey(k);
      out.push({ key: k, savedAt: rec.savedAt || 0, meta, outcome: rec.outcome || "pending" });
    }
    out.sort((a, b) => b.savedAt - a.savedAt);
    setRows(out);
    setSelected(new Set());
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { setPage(1); }, [filters, kpiFilter]);

  const del = async (key) => { await S.del(key); setConfirmDel(null); load(); };
  const bulkDelete = async () => { for (const key of selected) await S.del(key); setConfirmBulk(false); load(); };

  const productName = (m) => (products.find((p) => p.id === m.productId) || {}).name || m.productName || "Unknown product";

  const missingLangsFor = (meta) => {
    if (!teamLanguages.length) return [];
    return teamLanguages.filter((lid) => {
      if (lid === meta.language) return false;
      const k = scriptKey(meta.productId, { ...meta, language: lid });
      return !(rows || []).some((r) => r.key === k);
    });
  };

  const syncMissingForRow = async (rec) => {
    const missing = missingLangsFor(rec.meta);
    if (missing.length === 0) return;
    const prod = products.find((p) => p.id === rec.meta.productId);
    if (!prod) { setSyncErr("Product no longer exists."); return; }
    setSyncErr(""); setConfirmSync(null);
    const mObj = METHODS.find((m) => m.id === rec.meta.method);
    const cObj = CALL_TYPES.find((c) => c.id === rec.meta.callType);
    for (let i = 0; i < missing.length; i++) {
      const lid = missing[i];
      setSyncing({ current: i + 1, total: missing.length, langName: (LANGUAGES.find((l) => l.id === lid) || {}).name });
      try {
        const data = await generateScript({ product: prod, method: mObj, callType: cObj, duration: rec.meta.duration, language: lid, region: rec.meta.region, delivery: rec.meta.delivery, simple: rec.meta.simple, persona: rec.meta.persona });
        const k = scriptKey(prod.id, { ...rec.meta, language: lid });
        const metaSave = { ...rec.meta, productName: prod.name, language: lid };
        await S.set(k, { data, savedAt: Date.now(), meta: metaSave });
      } catch (e) {
        setSyncErr(`Failed on ${(LANGUAGES.find((l) => l.id === lid) || {}).name}: ${e.message}`);
        break;
      }
    }
    setSyncing(null); await load();
  };

  const bulkSyncMissing = async () => {
    setConfirmSync(null); setSyncErr("");
    const toDo = [];
    for (const key of selected) {
      const rec = (rows || []).find((r) => r.key === key);
      if (!rec) continue;
      missingLangsFor(rec.meta).forEach((lid) => toDo.push({ rec, lid }));
    }
    if (toDo.length === 0) return;
    for (let i = 0; i < toDo.length; i++) {
      const { rec, lid } = toDo[i];
      setSyncing({ current: i + 1, total: toDo.length, langName: `${(LANGUAGES.find((l) => l.id === lid) || {}).name} · ${(products.find((p) => p.id === rec.meta.productId) || {}).name || "?"}` });
      const prod = products.find((p) => p.id === rec.meta.productId);
      if (!prod) continue;
      const mObj = METHODS.find((m) => m.id === rec.meta.method);
      const cObj = CALL_TYPES.find((c) => c.id === rec.meta.callType);
      try {
        const data = await generateScript({ product: prod, method: mObj, callType: cObj, duration: rec.meta.duration, language: lid, region: rec.meta.region, delivery: rec.meta.delivery, simple: rec.meta.simple, persona: rec.meta.persona });
        const k = scriptKey(prod.id, { ...rec.meta, language: lid });
        const metaSave = { ...rec.meta, productName: prod.name, language: lid };
        await S.set(k, { data, savedAt: Date.now(), meta: metaSave });
      } catch (e) {
        setSyncErr(`Stopped on ${(LANGUAGES.find((l) => l.id === lid) || {}).name}: ${e.message}`); break;
      }
    }
    setSyncing(null); await load();
  };

  /* Filtering */
  const filtered = useMemo(() => {
    if (!rows) return [];
    let out = rows.filter((r) => {
      const m = r.meta;
      if (filters.product !== "all" && String(m.productId) !== filters.product) return false;
      if (filters.method !== "all" && m.method !== filters.method) return false;
      if (filters.language !== "all" && m.language !== filters.language) return false;
      if (filters.outcome !== "all" && (r.outcome || "pending") !== filters.outcome) return false;
      if (kpiFilter && (r.outcome || "pending") !== kpiFilter) return false;
      if (filters.dateFrom && r.savedAt < new Date(filters.dateFrom).getTime()) return false;
      if (filters.dateTo && r.savedAt > new Date(filters.dateTo).getTime() + 86400000) return false;
      if (filters.q) {
        const hay = (productName(m) + " " + (m.persona || "") + " " + nameOf(METHODS, m.method) + " " + nameOf(CALL_TYPES, m.callType) + " " + nameOf(LANGUAGES, m.language)).toLowerCase();
        if (!hay.includes(filters.q.toLowerCase())) return false;
      }
      return true;
    });
    /* Sorting */
    const [sortKey, sortDir] = filters.sort?.split("_") || ["updated", "desc"];
    out.sort((a, b) => {
      let av, bv;
      switch (sortKey) {
        case "method": av = nameOf(METHODS, a.meta.method); bv = nameOf(METHODS, b.meta.method); break;
        case "callType": av = nameOf(CALL_TYPES, a.meta.callType); bv = nameOf(CALL_TYPES, b.meta.callType); break;
        case "duration": av = a.meta.duration; bv = b.meta.duration; break;
        case "language": av = nameOf(LANGUAGES, a.meta.language); bv = nameOf(LANGUAGES, b.meta.language); break;
        case "region": av = nameOf(REGIONS, a.meta.region); bv = nameOf(REGIONS, b.meta.region); break;
        case "delivery": av = nameOf(DELIVERY, a.meta.delivery); bv = nameOf(DELIVERY, b.meta.delivery); break;
        case "outcome": av = a.outcome || "pending"; bv = b.outcome || "pending"; break;
        case "updated": default: av = a.savedAt; bv = b.savedAt; break;
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return out;
  }, [rows, filters, kpiFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const productIdsWithScripts = useMemo(() => [...new Set((rows || []).map((r) => r.meta.productId))], [rows]);

  const toggleSel = (key) => setSelected((s) => { const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n; });
  const allFilteredSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.key));
  const someSelected = selected.size > 0;
  const toggleAll = () => setSelected((s) => {
    const n = new Set(s);
    if (allFilteredSelected) filtered.forEach((r) => n.delete(r.key));
    else filtered.forEach((r) => n.add(r.key));
    return n;
  });

  const bulkMissingCount = someSelected ? [...selected].reduce((acc, key) => {
    const rec = (rows || []).find((r) => r.key === key);
    return rec ? acc + missingLangsFor(rec.meta).length : acc;
  }, 0) : 0;

  /* Stats */
  const stats = useMemo(() => {
    const s = { won: 0, lost: 0, no_deal: 0, pending: 0 };
    (filtered || []).forEach((r) => { s[r.outcome || "pending"] = (s[r.outcome || "pending"] || 0) + 1; });
    const decided = s.won + s.lost + s.no_deal;
    return { ...s, winRate: decided > 0 ? Math.round((s.won / decided) * 100) : 0, total: filtered.length };
  }, [filtered]);

  /* Column toggle */
  const toggleCol = (key) => {
    setVisibleCols((prev) => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      try { localStorage.setItem("ps_script_cols", JSON.stringify([...n])); } catch { /* noop */ }
      return n;
    });
  };

  /* Sort handler */
  const handleSort = (key) => {
    const [currKey, currDir] = filters.sort?.split("_") || ["updated", "desc"];
    let nextDir = "asc";
    if (currKey === key) nextDir = currDir === "asc" ? "desc" : "asc";
    setFilters({ ...filters, sort: `${key}_${nextDir}` });
  };

  const sortDirFor = (key) => {
    const [k, d] = filters.sort?.split("_") || ["updated", "desc"];
    return k === key ? d : null;
  };

  /* Date preset handler */
  const applyDatePreset = (id) => {
    const { from, to } = getDatePresetRange(id);
    setFilters({ ...filters, dateFrom: from, dateTo: to });
  };
  const activePreset = useMemo(() => {
    return DATE_PRESETS.find((p) => {
      const { from, to } = getDatePresetRange(p.id);
      return from === filters.dateFrom && to === filters.dateTo;
    })?.id || "custom";
  }, [filters.dateFrom, filters.dateTo]);

  const activeFilterCount = [filters.product, filters.method, filters.language, filters.outcome, filters.dateFrom, filters.dateTo].filter((v) => v && v !== "all").length + (kpiFilter ? 1 : 0);

  /* Render helpers */
  const renderKPI = () => {
    const decided = stats.won + stats.lost + stats.no_deal;
    return (
      <div className="dt-kpi">
        <div className="dt-kpi-stat dt-kpi-primary" onClick={() => setKpiFilter(null)}>
          <div className="dt-kpi-label">{stats.total} Scripts</div>
          <div className="dt-kpi-value" style={{ fontSize: 28 }}>{decided > 0 ? `${stats.winRate}%` : "—"}</div>
          <div className="lbl">{decided > 0 ? "win rate" : "No outcomes yet"}</div>
        </div>
        <div style={{ width: 1, background: "var(--line-soft)", margin: "0 4px", alignSelf: "stretch" }} />
        {OUTCOMES.map((o) => (
          <div
            key={o.id}
            className={`dt-kpi-stat ${kpiFilter === o.id ? "on" : ""}`}
            onClick={() => setKpiFilter(kpiFilter === o.id ? null : o.id)}
            title={`Filter to ${o.label}`}
          >
            <div className="dt-kpi-label">
              <span className="dt-kpi-dot" style={{ background: `var(--${o.color})` }} />
              {o.label}
            </div>
            <div className="dt-kpi-value" style={{ fontSize: 20 }}>{stats[o.id]}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderTableHeader = () => (
    <thead>
      <tr>
        <th style={{ width: 40, paddingLeft: 14 }}>
          <span className={`ck ${allFilteredSelected ? "on" : ""}`} onClick={toggleAll}>{allFilteredSelected ? "✓" : ""}</span>
        </th>
        {COLUMNS_DEF.filter((c) => visibleCols.has(c.key)).map((c) => (
          <th key={c.key} className={c.sortable ? `sort-${sortDirFor(c.key)}` : ""} onClick={() => c.sortable && handleSort(c.key)}>
            {c.label} {c.sortable && <SortIcon dir={sortDirFor(c.key)} />}
          </th>
        ))}
        <th style={{ width: 50 }} />
      </tr>
    </thead>
  );

  const renderTableRow = (r) => {
    const m = r.meta;
    const prodExists = products.some((p) => p.id === m.productId);
    const isSel = selected.has(r.key);
    const missing = prodExists ? missingLangsFor(m) : [];
    const updated = r.savedAt > 0 ? new Date(r.savedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—";
    const outcomeMeta = OUTCOMES.find((o) => o.id === (r.outcome || "pending")) || OUTCOMES[3];
    return (
      <tr
        key={r.key}
        className={isSel ? "sel" : ""}
        onClick={() => { if (prodExists) onOpen(r); }}
        style={{ cursor: prodExists ? "pointer" : "default" }}
      >
        <td style={{ paddingLeft: 14 }} onClick={(e) => e.stopPropagation()}>
          <span className={`ck ${isSel ? "on" : ""}`} onClick={() => toggleSel(r.key)}>{isSel ? "✓" : ""}</span>
        </td>
        {visibleCols.has("script") && (
          <td>
            <div className="dt-script-name">{productName(m)}</div>
            <div className="dt-script-meta">
              {nameOf(METHODS, m.method)} · {nameOf(CALL_TYPES, m.callType)} · {m.duration}m
              {m.persona && m.persona.toLowerCase() !== "general audience" && m.persona !== "general" ? ` · ${m.persona}` : ""}
            </div>
          </td>
        )}
        {visibleCols.has("method") && <td><span className="dt-pill accent">{nameOf(METHODS, m.method)}</span></td>}
        {visibleCols.has("callType") && <td><span className="dt-pill">{nameOf(CALL_TYPES, m.callType)}</span></td>}
        {visibleCols.has("duration") && <td>{m.duration} min</td>}
        {visibleCols.has("language") && <td>{nameOf(LANGUAGES, m.language)}</td>}
        {visibleCols.has("region") && <td>{nameOf(REGIONS, m.region)}</td>}
        {visibleCols.has("delivery") && <td><span className="dt-pill">{nameOf(DELIVERY, m.delivery)}{m.simple ? " · simple" : ""}</span></td>}
        {visibleCols.has("outcome") && <td><span className={`ds-status ${outcomeMeta.color}`}><span className="ds-status-dot" />{outcomeMeta.label}</span></td>}
        {visibleCols.has("updated") && <td style={{ color: "var(--muted)", fontSize: 12 }}>{updated}</td>}
        <td onClick={(e) => e.stopPropagation()}>
          <div className="dt-actions" ref={activeDropdown === r.key ? dropdownRef : null}>
            <button ref={activeDropdown === r.key ? dropdownBtnRef : null} className="dt-more-btn" onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === r.key ? null : r.key); }}>
              <MoreHorizontal size={16} />
            </button>
            {activeDropdown === r.key && dropdownPos && (
              <div className="dt-dropdown" style={dropdownPos}>
                {prodExists ? (
                  <>
                    <button className="dt-dropdown-item" onClick={(e) => { e.stopPropagation(); onOpen(r); setActiveDropdown(null); }}>
                      <FileText size={14} /> Open
                    </button>
                    <button className="dt-dropdown-item" onClick={(e) => { e.stopPropagation(); onVariant(r); setActiveDropdown(null); }}>
                      <Sparkles size={14} /> Generate variant
                    </button>
                    <button className="dt-dropdown-item" onClick={(e) => {
                      e.stopPropagation();
                      const text = `${productName(m)} | ${nameOf(METHODS, m.method)} | ${nameOf(CALL_TYPES, m.callType)} | ${m.duration}m | ${nameOf(LANGUAGES, m.language)} | Outcome: ${r.outcome || "pending"} | Updated: ${updated}`;
                      navigator.clipboard.writeText(text);
                      setActiveDropdown(null);
                    }}>
                      <Copy size={14} /> Copy details
                    </button>
                    {missing.length > 0 && (
                      <button className="dt-dropdown-item" onClick={(e) => { e.stopPropagation(); setConfirmSync({ rec: r, missing }); setActiveDropdown(null); }}>
                        <Globe size={14} /> Sync {missing.length} language{missing.length === 1 ? "" : "s"}
                      </button>
                    )}
                    <div className="dt-dropdown-sep" />
                  </>
                ) : (
                  <div className="dt-dropdown-label">Product removed</div>
                )}
                <button className="dt-dropdown-item danger" onClick={(e) => { e.stopPropagation(); setConfirmDel(r); setActiveDropdown(null); }}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            )}
          </div>
        </td>
      </tr>
    );
  };

  const renderTable = () => (
    <div className="dt-table-wrap">
    <table className="dt-table">
      {renderTableHeader()}
      <tbody>
        {paginated.map(renderTableRow)}
        {filtered.length === 0 && (
          <tr><td colSpan={visibleCols.size + 2} className="dt-empty-cell">
            <div className="ds-empty-state">
              <div className="icon"><Search size={24} /></div>
              <h3>No scripts match your filters</h3>
              <p>Try removing a filter or changing your search.</p>
              <div className="actions">
                <button className="ds-btn-sec" onClick={() => { setFilters({ product:"all", method:"all", language:"all", outcome:"all", dateFrom:"", dateTo:"", q:"", view:filters.view, sort:filters.sort }); setKpiFilter(null); }}>
                  <X size={14} /> Clear all filters
                </button>
              </div>
            </div>
          </td></tr>
        )}
      </tbody>
    </table>
    </div>
  );

  const renderCards = () => (
    <div className="ps-grid">
      {paginated.map((r) => {
        const m = r.meta;
        const prodExists = products.some((p) => p.id === m.productId);
        const isSel = selected.has(r.key);
        const missing = prodExists ? missingLangsFor(m) : [];
        const updated = r.savedAt > 0 ? new Date(r.savedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—";
        return (
          <div key={r.key} className="pcard" style={{ borderColor: isSel ? "var(--accent)" : undefined, background: isSel ? "var(--accent-bg)" : undefined }} onClick={() => prodExists && onOpen(r)}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <span className={`ck ${isSel ? "on" : ""}`} onClick={(e) => { e.stopPropagation(); toggleSel(r.key); }}>{isSel ? "✓" : ""}</span>
              <span className="cat">{productName(m)}</span>
            </div>
            <div className="nm" style={{ fontSize: 16 }}>{nameOf(METHODS, m.method)} · {nameOf(CALL_TYPES, m.callType)} · {m.duration}m</div>
            <div className="ln" style={{ fontSize: 12.5 }}>
              {nameOf(LANGUAGES, m.language)} · {nameOf(REGIONS, m.region)} · {nameOf(DELIVERY, m.delivery)}{m.simple ? " · simple" : ""}
              {m.persona && m.persona.toLowerCase() !== "general audience" && m.persona !== "general" && <span> · {m.persona}</span>}
              {missing.length > 0 && <span style={{ color: "var(--amber)", fontWeight: 600 }}> · missing {missing.length}</span>}
            </div>
            <div className="foot" style={{ flexWrap: "wrap", gap: 6 }}>
              {prodExists ? (
                <>
                  <button className="ps-btn pri sm" onClick={(e) => { e.stopPropagation(); onOpen(r); }}>Open</button>
                  <button className="ps-btn subtle sm" onClick={(e) => { e.stopPropagation(); onVariant(r); }}>Generate variant</button>
                  {missing.length > 0 && (
                    <button className="ps-btn subtle sm" disabled={!!syncing} onClick={(e) => { e.stopPropagation(); setConfirmSync({ rec: r, missing }); }}>Sync {missing.length}</button>
                  )}
                </>
              ) : (
                <span className="chip" title="The product for this script was deleted">product removed</span>
              )}
              <button className="ps-btn danger sm" disabled={!!syncing} onClick={(e) => { e.stopPropagation(); setConfirmDel(r); }}>Delete</button>
            </div>
            {r.savedAt > 0 && <div className="lib-date">Updated {updated}</div>}
          </div>
        );
      })}
      {filtered.length === 0 && (
        <div className="ds-empty-state" style={{ gridColumn: "1 / -1" }}>
          <div className="icon"><Search size={24} /></div>
          <h3>No scripts match your filters</h3>
          <p>Try removing a filter or changing your search.</p>
          <div className="actions">
            <button className="ds-btn-sec" onClick={() => { setFilters({ product:"all", method:"all", language:"all", outcome:"all", dateFrom:"", dateTo:"", q:"", view:filters.view, sort:filters.sort }); setKpiFilter(null); }}>
              <X size={14} /> Clear all filters
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderPagination = () => {
    if (filtered.length <= pageSize) return null;
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, filtered.length);
    return (
      <div className="ds-pagination">
        <span className="ds-pagination-info">Showing {start}–{end} of {filtered.length}</span>
        <div className="ds-pagination-actions">
          <button className="ds-btn-ico" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
            <ChevronLeft size={16} />
          </button>
          <span className="ds-pagination-pages">Page {page} of {totalPages}</span>
          <button className="ds-btn-ico" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  const renderSkeleton = () => (
    <div>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="dt-skeleton-row">
          <div className="dt-skeleton-cell" style={{ width: 18, height: 18 }} />
          <div className="dt-skeleton-cell wide" />
          <div className="dt-skeleton-cell" />
          <div className="dt-skeleton-cell" />
          <div className="dt-skeleton-cell" />
          <div className="dt-skeleton-cell" />
          <div className="dt-skeleton-cell short" />
        </div>
      ))}
    </div>
  );

  return (
    <>
      <div className="ps-top">
        <div style={{ flex: 1 }}>
          <div className="ps-eyebrow">Workspace</div>
          <div className="ps-title">Saved scripts</div>
          <div className="ps-sub">Every script you've generated, in one place. Filter, compare, and manage in bulk.</div>
        </div>
      </div>
      <div className="ps-body">
        {rows === null ? (
          <>
            {renderSkeleton()}
          </>
        ) : rows.length === 0 ? (
          <div className="ds-empty-state">
            <div className="icon"><Inbox size={24} /></div>
            <h3>No saved scripts yet</h3>
            <p>Generate a script in the Call Studio and it will show up here automatically, ready to reopen with one click.</p>
            <div className="actions">
              <button className="ds-btn-pri" onClick={onGoStudio}>Go to Call Studio</button>
            </div>
          </div>
        ) : (
          <div className="dt-wrap">
            {/* KPI bar */}
            {renderKPI()}

            {/* Search + toolbar */}
            <div className="dt-header">
              <div className="dt-search">
                <Search size={15} className="dt-search-icon" />
                <input
                  type="text"
                  placeholder="Search scripts, products, personas..."
                  value={filters.q}
                  onChange={(e) => setFilters({ ...filters, q: e.target.value })}
                />
              </div>
              <button className={`dt-filter-btn ${activeFilterCount > 0 ? "on" : ""}`} onClick={() => setShowFilters((s) => !s)}>
                <SlidersHorizontal size={14} /> Filters {activeFilterCount > 0 && <span className="count">{activeFilterCount}</span>}
              </button>
              <div style={{ position: "relative" }}>
                <button className="dt-filter-btn" onClick={() => setShowCols((s) => !s)}>
                  <Columns size={14} /> Columns
                </button>
                {showCols && (
                  <div className="dt-col-popover">
                    <div className="dt-col-popover-title">Show columns</div>
                    {COLUMNS_DEF.map((c) => (
                      <label key={c.key} className="dt-col-item" onClick={(e) => { e.preventDefault(); toggleCol(c.key); }}>
                        <input type="checkbox" checked={visibleCols.has(c.key)} readOnly />
                        {c.label}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div className="dt-view-toggle">
                <button className={filters.view === "list" ? "on" : ""} onClick={() => setFilters({ ...filters, view: "list" })}>
                  <List size={14} /> List
                </button>
                <button className={filters.view === "cards" ? "on" : ""} onClick={() => setFilters({ ...filters, view: "cards" })}>
                  <LayoutGrid size={14} /> Cards
                </button>
              </div>
            </div>

            {/* Filter panel */}
            {showFilters && (
              <div className="dt-filter-panel">
                <div className="dt-filter-group">
                  <label>Product</label>
                  <select className="fsel" value={filters.product} onChange={(e) => setFilters({ ...filters, product: e.target.value })}>
                    <option value="all">All products</option>
                    {products.filter((p) => productIdsWithScripts.includes(p.id)).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="dt-filter-group">
                  <label>Method</label>
                  <select className="fsel" value={filters.method} onChange={(e) => setFilters({ ...filters, method: e.target.value })}>
                    <option value="all">All methods</option>
                    {METHODS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="dt-filter-group">
                  <label>Language</label>
                  <select className="fsel" value={filters.language} onChange={(e) => setFilters({ ...filters, language: e.target.value })}>
                    <option value="all">All languages</option>
                    {LANGUAGES.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <div className="dt-filter-group">
                  <label>Outcome</label>
                  <select className="fsel" value={filters.outcome} onChange={(e) => setFilters({ ...filters, outcome: e.target.value })}>
                    <option value="all">All outcomes</option>
                    {OUTCOMES.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                </div>
                <div className="dt-filter-group" style={{ gridColumn: "1 / -1" }}>
                  <label>Date range</label>
                  <div className="dt-date-presets">
                    {DATE_PRESETS.map((p) => (
                      <button key={p.id} className={`dt-date-preset ${activePreset === p.id ? "on" : ""}`} onClick={() => applyDatePreset(p.id)}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 8, alignItems: "center" }}>
                    <input className="finp" type="date" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} style={{ maxWidth: 160, fontSize: 13 }} />
                    <span style={{ color: "var(--muted)", fontSize: 12 }}>to</span>
                    <input className="finp" type="date" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} style={{ maxWidth: 160, fontSize: 13 }} />
                  </div>
                </div>
                <div className="dt-filter-actions">
                  <button className="ps-btn ghost sm" onClick={() => { setFilters({ ...filters, product: "all", method: "all", language: "all", outcome: "all", dateFrom: "", dateTo: "" }); setKpiFilter(null); }}>
                    <X size={14} /> Clear filters
                  </button>
                  <button className="ps-btn pri sm" onClick={() => setShowFilters(false)}>Done</button>
                </div>
              </div>
            )}

            {/* Bulk toolbar */}
            {someSelected && (
              <div className="dt-bulk">
                <span className="dt-bulk-count">{selected.size} selected</span>
                <div className="dt-bulk-actions">
                  <button className="dt-bulk-btn" onClick={() => {
                    const lines = filtered.filter((r) => selected.has(r.key)).map((r) => {
                      const m = r.meta;
                      return `${productName(m)} | ${nameOf(METHODS, m.method)} | ${nameOf(CALL_TYPES, m.callType)} | ${m.duration}m | ${nameOf(LANGUAGES, m.language)} | Outcome: ${r.outcome || "pending"}`;
                    }).join("\n");
                    navigator.clipboard.writeText(lines);
                  }}>
                    <Copy size={14} /> Export
                  </button>
                  {bulkMissingCount > 0 && teamLanguages.length > 1 && (
                    <button className="dt-bulk-btn" onClick={() => setConfirmSync("bulk")} disabled={!!syncing}>
                      <Globe size={14} /> Sync {bulkMissingCount} languages
                    </button>
                  )}
                  <div className="dt-dropdown-sep" style={{ margin: "0 4px", height: 18, width: 1, background: "var(--line)" }} />
                  <button className="dt-bulk-btn danger" onClick={() => setConfirmBulk(true)}>
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            )}

            {/* Active filter chips */}
            {activeFilterCount > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12, alignItems: "center" }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".04em" }}>Active:</span>
                {filters.product !== "all" && (
                  <span className="dt-chip-removable">
                    {productName({ productId: filters.product })}
                    <button onClick={() => setFilters({ ...filters, product: "all" })}><X size={12} /></button>
                  </span>
                )}
                {filters.method !== "all" && (
                  <span className="dt-chip-removable">
                    {nameOf(METHODS, filters.method)}
                    <button onClick={() => setFilters({ ...filters, method: "all" })}><X size={12} /></button>
                  </span>
                )}
                {filters.language !== "all" && (
                  <span className="dt-chip-removable">
                    {nameOf(LANGUAGES, filters.language)}
                    <button onClick={() => setFilters({ ...filters, language: "all" })}><X size={12} /></button>
                  </span>
                )}
                {filters.outcome !== "all" && (
                  <span className="dt-chip-removable">
                    {OUTCOMES.find((o) => o.id === filters.outcome)?.label}
                    <button onClick={() => setFilters({ ...filters, outcome: "all" })}><X size={12} /></button>
                  </span>
                )}
                {kpiFilter && (
                  <span className="dt-chip-removable">
                    {OUTCOMES.find((o) => o.id === kpiFilter)?.label}
                    <button onClick={() => setKpiFilter(null)}><X size={12} /></button>
                  </span>
                )}
                {(filters.dateFrom || filters.dateTo) && (
                  <span className="dt-chip-removable">
                    {filters.dateFrom && filters.dateTo ? `${filters.dateFrom} → ${filters.dateTo}` : filters.dateFrom || filters.dateTo}
                    <button onClick={() => setFilters({ ...filters, dateFrom: "", dateTo: "" })}><X size={12} /></button>
                  </span>
                )}
                <button className="ps-btn-ghost" style={{ fontSize: 11.5 }} onClick={() => { setFilters({ ...filters, product: "all", method: "all", language: "all", outcome: "all", dateFrom: "", dateTo: "" }); setKpiFilter(null); }}>Clear all</button>
              </div>
            )}

            {syncing && (
              <div className="sync-progress">
                <span className="spinner dark" />
                Generating language {syncing.current} of {syncing.total}: <b>{syncing.langName}</b>
              </div>
            )}
            {syncErr && <div className="err">{syncErr}</div>}

            {/* Content */}
            {!someSelected && (
              <div style={{ marginBottom: 8, fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>
                {filtered.length} of {rows.length} script{rows.length === 1 ? "" : "s"}
              </div>
            )}

            {filters.view === "list" ? renderTable() : renderCards()}
            {renderPagination()}
          </div>
        )}
      </div>

      {/* Modals */}
      {confirmDel && (
        <div className="overlay" onClick={() => setConfirmDel(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Delete this script?</div>
            <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.55, marginBottom: 20 }}>
              {productName(confirmDel.meta)} · {nameOf(METHODS, confirmDel.meta.method)} · {nameOf(CALL_TYPES, confirmDel.meta.callType)} · {confirmDel.meta.duration} min. You can always regenerate it later.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="ps-btn ghost" onClick={() => setConfirmDel(null)}>Keep it</button>
              <button className="ps-btn danger" onClick={() => del(confirmDel.key)}>Delete script</button>
            </div>
          </div>
        </div>
      )}

      {confirmBulk && (
        <div className="overlay" onClick={() => setConfirmBulk(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Delete {selected.size} script{selected.size === 1 ? "" : "s"}?</div>
            <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.55, marginBottom: 20 }}>This permanently removes the selected scripts from your workspace. You can regenerate any of them later.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="ps-btn ghost" onClick={() => setConfirmBulk(false)}>Cancel</button>
              <button className="ps-btn danger" onClick={bulkDelete}>Delete {selected.size}</button>
            </div>
          </div>
        </div>
      )}

      {confirmSync && (
        <div className="overlay" onClick={() => setConfirmSync(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
              {confirmSync === "bulk" ? `Generate ${bulkMissingCount} missing language${bulkMissingCount === 1 ? "" : "s"}?` : `Generate ${confirmSync.missing.length} missing language${confirmSync.missing.length === 1 ? "" : "s"}?`}
            </div>
            <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.55, marginBottom: 8 }}>
              This will call the AI for each missing language and save the results. It takes a few seconds per language.
            </p>
            {confirmSync !== "bulk" && (
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>
                Missing: {confirmSync.missing.map((id) => (LANGUAGES.find((l) => l.id === id) || {}).name).join(", ")}
              </p>
            )}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="ps-btn ghost" onClick={() => setConfirmSync(null)}>Cancel</button>
              <button className="ps-btn pri" onClick={() => confirmSync === "bulk" ? bulkSyncMissing() : syncMissingForRow(confirmSync.rec)}>Generate now</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
