import React, { useState, useEffect } from "react";
import { LayoutGrid } from "lucide-react";
import { listComponents, createComponent, deleteComponent } from "../api/client.js";
import { RowSkeleton } from "./shared/Skeletons.jsx";
import LimitedInput from './shared/LimitedInput.jsx'
import LimitedTextarea from './shared/LimitedTextarea.jsx'

const COMPONENT_TYPES = [
  { id: "opening", label: "Opening", icon: "🚪", color: "#2B4CF0" },
  { id: "close", label: "Close", icon: "🔒", color: "#1A7F5B" },
  { id: "objection_handler", label: "Objection", icon: "🛡️", color: "#B23237" },
  { id: "rapport", label: "Rapport", icon: "🤝", color: "#B5720F" },
  { id: "value_prop", label: "Value Prop", icon: "💎", color: "#7A46C9" },
  { id: "discovery_question", label: "Discovery", icon: "❓", color: "#0E8C7C" },
  { id: "transition", label: "Transition", icon: "➡️", color: "#667180" },
];

export default function ComponentLibrary() {
  const [components, setComponents] = useState(null);
  const [filter, setFilter] = useState("all");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", type: "opening", content: "", tags: "" });
  const [copied, setCopied] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const rows = await listComponents();
      setComponents(rows);
    } catch (e) {
      setComponents([]);
    }
  };

  const save = async () => {
    if (!form.name.trim() || !form.content.trim()) return;
    await createComponent({ ...form, name: form.name.trim(), content: form.content.trim() });
    setForm({ name: "", type: "opening", content: "", tags: "" });
    setCreating(false);
    load();
  };

  const remove = async (id) => {
    if (!confirm("Delete this component?")) return;
    await deleteComponent(id);
    load();
  };

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    } catch (_) {}
  };

  const filtered = (components || []).filter((c) => filter === "all" || c.type === filter);
  const byType = COMPONENT_TYPES.map((t) => ({
    ...t,
    count: (components || []).filter((c) => c.type === t.id).length,
  }));

  if (components === null) return (
    <>
      <div className="ps-top"><div><div className="ps-eyebrow">Library</div><div className="ps-title"><LayoutGrid size={22} style={{ marginRight: 8, verticalAlign: "-3px" }} />Script Components</div></div></div>
      <div className="ps-body"><RowSkeleton count={5} /></div>
    </>
  );

  return (
    <>
      <div className="ps-top">
        <div>
          <div className="ps-eyebrow">Library</div>
          <div className="ps-title"><LayoutGrid size={22} style={{ marginRight: 8, verticalAlign: "-3px" }} />Script Components</div>
          <div className="ps-sub">Save your best openings, closes, objection handlers, and discovery questions. Reuse them across scripts.</div>
        </div>
        {!creating && <button className="ps-btn pri" onClick={() => setCreating(true)}>＋ New component</button>}
      </div>

      <div className="ps-body">
        {/* Type filter */}
        <div className="pill-row" style={{ marginBottom: 18 }}>
          <div className={`pill ${filter === "all" ? "on" : ""}`} onClick={() => setFilter("all")}>All ({components.length})</div>
          {byType.map((t) => (
            <div key={t.id} className={`pill ${filter === t.id ? "on" : ""}`} onClick={() => setFilter(t.id)}>
              {t.icon} {t.label} ({t.count})
            </div>
          ))}
        </div>

        {/* Create form */}
        {creating && (
          <div className="ps-form" style={{ marginBottom: 24 }}>
            <div className="frow two">
              <div>
                <label className="flab">Name<span className="req">*</span></label>
                <LimitedInput className="finp" maxLength={200} placeholder="e.g. Warm intro for SaaS" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="flab">Type<span className="req">*</span></label>
                <select className="fsel" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {COMPONENT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div className="frow">
              <label className="flab">Content<span className="req">*</span></label>
              <LimitedTextarea className="ftext" maxLength={2000} placeholder="Write the exact line you'd say on a call…" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
            </div>
            <div className="frow">
              <label className="flab">Tags <span className="opt">(comma-separated, optional)</span></label>
              <LimitedInput className="finp" maxLength={500} placeholder="saas, enterprise, friendly" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="ps-btn pri" disabled={!form.name.trim() || !form.content.trim()} onClick={save}>Save component</button>
              <button className="ps-btn ghost" onClick={() => setCreating(false)}>Cancel</button>
            </div>
          </div>
        )}

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="ps-empty">
            <div className="big">No components yet</div>
            <p>Save reusable snippets from your best scripts — openings, closes, objection rebuttals, and more.</p>
            <button className="ps-btn pri" onClick={() => setCreating(true)}>＋ Create your first component</button>
          </div>
        ) : (
          <div className="comp-grid">
            {filtered.map((c) => {
              const typeMeta = COMPONENT_TYPES.find((t) => t.id === c.type) || COMPONENT_TYPES[0];
              return (
                <div key={c.id} className="comp-card">
                  <div className="comp-head">
                    <span className="comp-type" style={{ background: typeMeta.color + "15", color: typeMeta.color }}>
                      {typeMeta.icon} {typeMeta.label}
                    </span>
                    <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                      <button className="ps-btn ghost sm" onClick={() => copyToClipboard(c.content, c.id)}>
                        {copied === c.id ? "✓ Copied" : "Copy"}
                      </button>
                      <button className="ps-btn danger sm" onClick={() => remove(c.id)}>Delete</button>
                    </div>
                  </div>
                  <div className="comp-name">{c.name}</div>
                  <div className="comp-content">“{c.content}”</div>
                  {c.tags && (
                    <div className="comp-tags">
                      {c.tags.split(",").map((tag) => tag.trim()).filter(Boolean).map((tag, i) => (
                        <span key={i} className="chip">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
