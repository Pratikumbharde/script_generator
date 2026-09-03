import React, { useState, useEffect } from "react";
import { Store } from "lucide-react";
import { listMarketplaceTemplates, getMarketplaceTemplate, downloadMarketplaceTemplate } from "../api/client.js";

const CATEGORIES = [
  { key: "", label: "All templates" },
  { key: "cold-outreach", label: "Cold outreach" },
  { key: "discovery", label: "Discovery" },
  { key: "demo", label: "Demo" },
  { key: "close", label: "Closing" },
  { key: "follow-up", label: "Follow-up" },
  { key: "objection", label: "Objections" },
  { key: "rapport", label: "Rapport" },
];

export default function MarketplaceView() {
  const [category, setCategory] = useState("");
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, [category]);

  async function loadTemplates() {
    setLoading(true);
    try {
      const rows = await listMarketplaceTemplates(category || undefined);
      setTemplates(rows || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function openDetail(id) {
    setDetailLoading(true);
    try {
      const tpl = await getMarketplaceTemplate(id);
      setDetail(tpl);
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleDownload(id) {
    try {
      await downloadMarketplaceTemplate(id);
      setTemplates((prev) => prev.map((t) => t.id === id ? { ...t, downloads: (t.downloads || 0) + 1 } : t));
      alert("Template downloaded! Use it as a reference when building your next script.");
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div>
      <div className="ps-top">
        <div>
          <div className="ps-eyebrow">P3.6</div>
          <div className="ps-title"><Store size={22} style={{ marginRight: 8, verticalAlign: "-3px" }} />Marketplace</div>
          <div className="ps-sub">Pre-built script templates curated from top-performing sales methodologies.</div>
        </div>
      </div>

      <div className="ps-body">
        {/* category chips */}
        <div className="pill-row" style={{ marginBottom: 18 }}>
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              className={`pill ${category === c.key ? "on" : ""}`}
              onClick={() => setCategory(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="loading-box">
            <div className="ring" />
            <div className="msg">Loading templates…</div>
          </div>
        )}

        {!loading && templates.length === 0 && (
          <div className="ps-empty">
            <div className="big">No templates yet</div>
            <p>Check back soon — we're curating battle-tested scripts from top performers.</p>
          </div>
        )}

        {!loading && templates.length > 0 && (
          <div className="comp-grid">
            {templates.map((t) => (
              <div key={t.id} className="comp-card" onClick={() => openDetail(t.id)} style={{ cursor: "pointer" }}>
                <div className="comp-head">
                  <span className="comp-type" style={{ background: "var(--accent-bg)", color: "var(--accent-ink)" }}>{t.category}</span>
                  <span className="chip">⬇ {t.downloads || 0}</span>
                </div>
                <div className="comp-name">{t.title}</div>
                <div className="comp-content" style={{ fontStyle: "normal", fontSize: 13.5 }}>{t.description || "No description provided."}</div>
                <div className="comp-tags">
                  {t.method && <span className="chip">{t.method}</span>}
                  {t.call_type && <span className="chip">{t.call_type}</span>}
                  {t.duration && <span className="chip">{t.duration} min</span>}
                  {t.tags && t.tags.split(",").map((tag) => <span key={tag} className="chip">{tag.trim()}</span>)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* detail overlay */}
        {detail && (
          <div className="overlay" onClick={() => setDetail(null)}>
            <div className="modal" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
              {detailLoading && (
                <div className="loading-box">
                  <div className="ring" />
                  <div className="msg">Loading template…</div>
                </div>
              )}
              {!detailLoading && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
                    <span className="comp-type" style={{ background: "var(--accent-bg)", color: "var(--accent-ink)" }}>{detail.category}</span>
                    <span className="chip">⬇ {detail.downloads || 0}</span>
                    {detail.author && <span className="chip">👤 {detail.author}</span>}
                  </div>
                  <div className="comp-name" style={{ fontSize: 22, marginBottom: 10 }}>{detail.title}</div>
                  <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.55, margin: "0 0 16px" }}>{detail.description}</p>

                  {detail.opening && (
                    <div style={{ background: "var(--ink)", color: "#fff", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#8AA0FF", marginBottom: 8 }}>Opening</div>
                      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, lineHeight: 1.45 }}>{detail.opening}</div>
                    </div>
                  )}

                  {detail.segments && detail.segments.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div className="ai-section-h" style={{ marginBottom: 10 }}>Segments</div>
                      {detail.segments.map((seg, i) => (
                        <div key={i} style={{ border: "1px solid var(--line-soft)", borderRadius: 10, padding: "10px 12px", marginBottom: 8, fontSize: 13.5 }}>
                          <div style={{ fontWeight: 600, marginBottom: 4 }}>{seg.label || seg.goal || `Segment ${i + 1}`}</div>
                          {seg.say && seg.say.length > 0 && seg.say.map((s, j) => <div key={j} style={{ color: "var(--muted)", lineHeight: 1.5 }}>• {s}</div>)}
                          {seg.ask && seg.ask.length > 0 && seg.ask.map((a, j) => <div key={j} style={{ color: "var(--accent)", lineHeight: 1.5 }}>? {a}</div>)}
                        </div>
                      ))}
                    </div>
                  )}

                  {detail.objections && detail.objections.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div className="ai-section-h" style={{ marginBottom: 10 }}>Objections</div>
                      {detail.objections.map((obj, i) => (
                        <div key={i} style={{ border: "1px solid var(--line-soft)", borderRadius: 10, padding: "10px 12px", marginBottom: 8, fontSize: 13.5 }}>
                          <div style={{ fontWeight: 600, marginBottom: 4 }}>{obj.question || obj.objection}</div>
                          <div style={{ color: "var(--muted)", lineHeight: 1.5 }}>{obj.answer || obj.response}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button className="ps-btn ghost" onClick={() => setDetail(null)}>Close</button>
                    <button className="ps-btn pri" onClick={() => handleDownload(detail.id)}>⬇ Download / Use</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
