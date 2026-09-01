import React, { useState, useEffect } from "react";
import { listVoiceDocs, createVoiceDoc, deleteVoiceDoc } from "../api/client.js";
import { RowSkeleton } from "./shared/Skeletons.jsx";
import LimitedInput from './shared/LimitedInput.jsx'
import LimitedTextarea from './shared/LimitedTextarea.jsx'

const DOC_TYPES = [
  { id: "pitch_deck", label: "Pitch deck", icon: "📊" },
  { id: "email", label: "Email / Copy", icon: "✉️" },
  { id: "call_recording", label: "Call recording", icon: "🎙" },
  { id: "brand_guide", label: "Brand guide", icon: "📖" },
  { id: "competitor_battlecard", label: "Battlecard", icon: "⚔️" },
  { id: "other", label: "Other", icon: "📄" },
];

export default function VoiceDNA() {
  const [docs, setDocs] = useState(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", type: "pitch_deck", content: "", tags: "" });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const rows = await listVoiceDocs();
      setDocs(rows);
    } catch (e) {
      setDocs([]);
    }
  };

  const save = async () => {
    if (!form.name.trim() || !form.content.trim()) return;
    await createVoiceDoc({ ...form, name: form.name.trim(), content: form.content.trim() });
    setForm({ name: "", type: "pitch_deck", content: "", tags: "" });
    setCreating(false);
    load();
  };

  const remove = async (id) => {
    if (!confirm("Delete this document?")) return;
    await deleteVoiceDoc(id);
    load();
  };

  if (docs === null) return (
    <>
      <div className="ps-top"><div><div className="ps-eyebrow">Voice DNA</div><div className="ps-title">Company Voice</div></div></div>
      <div className="ps-body"><RowSkeleton count={5} /></div>
    </>
  );

  return (
    <>
      <div className="ps-top">
        <div>
          <div className="ps-eyebrow">Voice DNA</div>
          <div className="ps-title">Company Voice</div>
          <div className="ps-sub">Upload pitch decks, emails, brand guides, and battlecards. The AI uses them to match your company's tone and language when generating scripts.</div>
        </div>
        {!creating && <button className="ps-btn pri" onClick={() => setCreating(true)}>＋ Add document</button>}
      </div>
      <div className="ps-body">
        {creating && (
          <div className="ps-form" style={{ marginBottom: 24, maxWidth: 720 }}>
            <div className="frow two">
              <div>
                <label className="flab">Document name</label>
                <LimitedInput className="finp" maxLength={200} placeholder="e.g. Q3 Pitch Deck" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="flab">Type</label>
                <select className="fsel" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {DOC_TYPES.map((t) => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
                </select>
              </div>
            </div>
            <div className="frow">
              <label className="flab">Content <span className="opt">(paste text, transcript, or key excerpts)</span></label>
              <LimitedTextarea className="ftext" maxLength={10000} placeholder="Paste the text here. For a pitch deck, paste the slides' bullet points. For an email, paste the full copy." value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
            </div>
            <div className="frow">
              <label className="flab">Tags <span className="opt">(optional)</span></label>
              <LimitedInput className="finp" maxLength={500} placeholder="enterprise, formal, technical" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="ps-btn pri" disabled={!form.name.trim() || !form.content.trim()} onClick={save}>Save document</button>
              <button className="ps-btn ghost" onClick={() => setCreating(false)}>Cancel</button>
            </div>
          </div>
        )}

        {docs.length === 0 ? (
          <div className="ps-empty">
            <div className="big">No documents yet</div>
            <p>Add your pitch deck, sample emails, or call transcripts so the AI can learn your company's voice.</p>
            <button className="ps-btn pri" onClick={() => setCreating(true)}>＋ Add your first document</button>
          </div>
        ) : (
          <div className="comp-grid">
            {docs.map((d) => {
              const typeMeta = DOC_TYPES.find((t) => t.id === d.type) || DOC_TYPES[0];
              return (
                <div key={d.id} className="comp-card">
                  <div className="comp-head">
                    <span className="comp-type" style={{ background: "var(--accent-bg)", color: "var(--accent-ink)" }}>
                      {typeMeta.icon} {typeMeta.label}
                    </span>
                    <button className="ps-btn danger sm" style={{ marginLeft: "auto" }} onClick={() => remove(d.id)}>Delete</button>
                  </div>
                  <div className="comp-name">{d.name}</div>
                  {d.tags && (
                    <div className="comp-tags">
                      {d.tags.split(",").map((tag) => tag.trim()).filter(Boolean).map((tag, i) => (
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
