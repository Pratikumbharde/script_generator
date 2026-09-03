import React, { useState, useEffect, useMemo, useRef } from "react";
import LimitedInput from "./shared/LimitedInput.jsx";
import { listScripts } from "../api/client.js";
import {
  Search, LayoutGrid, List, Trash2, Pencil, X,
  CheckCircle2, Clock, Sparkles,
  MoreHorizontal, FileText, Copy, Archive, RotateCcw,
  ArrowRight, Eye, SlidersHorizontal, ChevronLeft, ChevronRight, Boxes
} from "lucide-react";

/* ============================================================
   ProductsView — Enterprise product hub (P8.3)
   Unified card + list experience. Status: Draft / Ready / Active.
   Inline quick actions. Consistent with Pitch Studio design system.
   ============================================================ */

function useOutsideClick(ref, handler) {
  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) handler(); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [ref, handler]);
}

/* Strip markdown syntax for clean list-view display */
function stripMarkdown(text) {
  if (!text) return "";
  return String(text)
    .replace(/#{1,6}\s+/g, "")           // headings
    .replace(/\*\*(.+?)\*\*/g, "$1")    // bold
    .replace(/\*(.+?)\*/g, "$1")        // italic
    .replace(/__(.+?)__/g, "$1")        // bold alt
    .replace(/_(.+?)_/g, "$1")           // italic alt
    .replace(/`{1,3}(.+?)`{1,3}/g, "$1") // inline code / code blocks
    .replace(/\[(.+?)\]\(.+?\)/g, "$1") // links
    .replace(/!\[.*?\]\(.+?\)/g, "")    // images
    .replace(/\n{2,}/g, " ")             // paragraph breaks → space
    .replace(/\s+/g, " ")                // collapse whitespace
    .trim();
}

/* Truncate to N chars with ellipsis */
function truncate(text, max = 120) {
  if (!text || text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

function aiReadiness(p) {
  const fields = [
    { key: "one_liner", weight: 15, label: "One-liner" },
    { key: "description", weight: 15, label: "Description" },
    { key: "ideal_customer", weight: 15, label: "Ideal customer" },
    { key: "pain_points", weight: 15, label: "Pain points" },
    { key: "differentiators", weight: 15, label: "Differentiators" },
    { key: "proof_points", weight: 10, label: "Proof points" },
    { key: "competitors", weight: 10, label: "Competitors" },
    { key: "price_model", weight: 5, label: "Pricing" },
  ];
  let score = 0;
  const missing = [];
  fields.forEach((f) => {
    const val = p[f.key];
    const ok = val && String(val).trim().length > 5;
    if (ok) score += f.weight;
    else missing.push(f.label);
  });
  return { score, missing, fields };
}

/* Status: Auto-computed based on profile completeness
   Draft:     Nothing filled in yet (or only minor fields)
   Ready:     At least one key field has content (one-liner, description, or ICP)
   Active:    All key fields are complete (one-liner, description, ICP, pain points, differentiators)
   Archived:  Manually archived by user */
function statusOf(p, archived) {
  if (archived) return "archived";
  const has = (k) => !!(p[k] && String(p[k]).trim().length > 5);
  if (has("one_liner") && has("description") && has("ideal_customer") && has("pain_points") && has("differentiators")) return "active";
  if (has("one_liner") || has("description") || has("ideal_customer")) return "ready";
  return "draft";
}

const STATUS_META = {
  active:   { label: "Active", color: "#1A7F5B", bg: "#E6F6EF", statusClass: "ok" },
  ready:    { label: "Ready",  color: "#2B4CF0", bg: "#EAEEFE", statusClass: "accent" },
  draft:    { label: "Draft",  color: "#B5720F", bg: "#FDF2E6", statusClass: "warn" },
  archived: { label: "Archived", color: "#6B7B93", bg: "#F2F5FA", statusClass: "neu" },
};

function fmtDate(ts) {
  if (!ts) return "";
  // SQLite CURRENT_TIMESTAMP is UTC but lacks the Z suffix — normalize it
  const normalized = typeof ts === 'string' && !ts.endsWith('Z') && !ts.includes('+') ? ts + 'Z' : ts;
  const d = new Date(normalized);
  if (isNaN(d.getTime())) return "";
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

export default function ProductsView({ products, company, onOpen, onAdd, onSetup, onEdit, onDelete, onDuplicate }) {
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState(() => {
    try { return localStorage.getItem("ps_products_view") || "cards"; } catch { return "cards"; }
  });
  const [scripts, setScripts] = useState([]);
  const [confirmDel, setConfirmDel] = useState(null);
  const [name, setName] = useState("");

  // Filters + pagination
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = viewMode === "cards" ? 12 : 10;

  // Dropdown menu
  const [activeMenu, setActiveMenu] = useState(null);
  const menuRef = useRef(null);
  useOutsideClick(menuRef, () => setActiveMenu(null));

  // AI readiness popover
  const [activeReadiness, setActiveReadiness] = useState(null);
  const readinessRef = useRef(null);
  useOutsideClick(readinessRef, () => setActiveReadiness(null));

  // Archive (local until backend adds archived flag)
  const [archivedIds, setArchivedIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("ps_archived_products") || "[]")); } catch { return new Set(); }
  });
  const persistArchived = (ids) => {
    setArchivedIds(ids);
    try { localStorage.setItem("ps_archived_products", JSON.stringify([...ids])); } catch { /* noop */ }
  };
  const archiveProduct = (id) => {
    const n = new Set(archivedIds);
    n.add(id);
    persistArchived(n);
  };
  const unarchiveProduct = (id) => {
    const n = new Set(archivedIds);
    n.delete(id);
    persistArchived(n);
  };

  useEffect(() => {
    let live = true;
    (async () => {
      const s = await listScripts();
      if (!live) return;
      setScripts(s || []);
    })();
    return () => { live = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = products;
    if (q) {
      list = list.filter((p) =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q) ||
        (p.one_liner || p.oneLiner || "").toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      list = list.filter((p) => statusOf(p, archivedIds.has(p.id)) === statusFilter);
    }
    return list;
  }, [products, query, statusFilter, archivedIds]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const scriptCount = (pid) => scripts.filter((s) => (s.meta?.productId || s.product_id) === pid).length;

  const toggleView = (mode) => {
    setViewMode(mode);
    try { localStorage.setItem("ps_products_view", mode); } catch { /* noop */ }
  };

  const ActionMenu = ({ p, alignRight = true }) => {
    const isArchived = archivedIds.has(p.id);
    const open = activeMenu === p.id;
    const btnRef = useRef(null);
    const [pos, setPos] = useState(null);

    useEffect(() => {
      if (open && btnRef.current) {
        const rect = btnRef.current.getBoundingClientRect();
        const dropdownWidth = 180;
        const dropdownPadding = 8;
        // Prefer right-aligned, but shift left if it overflows
        let left, right;
        if (alignRight) {
          right = window.innerWidth - rect.right;
          left = undefined;
          // If right-aligned dropdown would overflow left, shift right
          if (window.innerWidth - right - dropdownWidth < dropdownPadding) {
            right = dropdownPadding;
          }
        } else {
          left = rect.left;
          right = undefined;
          // If left-aligned dropdown would overflow right, shift left
          if (left + dropdownWidth > window.innerWidth - dropdownPadding) {
            left = window.innerWidth - dropdownWidth - dropdownPadding;
          }
        }
        // If dropdown would overflow bottom, open upward
        const estimatedHeight = 200;
        let top = rect.bottom + 4;
        if (top + estimatedHeight > window.innerHeight - dropdownPadding) {
          top = rect.top - estimatedHeight - 4;
        }
        setPos({
          top: Math.max(dropdownPadding, top),
          ...(right !== undefined ? { right } : { left }),
          position: "fixed",
          marginTop: 0,
          zIndex: 100,
        });
      } else {
        setPos(null);
      }
    }, [open, alignRight]);

    return (
      <div className="dt-actions" ref={open ? menuRef : null}>
        <button
          ref={btnRef}
          className="dt-more-btn"
          onClick={(e) => { e.stopPropagation(); setActiveMenu(open ? null : p.id); }}
          title="Actions"
        >
          <MoreHorizontal size={16} />
        </button>
        {open && pos && (
          <div
            className="dt-dropdown"
            style={pos}
          >
            <button className="dt-dropdown-item" onClick={(e) => { e.stopPropagation(); onOpen(p); setActiveMenu(null); }}>
              <Eye size={14} /> Open
            </button>
            <button className="dt-dropdown-item" onClick={(e) => { e.stopPropagation(); onEdit(p); setActiveMenu(null); }}>
              <Pencil size={14} /> Edit
            </button>
            {onDuplicate && (
              <button className="dt-dropdown-item" onClick={(e) => { e.stopPropagation(); onDuplicate(p); setActiveMenu(null); }}>
                <Copy size={14} /> Duplicate
              </button>
            )}
            <div className="dt-dropdown-sep" />
            {isArchived ? (
              <button className="dt-dropdown-item" onClick={(e) => { e.stopPropagation(); unarchiveProduct(p.id); setActiveMenu(null); }}>
                <RotateCcw size={14} /> Unarchive
              </button>
            ) : (
              <button className="dt-dropdown-item" onClick={(e) => { e.stopPropagation(); archiveProduct(p.id); setActiveMenu(null); }}>
                <Archive size={14} /> Archive
              </button>
            )}
            <button className="dt-dropdown-item danger" title="Delete" onClick={(e) => { e.stopPropagation(); setConfirmDel(p); setActiveMenu(null); }}>
              <Trash2 size={14} /> Delete
            </button>
          </div>
        )}
      </div>
    );
  };

  /* ---------- Card view ---------- */
  const CardItem = ({ p }) => {
    const { score: readiness, missing } = aiReadiness(p);
    const st = statusOf(p, archivedIds.has(p.id));
    const stMeta = STATUS_META[st];
    const sc = scriptCount(p.id);
    const desc = (p.one_liner || p.oneLiner || p.description || "").trim();
    return (
      <div key={p.id} className={`epc-card ${st === "archived" ? "archived" : ""}`} onClick={() => onOpen(p)}>
        {/* Top row: category + status */}
        <div className="epc-top">
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {p.category && <span className="dt-pill" style={{ fontSize: 10, letterSpacing: ".06em", textTransform: "uppercase", fontWeight: 700, color: "var(--accent)", background: "var(--accent-bg)", padding: "2px 8px" }}>{p.category}</span>}
            <span className={`ds-status ${stMeta.statusClass}`}><span className="ds-status-dot" />{stMeta.label}</span>
          </div>
        </div>

        {/* Name + description */}
        <div className="epc-name" title={p.name}>{p.name}</div>
        <div className="epc-desc">{desc || "No description added"}</div>

        {/* Meta: scripts + date + readiness */}
        <div className="epc-meta">
          <span className="epc-meta-item"><b>{sc}</b> script{sc === 1 ? "" : "s"}</span>
          <span className="epc-meta-item">{p.updated_at ? `Updated ${fmtDate(p.updated_at)}` : `Created ${fmtDate(p.created_at || p.createdAt)}`}</span>
          <span className="epc-meta-item" style={{ marginLeft: "auto" }} onClick={(e) => { e.stopPropagation(); setActiveReadiness(activeReadiness === p.id ? null : p.id); }}>
            <Sparkles size={11} style={{ color: readiness >= 80 ? "var(--ok)" : readiness >= 50 ? "var(--amber)" : "#B23237" }} />
            <span style={{ fontWeight: 600, color: "var(--ink)" }}>{readiness}%</span> AI ready
          </span>
        </div>

        {/* Readiness popover */}
        {activeReadiness === p.id && (
          <div ref={readinessRef} className="pv-readiness-popover" onClick={(e) => e.stopPropagation()} style={{ top: "auto", bottom: "calc(100% + 8px)", left: 0, right: 0, margin: "0 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Sparkles size={14} />
              <span style={{ fontWeight: 700, fontSize: 13 }}>AI Readiness · {readiness}%</span>
            </div>
            <div className="pv-r-bar" style={{ width: "100%", marginBottom: 10 }}>
              <div className="pv-r-fill" style={{ width: `${readiness}%`, background: readiness >= 80 ? "#1A7F5B" : readiness >= 50 ? "#B5720F" : "#B23237" }} />
            </div>
            {missing.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>Missing</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 10px" }}>
                  {missing.map((m) => (
                    <div key={m} style={{ fontSize: 12, color: "var(--faint)" }}>○ {m}</div>
                  ))}
                </div>
              </>
            )}
            {missing.length === 0 && (
              <div style={{ fontSize: 12, color: "var(--ok)" }}>✓ All fields complete</div>
            )}
            <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid var(--line-soft)" }}>
              <button className="ps-btn ghost sm" style={{ width: "100%", justifyContent: "center" }} onClick={(e) => { e.stopPropagation(); onEdit(p); setActiveReadiness(null); }}>
                Complete product <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Inline quick actions (hover reveal) */}
        <div className="epc-actions" onClick={(e) => e.stopPropagation()}>
          <button className="epc-act-open" title="Open" onClick={(e) => { e.stopPropagation(); onOpen(p); }}><Eye size={13} /> Open</button>
          <button className="epc-act-edit" title="Edit" onClick={(e) => { e.stopPropagation(); onEdit(p); }}><Pencil size={13} /> Edit</button>
          <button className="epc-act-del" title="Delete" onClick={(e) => { e.stopPropagation(); setConfirmDel(p); }}><Trash2 size={13} /></button>
          <div style={{ marginLeft: "auto" }}><ActionMenu p={p} /></div>
        </div>

        {/* Delete confirmation */}
        {confirmDel?.id === p.id && (
          <div className="pv-del" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Delete <strong>{p.name}</strong>?</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>This also removes its scripts.</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="ps-btn ghost sm" onClick={(e) => { e.stopPropagation(); setConfirmDel(null); }}>Cancel</button>
              <button className="ps-btn pri sm" style={{ background: "#E74C3C", borderColor: "#E74C3C" }} onClick={async (e) => { e.stopPropagation(); try { await onDelete(p); } catch (e2) { console.error("Delete failed:", e2); } setConfirmDel(null); }}>Delete</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ---------- List view ---------- */
  const ListItem = ({ p }) => {
    const { score: readiness, missing } = aiReadiness(p);
    const st = statusOf(p, archivedIds.has(p.id));
    const stMeta = STATUS_META[st];
    const sc = scriptCount(p.id);
    const rawDesc = (p.one_liner || p.oneLiner || p.description || "").trim();
    const desc = truncate(stripMarkdown(rawDesc), 140);
    return (
      <tr key={p.id} onClick={() => onOpen(p)} className={st === "archived" ? "archived" : ""}>
        {/* Product — 38% */}
        <td style={{ width: "38%" }}>
          <div className="dt-script-name">{p.name}</div>
          <div className="dt-script-meta" title={desc || ""}>{desc || "No description added"}</div>
        </td>
        {/* Status — 14% */}
        <td style={{ width: "14%" }}>
          <span className={`ds-status ${stMeta.statusClass}`}><span className="ds-status-dot" />{stMeta.label}</span>
        </td>
        {/* AI Readiness — 20% */}
        <td style={{ width: "20%", cursor: "pointer", position: "relative" }} onClick={(e) => { e.stopPropagation(); setActiveReadiness(activeReadiness === p.id ? null : p.id); }}>
          <div className="pv-readiness-inline">
            <div className="pv-r-bar"><div className="pv-r-fill" style={{ width: `${readiness}%`, background: readiness >= 80 ? "#1A7F5B" : readiness >= 50 ? "#B5720F" : "#B23237" }} /></div>
            <span className="pv-r-label">{readiness}%</span>
          </div>
          {activeReadiness === p.id && (
            <div ref={readinessRef} className="pv-readiness-popover table" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Sparkles size={14} />
                <span style={{ fontWeight: 700, fontSize: 13 }}>AI Readiness · {readiness}%</span>
              </div>
              <div className="pv-r-bar" style={{ width: "100%", marginBottom: 10 }}>
                <div className="pv-r-fill" style={{ width: `${readiness}%`, background: readiness >= 80 ? "#1A7F5B" : readiness >= 50 ? "#B5720F" : "#B23237" }} />
              </div>
              {missing.length > 0 && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>Missing</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 10px" }}>
                    {missing.map((m) => (
                      <div key={m} style={{ fontSize: 12, color: "var(--faint)" }}>○ {m}</div>
                    ))}
                  </div>
                </>
              )}
              {missing.length === 0 && (
                <div style={{ fontSize: 12, color: "var(--ok)" }}>✓ All fields complete</div>
              )}
              <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid var(--line-soft)" }}>
                <button className="ps-btn ghost sm" style={{ width: "100%", justifyContent: "center" }} onClick={(e) => { e.stopPropagation(); onEdit(p); setActiveReadiness(null); }}>
                  Complete product <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </td>
        {/* Scripts — 8% */}
        <td style={{ width: "8%", textAlign: "center" }}><b>{sc}</b></td>
        {/* Date — 14% */}
        <td style={{ width: "14%", color: "var(--muted)", fontSize: 12.5 }}>{p.updated_at ? `Upd ${fmtDate(p.updated_at)}` : fmtDate(p.created_at || p.createdAt)}</td>
        {/* Actions — 6% */}
        <td style={{ width: "6%" }} onClick={(e) => e.stopPropagation()}>
          <ActionMenu p={p} alignRight={false} />
        </td>
      </tr>
    );
  };

  return (
    <>
      <div className="ps-top">
        <div>
          <div className="ps-eyebrow">Workspace</div>
          <div className="ps-title"><Boxes size={22} style={{ marginRight: 8, verticalAlign: "-3px" }} />Products</div>
          <div className="ps-sub">{products.length} product{products.length === 1 ? "" : "s"} — configure profiles, generate scripts, and run live calls.</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {products.length > 0 && <button className="ps-btn pri" onClick={onAdd}><span style={{ fontSize: 16, lineHeight: 1 }}>＋</span> Add product</button>}
        </div>
      </div>

      <div className="ps-body">
        {!company && (
          <div className="ps-card" style={{ marginBottom: 18, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 600, marginBottom: 3 }}>Name your workspace</div>
              <div style={{ color: "var(--muted)", fontSize: 13 }}>This is the company your team logs into. You can add staff under Team.</div>
            </div>
            <LimitedInput className="finp" style={{ maxWidth: 240 }} placeholder="e.g. Northwind Sales" value={name} onChange={(e) => setName(e.target.value)} maxLength={200} />
            <button className="ps-btn pri" disabled={!name.trim()} onClick={() => onSetup(name.trim())}>Save</button>
          </div>
        )}

        {/* Toolbar: Search → Filters → View toggle */}
        {products.length > 0 && (
          <div className="dt-header">
            <div className="dt-search">
              <Search size={15} className="dt-search-icon" />
              <input placeholder="Search products…" maxLength={200} value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
              {query && <button className="dt-search-clear" onClick={() => { setQuery(""); setPage(1); }}><X size={13} /></button>}
            </div>
            <button className={`dt-filter-btn ${statusFilter !== "all" ? "on" : ""}`} onClick={() => setShowFilters((s) => !s)}>
              <SlidersHorizontal size={14} /> Filters {statusFilter !== "all" && <span className="count">1</span>}
            </button>
            <div className="dt-view-toggle">
              <button className={viewMode === "cards" ? "on" : ""} onClick={() => toggleView("cards")} title="Cards"><LayoutGrid size={14} /> Cards</button>
              <button className={viewMode === "list" ? "on" : ""} onClick={() => toggleView("list")} title="List"><List size={14} /> List</button>
            </div>
          </div>
        )}

        {/* Filter panel */}
        {showFilters && products.length > 0 && (
          <div className="dt-filter-panel" style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12, lineHeight: 1.6 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", alignItems: "center" }}>
                <span><span className="ds-status ok" style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4 }}><span className="ds-status-dot" />Active</span> — all 5 key fields complete</span>
                <span><span className="ds-status accent" style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4 }}><span className="ds-status-dot" />Ready</span> — some key fields filled</span>
                <span><span className="ds-status warn" style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4 }}><span className="ds-status-dot" />Draft</span> — no key fields filled</span>
                <span><span className="ds-status neu" style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4 }}><span className="ds-status-dot" />Archived</span> — manually archived</span>
              </div>
              <div style={{ marginTop: 4, fontSize: 11, color: "var(--faint)" }}>Key fields: one-liner, description, ideal customer profile, pain points, differentiators</div>
            </div>
            <div className="dt-filter-group">
              <label>Status</label>
              <select className="fsel" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="ready">Ready</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="dt-filter-actions">
              <button className="ps-btn ghost sm" onClick={() => { setStatusFilter("all"); setPage(1); }}><X size={14} /> Clear</button>
              <button className="ps-btn pri sm" onClick={() => setShowFilters(false)}>Done</button>
            </div>
          </div>
        )}

        {/* Empty states */}
        {products.length === 0 ? (
          <div className="ds-empty-state">
            <div className="icon"><FileText size={24} /></div>
            <h3>No products yet</h3>
            <p>Add a product with a few details about what it does and who it’s for. Pitch Studio uses that to write your call scripts — once — and saves them for every call after.</p>
            <div className="actions">
              <button className="ds-btn-pri" onClick={onAdd}><span style={{ fontSize: 16 }}>＋</span> Add your first product</button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="ds-empty-state">
            <div className="icon"><Search size={24} /></div>
            <h3>No matches</h3>
            <p>No products match “{query}”. Try a different search term.</p>
            <div className="actions">
              <button className="ds-btn-ter" onClick={() => setQuery("")}>Clear search</button>
            </div>
          </div>
        ) : (
          <>
            {/* Card view */}
            {viewMode === "cards" && (
              <div className="epc-grid">
                {paginated.map((p) => (
                  <CardItem key={p.id} p={p} />
                ))}
              </div>
            )}

            {/* List view */}
            {viewMode === "list" && (
              <div className="dt-table-wrap">
                <table className="dt-table">
                  <thead>
                    <tr>
                      <th style={{ width: "38%" }}>Product</th>
                      <th style={{ width: "14%" }}>Status</th>
                      <th style={{ width: "20%" }}>AI Readiness</th>
                      <th style={{ width: "8%", textAlign: "center" }}>Scripts</th>
                      <th style={{ width: "14%" }}>Date</th>
                      <th style={{ width: "6%" }} />
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((p) => (
                      <ListItem key={p.id} p={p} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {filtered.length > pageSize && (
              <div className="ds-pagination">
                <span className="ds-pagination-info">Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}</span>
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
            )}
          </>
        )}

        {/* Delete confirmation modal */}
        {confirmDel && (
          <div className="overlay" onClick={() => setConfirmDel(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Delete {confirmDel.name}?</div>
              <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.55, marginBottom: 20 }}>
                This permanently removes <b>{confirmDel.name}</b> and all its saved scripts. This cannot be undone.
              </p>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button className="ds-btn-ter" onClick={() => setConfirmDel(null)}>Keep product</button>
                <button className="ds-btn-dan" onClick={async () => { try { await onDelete(confirmDel); } catch (e) { console.error("Delete failed:", e); } setConfirmDel(null); }}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
