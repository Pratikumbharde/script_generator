import React, { useState, useEffect } from "react";
import { Mail, Loader2 } from "lucide-react";
import { listScripts, listProducts } from "../api/client.js";
import FollowUpModal from "./FollowUpModal.jsx";

/* ============================================================
   FollowUpsView — /follow-ups. One place to see every script's
   follow-up email draft: which have saved drafts, which still
   need one. Opening a script without a draft generates it (the
   same never-auto-regenerate rule as everywhere else).
   ============================================================ */

const OUTCOME_BADGES = {
  won: { label: "Won", color: "#1A7F5B" },
  lost: { label: "Lost", color: "#B23237" },
  no_deal: { label: "No deal", color: "#667180" },
  pending: { label: "Pending", color: "#2B4CF0" },
};

export default function FollowUpsView() {
  const [scripts, setScripts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeScript, setActiveScript] = useState(null);

  useEffect(() => {
    Promise.all([
      listScripts().catch(() => []),
      listProducts().catch(() => []),
    ]).then(([s, p]) => {
      setScripts(s || []);
      setProducts(p || []);
    }).finally(() => setLoading(false));
  }, []);

  const productName = (id) => products.find((p) => String(p.id) === String(id))?.name || "";

  return (
    <div>
      <div className="ps-top">
        <div>
          <div className="ps-title"><Mail size={22} style={{ marginRight: 8, verticalAlign: "-3px" }} />Follow-ups</div>
          <div className="ps-sub">AI-drafted post-call emails for every script. Open a script to write its draft, edit, then copy or open Gmail / Outlook.</div>
        </div>
      </div>

      <div className="ps-body" style={{ maxWidth: 900 }}>
        {loading && (
          <div className="ps-card" style={{ padding: 40, textAlign: "center" }}>
            <div className="loading-box"><div className="ring" /><div className="msg">Loading scripts…</div></div>
          </div>
        )}

        {!loading && scripts.length === 0 && (
          <div className="ps-empty">
            <div className="big">No scripts yet</div>
            <p>Generate a script in Call Studio first — every script gets its own follow-up email draft.</p>
          </div>
        )}

        {!loading && scripts.map((s) => {
          const hasDraft = !!(s.follow_up_subject && s.follow_up_body);
          const ob = OUTCOME_BADGES[s.outcome || "pending"] || OUTCOME_BADGES.pending;
          return (
            <div key={s.id} className="ps-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", marginBottom: 12 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{productName(s.product_id) || "Script"}</span>
                  <span className="chip n" style={{ background: ob.color, color: "#fff", fontSize: 11 }}>{ob.label}</span>
                  {hasDraft && <span className="chip n" style={{ background: "var(--accent-soft)", color: "var(--accent-ink)", fontSize: 11 }}>Draft saved</span>}
                </div>
                <div className="fhint" style={{ marginTop: 4 }}>
                  {s.method} · {s.call_type} · {s.duration} min
                  {hasDraft && <> — “{String(s.follow_up_subject).slice(0, 70)}{String(s.follow_up_subject).length > 70 ? "…" : ""}”</>}
                </div>
              </div>
              <button className={`ps-btn ${hasDraft ? "ghost" : "pri"} sm`} onClick={() => setActiveScript(s)}>
                <Mail size={13} /> {hasDraft ? "Open draft" : "Generate follow-up"}
              </button>
            </div>
          );
        })}
      </div>

      {activeScript && (
        <FollowUpModal
          scriptId={activeScript.id}
          onClose={() => setActiveScript(null)}
        />
      )}
    </div>
  );
}