import React, { useState, useEffect, useMemo, useRef } from "react";
import { listScripts } from "../api/client.js";
import { nameOf, scriptKey } from "../utils/helpers.js";
import { METHODS, CALL_TYPES, LANGUAGES } from "../data/constants.js";
import { useOutsideClick, useDropdownPos } from "./shared/DropdownHooks.js";
import {
  ArrowLeft, Play, Pencil, Trash2, MoreHorizontal,
  CheckCircle2, AlertCircle, Clock, Sparkles,
  ChevronRight, X, Copy, Archive, RotateCcw,
  Circle, FileText
} from "lucide-react";

/* ============================================================
   Product Detail — structured overview with tabs
   No raw markdown. Content flows naturally (no card scroll).
   ============================================================ */

function aiContextInfo(p) {
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
  const present = [];
  fields.forEach((f) => {
    const val = p[f.key];
    const ok = val && String(val).trim().length > 5;
    if (ok) { score += f.weight; present.push(f); }
    else missing.push(f);
  });
  return { score, missing, present, fields };
}

/* Status: Draft / Ready / Active */
function statusOf(p) {
  const has = (k) => !!(p[k] && String(p[k]).trim().length > 5);
  if (has("one_liner") && has("description") && has("ideal_customer") && has("pain_points") && has("differentiators")) return "active";
  if (has("one_liner") || has("description") || has("ideal_customer")) return "ready";
  return "draft";
}

const STATUS_META = {
  active: { label: "Active", color: "#1A7F5B", icon: CheckCircle2, bg: "#E6F6EF" },
  ready:  { label: "Ready",  color: "#2B4CF0", icon: CheckCircle2, bg: "#EAEEFE" },
  draft:  { label: "Draft",  color: "#B5720F", icon: Clock,        bg: "#FDF2E6" },
};

function fmtDate(ts) {
  if (!ts) return "";
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

/* Simple markdown renderer — headings, bold, lists, paragraphs */
function renderMarkdown(text) {
  const raw = String(text || "").trim();
  if (!raw) return null;
  const lines = raw.split(/\n/);
  const out = [];
  let i = 0;
  let listBuffer = null; // { type: 'ol'|'ul', items: [] }
  let paraBuffer = [];

  const flushPara = () => {
    if (paraBuffer.length) {
      const html = paraBuffer.join(" ").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>");
      out.push(<p key={`p-${i}`} className="pd-md-p" dangerouslySetInnerHTML={{ __html: html }} />);
      paraBuffer = [];
    }
  };
  const flushList = () => {
    if (listBuffer) {
      const Tag = listBuffer.type === "ol" ? "ol" : "ul";
      out.push(
        <Tag key={`li-${i}`} className={`pd-md-${listBuffer.type}`}>
          {listBuffer.items.map((item, idx) => {
            const html = item.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>");
            return <li key={idx} className="pd-md-li" dangerouslySetInnerHTML={{ __html: html }} />;
          })}
        </Tag>
      );
      listBuffer = null;
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushPara();
      flushList();
      return;
    }
    // heading
    if (trimmed.startsWith("### ")) { flushPara(); flushList(); out.push(<h3 key={`h3-${idx}`} className="pd-md-h3">{trimmed.slice(4)}</h3>); return; }
    if (trimmed.startsWith("## ")) { flushPara(); flushList(); out.push(<h2 key={`h2-${idx}`} className="pd-md-h2">{trimmed.slice(3)}</h2>); return; }
    if (trimmed.startsWith("# ")) { flushPara(); flushList(); out.push(<h2 key={`h1-${idx}`} className="pd-md-h2">{trimmed.slice(2)}</h2>); return; }
    // numbered list
    if (/^\d+\.\s+/.test(trimmed)) {
      flushPara();
      if (!listBuffer || listBuffer.type !== "ol") flushList();
      if (!listBuffer) listBuffer = { type: "ol", items: [] };
      listBuffer.items.push(trimmed.replace(/^\d+\.\s+/, ""));
      return;
    }
    // bullet list
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      flushPara();
      if (!listBuffer || listBuffer.type !== "ul") flushList();
      if (!listBuffer) listBuffer = { type: "ul", items: [] };
      listBuffer.items.push(trimmed.slice(2));
      return;
    }
    // normal paragraph line
    flushList();
    paraBuffer.push(trimmed);
  });
  flushPara();
  flushList();
  return out;
}

function Section({ title, content, onEdit, fallback, actionLabel }) {
  const has = !!(content && String(content).trim().length > 5);
  return (
    <div className="pd-section">
      <div className="pd-section-head">
        <div className="pd-section-title">{title}</div>
        {has && <button className="pd-section-edit" onClick={onEdit}><Pencil size={12} /> Edit</button>}
      </div>
      {has ? (
        <div className="pd-section-body">{renderMarkdown(content)}</div>
      ) : (
        <div className="pd-section-empty">
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--muted)" }}>
            <AlertCircle size={14} />
            <span>{fallback}</span>
          </div>
          <button className="ds-btn-ter" onClick={onEdit}>{actionLabel}</button>
        </div>
      )}
    </div>
  );
}

export default function ProductDetail({ product, onBack, onOpenStudio, onEdit, onDelete, onDuplicate }) {
  const [tab, setTab] = useState("overview");
  const [scripts, setScripts] = useState([]);
  const [confirmDel, setConfirmDel] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const menuBtnRef = useRef(null);
  const menuPos = useDropdownPos(menuBtnRef, menuOpen);
  useOutsideClick(menuRef, () => setMenuOpen(false));

  useEffect(() => {
    let live = true;
    (async () => {
      const s = await listScripts();
      if (!live) return;
      const mine = (s || []).filter((x) => (x.meta?.productId || x.product_id) === product.id);
      setScripts(mine);
    })();
    return () => { live = false; };
  }, [product.id]);

  const { score: contextScore, missing, present } = useMemo(() => aiContextInfo(product), [product]);
  const st = statusOf(product);
  const stMeta = STATUS_META[st];
  const StatusIcon = stMeta.icon;

  return (
    <>
      <div className="pd-top">
        <div>
          <div className="crumb" onClick={onBack}>← Products</div>
          <div className="pd-head">
            <div className="pd-name">{product.name}</div>
            <span className="dt-pill" style={{ color: stMeta.color, background: stMeta.bg, fontSize: 11, padding: "3px 10px" }}>
              <StatusIcon size={11} />{stMeta.label}
            </span>
          </div>
          <div className="pd-sub">{product.one_liner || product.oneLiner || "No short description yet."}</div>
          <div className="pd-meta-line">{product.updated_at ? `Updated ${fmtDate(product.updated_at)}` : `Created ${fmtDate(product.created_at || product.createdAt)}`}</div>
        </div>
        <div className="pd-actions">
          <button className="ds-btn-ter" onClick={onEdit}><Pencil size={14} /> Edit</button>
          <button className="ds-btn-pri" onClick={onOpenStudio}><Play size={15} /> Open Call Studio</button>
          <div className="dt-actions" ref={menuRef}>
            <button ref={menuBtnRef} className="dt-more-btn" onClick={() => setMenuOpen((s) => !s)} title="Actions">
              <MoreHorizontal size={16} />
            </button>
            {menuOpen && menuPos && (
              <div className="dt-dropdown" style={menuPos}>
                {onDuplicate && (
                  <button className="dt-dropdown-item" onClick={() => { onDuplicate(product); setMenuOpen(false); }}>
                    <Copy size={14} /> Duplicate
                  </button>
                )}
                <button className="dt-dropdown-item" onClick={() => { onDelete(product); setMenuOpen(false); setConfirmDel(true); }}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pd-tabs">
        {[
          { id: "overview", label: "Overview" },
          { id: "scripts", label: `Scripts (${scripts.length})` },
          { id: "settings", label: "Settings" },
        ].map((t) => (
          <button key={t.id} className={`pd-tab ${tab === t.id ? "on" : ""}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      <div className="ps-body">
        {tab === "overview" && (
          <div className="pd-overview">
            {/* Hero row: AI Context + Ideal Customer */}
            <div className="pd-hero">
              <div className="pd-context">
                <div className="pd-context-head">
                  <Sparkles size={16} />
                  <span>AI Context</span>
                  <span className="pd-context-score">{contextScore}%</span>
                </div>
                <div className="pd-progress">
                  <div className="pd-progress-bar" style={{ width: `${contextScore}%`, background: contextScore >= 80 ? "#1A7F5B" : contextScore >= 50 ? "#B5720F" : "#B23237" }} />
                </div>
                <div className="pd-context-hint">
                  {contextScore < 100
                    ? `${present.length} of ${present.length + missing.length} areas complete. Add more context to improve scripts.`
                    : "All context areas complete. Scripts will be highly tailored."}
                </div>
                {contextScore < 100 && (
                  <div className="pd-context-checks">
                    {missing.map((f) => (
                      <button key={f.key} className="pd-context-check" onClick={onEdit}>
                        <span className="pd-context-dot"><Circle size={12} /></span>
                        <span className="pd-context-label">{f.label}</span>
                        <ChevronRight size={12} style={{ marginLeft: "auto", color: "var(--faint)" }} />
                      </button>
                    ))}
                    {present.map((f) => (
                      <div key={f.key} className="pd-context-check ok">
                        <span className="pd-context-dot" style={{ color: "var(--ok)" }}><CheckCircle2 size={12} /></span>
                        <span className="pd-context-label">{f.label}</span>
                      </div>
                    ))}
                  </div>
                )}
                {contextScore < 100 && (
                  <button className="ds-btn-sec" style={{ marginTop: 10, width: "100%", justifyContent: "center" }} onClick={onEdit}>
                    Complete profile <ChevronRight size={14} />
                  </button>
                )}
              </div>

              <div className="pd-side">
                <Section
                  title="Ideal customer"
                  content={product.ideal_customer}
                  onEdit={onEdit}
                  fallback="Not defined yet. Define who this product is built for to improve script relevance."
                  actionLabel="+ Define ICP"
                />
              </div>
            </div>

            {/* Full-width sections */}
            <Section
              title="What it does"
              content={product.description}
              onEdit={onEdit}
              fallback="No description yet. Add what your product does so AI can write accurate scripts."
              actionLabel="+ Add description"
            />

            <div className="pd-section-grid">
              <Section
                title="Pain points"
                content={product.pain_points}
                onEdit={onEdit}
                fallback="Not defined."
                actionLabel="+ Add pain points"
              />
              <Section
                title="Differentiators"
                content={product.differentiators}
                onEdit={onEdit}
                fallback="Not defined."
                actionLabel="+ Add differentiators"
              />
            </div>

            <div className="pd-section-grid">
              <Section
                title="Proof points"
                content={product.proof_points}
                onEdit={onEdit}
                fallback="Not defined."
                actionLabel="+ Add proof points"
              />
              <Section
                title="Competitors"
                content={product.competitors}
                onEdit={onEdit}
                fallback="None listed."
                actionLabel="+ Add competitors"
              />
              <Section
                title="Pricing"
                content={product.price_model}
                onEdit={onEdit}
                fallback="Not defined."
                actionLabel="+ Add pricing"
              />
            </div>
          </div>
        )}

        {tab === "scripts" && (
          <div>
            {scripts.length === 0 ? (
              <div className="ds-empty-state">
                <div className="icon"><FileText size={24} /></div>
                <h3>No scripts yet</h3>
                <p>Open Call Studio to generate scripts for this product.</p>
                <div className="actions">
                  <button className="ds-btn-pri" onClick={onOpenStudio}><Play size={15} /> Open Call Studio</button>
                </div>
              </div>
            ) : (
              <div className="dt-table-wrap">
                <table className="dt-table">
                  <thead>
                    <tr>
                      <th>Script</th>
                      <th>Outcome</th>
                      <th>Last updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scripts.map((s) => {
                      const meta = s.meta || {};
                      const lang = LANGUAGES.find((l) => l.id === meta.language) || {};
                      const method = nameOf(METHODS, meta.method);
                      const type = nameOf(CALL_TYPES, meta.callType);
                      const oc = s.outcome || "pending";
                      const statusClass = { won: "ok", lost: "bad", no_deal: "neu", pending: "accent" }[oc];
                      const statusLabel = { won: "Won", lost: "Lost", no_deal: "No deal", pending: "Pending" }[oc];
                      return (
                        <tr key={s.key || scriptKey(meta.productId, meta)}>
                          <td>
                            <div className="dt-script-name">{method} · {type} · {meta.duration}m · {lang.name}</div>
                            <div className="dt-script-meta">{meta.region} · {meta.delivery}{meta.simple ? " · simple" : ""}{meta.persona && meta.persona !== "General audience" ? ` · ${meta.persona}` : ""}</div>
                          </td>
                          <td>
                            <span className={`ds-status ${statusClass}`}><span className="ds-status-dot" />{statusLabel}</span>
                          </td>
                          <td>{fmtDate(s.savedAt || s.saved_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === "settings" && (
          <div className="pd-card" style={{ maxWidth: 640 }}>
            <div className="pd-card-h">Product settings</div>
            <div className="pd-hint">Editing moves you to the product form. Deleting removes all associated scripts.</div>
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button className="ds-btn-sec" onClick={onEdit}><Pencil size={14} /> Edit product</button>
              <button className="ds-btn-dan" onClick={() => setConfirmDel(true)}><Trash2 size={14} /> Delete product</button>
            </div>
          </div>
        )}
      </div>

      {confirmDel && (
        <div className="overlay" onClick={() => setConfirmDel(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Delete {product.name}?</div>
            <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.55, marginBottom: 20 }}>
              This permanently removes <b>{product.name}</b> and all its saved scripts. This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="ds-btn-ter" onClick={() => setConfirmDel(false)}>Keep product</button>
              <button className="ds-btn-dan" onClick={() => { onDelete(product); setConfirmDel(false); }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
