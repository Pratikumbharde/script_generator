import React, { useState, useEffect, useRef } from "react";
import { createProduct, updateProduct } from "../api/client.js";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  Sparkles,
  AlertCircle,
  ArrowRight,
  Save,
  X,
} from "lucide-react";

/* ============================================================
   ProductForm — Progressive section disclosure (Template D)
   Sections open on demand. AI Readiness links directly to fields.
   ============================================================ */

const SECTIONS = [
  { id: "basics", title: "Product Basics", subtitle: "Name, category, and what it does", fields: ["name", "category", "oneLiner", "description"] },
  { id: "customer", title: "Customer", subtitle: "Who buys it and what pains it solves", fields: ["idealCustomer", "painPoints", "personas"] },
  { id: "positioning", title: "Positioning", subtitle: "Differentiators, competitors, and proof", fields: ["differentiators", "competitors", "proofPoints"] },
  { id: "commercial", title: "Commercial", subtitle: "Pricing and packaging", fields: ["priceModel"] },
  { id: "aiContext", title: "AI Context", subtitle: "Features, objections, and key messages", fields: ["features", "commonObjections", "keyMessages"] },
];

const FIELD_META = {
  name: { label: "Product name", required: true, example: "e.g. Northwind CRM" },
  category: { label: "Category", recommended: true, example: "e.g. B2B SaaS, Healthcare Tech" },
  oneLiner: { label: "One-liner", required: true, example: "AI-powered CRM that helps sales teams close 30% more deals" },
  description: { label: "What it does", required: true, example: "Describe the product, core value, and how it works in 2–3 sentences" },
  idealCustomer: { label: "Ideal customer", recommended: true, example: "Sales Director at a 50–500 employee B2B SaaS company" },
  painPoints: { label: "Pains it solves", recommended: true, example: "Lost leads, slow follow-ups, no call tracking, scattered data" },
  personas: { label: "Buyer personas / ICPs", recommended: true, example: "Price-sensitive kirana shop owner\nBusy clinic owner, 40s\nEnterprise IT head" },
  differentiators: { label: "Differentiators", recommended: true, example: "Faster implementation (1 day vs 2 weeks), no-code setup, 40% lower cost" },
  competitors: { label: "Main competitors", advanced: true, example: "Salesforce, HubSpot, Pipedrive — who you get compared to" },
  proofPoints: { label: "Proof points", advanced: true, example: "Stats, case studies, notable customers, G2 ratings" },
  priceModel: { label: "Pricing model", advanced: true, example: "$49/seat/month, usage-based, freemium" },
  features: { label: "Key features", advanced: true, example: "Auto-dial, pipeline view, WhatsApp integration, hourly reports" },
  commonObjections: { label: "Common objections", advanced: true, example: "Too expensive, we already have a CRM, too complex for our team" },
  keyMessages: { label: "Key messaging", advanced: true, example: "The only mobile-first CRM built for Indian telecalling teams" },
};

function getSectionCompletion(secId, values) {
  const sec = SECTIONS.find((s) => s.id === secId);
  if (!sec) return 0;
  let total = 0, filled = 0;
  for (const k of sec.fields) {
    total += FIELD_META[k]?.required ? 3 : FIELD_META[k]?.recommended ? 2 : 1;
    const v = values[k];
    if (v && String(v).trim().length > 0) filled += FIELD_META[k]?.required ? 3 : FIELD_META[k]?.recommended ? 2 : 1;
  }
  return total > 0 ? Math.round((filled / total) * 100) : 0;
}

function getOverallReadiness(values) {
  let total = 0, filled = 0;
  for (const sec of SECTIONS) {
    for (const k of sec.fields) {
      const weight = FIELD_META[k]?.required ? 3 : FIELD_META[k]?.recommended ? 2 : 1;
      total += weight;
      const v = values[k];
      if (v && String(v).trim().length > 0) filled += weight;
    }
  }
  return total > 0 ? Math.round((filled / total) * 100) : 0;
}

function getSectionStatus(secId, values) {
  const sec = SECTIONS.find((s) => s.id === secId);
  if (!sec) return "empty";
  const hasFilled = sec.fields.some((k) => values[k] && String(values[k]).trim().length > 0);
  const allFilled = sec.fields.every((k) => values[k] && String(values[k]).trim().length > 0);
  if (allFilled) return "done";
  if (hasFilled) return "partial";
  return "empty";
}

const STATUS_ICON = {
  done: CheckCircle2,
  partial: AlertCircle,
  empty: Circle,
};

const STATUS_COLOR = {
  done: "#1A7F5B",
  partial: "#B5720F",
  empty: "var(--faint)",
};

export default function ProductForm({ product, onCancel, onSaved }) {
  const isEdit = !!product;
  const initial = isEdit
    ? {
        name: product.name || "",
        category: product.category || "",
        oneLiner: product.one_liner || "",
        description: product.description || "",
        idealCustomer: product.ideal_customer || "",
        painPoints: product.pain_points || "",
        differentiators: product.differentiators || "",
        priceModel: product.price_model || "",
        proofPoints: product.proof_points || "",
        competitors: product.competitors || "",
        personas: product.personas || "",
        features: product.features || "",
        commonObjections: product.common_objections || "",
        keyMessages: product.key_messages || "",
      }
    : {
        name: "", category: "", oneLiner: "", description: "",
        idealCustomer: "", painPoints: "", differentiators: "",
        priceModel: "", proofPoints: "", competitors: "", personas: "",
        features: "", commonObjections: "", keyMessages: "",
      };

  const [f, setF] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [errors, setErrors] = useState({});
  const [aiLoading, setAiLoading] = useState({});
  const [openSections, setOpenSections] = useState(() => {
    // Open the first incomplete section by default
    const firstIncomplete = SECTIONS.find((s) => getSectionStatus(s.id, initial) !== "done");
    return new Set([firstIncomplete?.id || "basics"]);
  });
  const sectionRefs = useRef({});
  const autoSaveRef = useRef(null);

  const set = (k) => (e) => {
    setF((prev) => ({ ...prev, [k]: e.target.value }));
    setDirty(true);
    setErrors((prev) => ({ ...prev, [k]: false }));
  };

  const validate = () => {
    const next = {};
    if (!f.name.trim()) next.name = "Product name is required";
    if (!f.oneLiner.trim()) next.oneLiner = "One-liner is required";
    if (!f.description.trim()) next.description = "Description is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const toPayload = () => ({
    name: f.name,
    category: f.category,
    one_liner: f.oneLiner,
    description: f.description,
    ideal_customer: f.idealCustomer,
    pain_points: f.painPoints,
    differentiators: f.differentiators,
    price_model: f.priceModel,
    proof_points: f.proofPoints,
    competitors: f.competitors,
    personas: f.personas,
    features: f.features,
    common_objections: f.commonObjections,
    key_messages: f.keyMessages,
  });

  const doSave = async (draft = false) => {
    if (!draft && !validate()) return;
    setSaving(true);
    try {
      if (isEdit) {
        await updateProduct(product.id, toPayload());
      } else {
        await createProduct(toPayload());
      }
      setDirty(false);
      setSavedAt(new Date());
      if (!draft) onSaved();
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  /* Auto-save draft every 10s when dirty */
  useEffect(() => {
    if (!dirty || saving) return;
    autoSaveRef.current = setTimeout(() => {
      if (f.name.trim()) doSave(true);
    }, 10000);
    return () => clearTimeout(autoSaveRef.current);
  }, [dirty, f, saving]);

  /* AI Assist stubs */
  const aiAssist = async (field) => {
    setAiLoading((p) => ({ ...p, [field]: true }));
    await new Promise((r) => setTimeout(r, 1200));
    const suggestions = {
      oneLiner: "AI-powered sales platform that automates outreach and closes more deals in less time.",
      description: "An intelligent sales automation platform that helps teams manage leads, automate follow-ups, and track performance in real time.",
      idealCustomer: "Sales managers and BDRs at fast-growing B2B SaaS companies with 20–200 employees.",
      painPoints: "Manual follow-ups slip through cracks. No visibility into rep activity. Leads go cold before anyone calls.",
      differentiators: "Sets up in under 1 hour (vs 2+ weeks). Native mobile app. Built-in auto-dialer. 40% lower cost than enterprise CRMs.",
      proofPoints: "Used by 500+ sales teams. 4.7/5 on G2. Customers report 35% increase in connect rates.",
    };
    const val = suggestions[field] || "";
    if (val) {
      setF((prev) => ({ ...prev, [field]: val }));
      setDirty(true);
    }
    setAiLoading((p) => ({ ...p, [field]: false }));
  };

  const toggleSection = (id) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openSection = (id) => {
    setOpenSections((prev) => new Set(prev).add(id));
    setTimeout(() => {
      sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const readiness = getOverallReadiness(f);

  /* Missing field suggestions */
  const suggestions = [];
  if (!f.idealCustomer.trim()) suggestions.push({ section: "customer", field: "idealCustomer", text: "Define your ideal customer" });
  if (!f.painPoints.trim()) suggestions.push({ section: "customer", field: "painPoints", text: "Add pain points your product solves" });
  if (!f.differentiators.trim()) suggestions.push({ section: "positioning", field: "differentiators", text: "Add differentiators" });
  if (!f.competitors.trim()) suggestions.push({ section: "positioning", field: "competitors", text: "Add 2–3 competitors" });
  if (!f.proofPoints.trim()) suggestions.push({ section: "positioning", field: "proofPoints", text: "Add proof points or case studies" });

  const renderField = (key) => {
    const meta = FIELD_META[key];
    if (!meta) return null;
    const isTextarea = ["description", "painPoints", "differentiators", "proofPoints", "personas", "features", "commonObjections", "keyMessages"].includes(key);
    const hasAi = ["oneLiner", "description", "idealCustomer", "painPoints", "differentiators", "proofPoints"].includes(key);

    return (
      <div className="frow" key={key}>
        <label className="flab">
          {meta.label}
          {meta.required && <span className="req">*</span>}
          {meta.recommended && <span className="rec">Recommended</span>}
          {meta.advanced && <span className="adv">Advanced</span>}
        </label>
        {isTextarea ? (
          <textarea
            className="ftext ds-textarea"
            value={f[key]}
            onChange={set(key)}
            placeholder={meta.example}
            rows={key === "description" ? 4 : 3}
          />
        ) : (
          <input className="finp ds-input" value={f[key]} onChange={set(key)} placeholder={meta.example} />
        )}
        {errors[key] && <div className="pf-err">{errors[key]}</div>}
        {!errors[key] && meta.example && <div className="pf-field-example">{meta.example}</div>}
        {hasAi && (
          <button className="pf-ai-btn" disabled={aiLoading[key]} onClick={() => aiAssist(key)}>
            {aiLoading[key] ? <span className="spin" /> : <Sparkles size={14} />} {aiLoading[key] ? "Generating…" : "Generate with AI"}
          </button>
        )}
      </div>
    );
  };

  const renderSection = (sec) => {
    const status = getSectionStatus(sec.id, f);
    const completion = getSectionCompletion(sec.id, f);
    const isOpen = openSections.has(sec.id);
    const StatusIcon = STATUS_ICON[status];

    return (
      <div
        className="ds-section-card"
        key={sec.id}
        ref={(el) => { sectionRefs.current[sec.id] = el; }}
      >
        <div
          className={`ds-section-header ${isOpen ? "open" : ""}`}
          onClick={() => toggleSection(sec.id)}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <StatusIcon size={18} color={STATUS_COLOR[status]} />
            <div>
              <div className="title">{sec.title}</div>
              <div className="meta">{sec.subtitle}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {status !== "done" && (
              <span style={{ fontSize: 12, fontWeight: 700, color: status === "partial" ? "var(--amber)" : "var(--faint)" }}>
                {completion}%
              </span>
            )}
            <ChevronDown
              size={18}
              color="var(--faint)"
              style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }}
            />
          </div>
        </div>
        {isOpen && (
          <div className="ds-section-body open">
            <div className={sec.fields.length <= 2 && sec.fields.every((k) => !["description", "painPoints", "differentiators", "proofPoints", "personas", "features", "commonObjections", "keyMessages"].includes(k)) ? "pf-row-grid" : ""}>
              {sec.fields.map(renderField)}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="ps-top">
        <div style={{ flex: 1 }}>
          <div className="crumb" onClick={onCancel}>
            <ArrowRight size={14} style={{ transform: "rotate(180deg)", marginRight: 4 }} />
            Products
          </div>
          <div className="ps-title">{isEdit ? "Edit product" : "Add product"}</div>
          <div className="ps-sub">Build your product profile so Pitch Studio can generate sharper, more relevant sales conversations.</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div className={`pf-draft-badge ${savedAt ? "saved" : ""}`}>
            {dirty ? "Unsaved changes" : savedAt ? `Saved ${savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Draft"}
          </div>
        </div>
      </div>

      <div className="ps-body">
        <div className="pf-layout">
          <div className="pf-main">
            {/* Stepper */}
            <div className="ds-stepper" style={{ marginBottom: 8 }}>
              {SECTIONS.map((sec, idx) => {
                const status = getSectionStatus(sec.id, f);
                const isLast = idx === SECTIONS.length - 1;
                return (
                  <React.Fragment key={sec.id}>
                    <button
                      className={`ds-step ${status === "done" ? "done" : openSections.has(sec.id) ? "on" : ""}`}
                      onClick={() => openSection(sec.id)}
                      style={{ background: "transparent", border: "none", cursor: "pointer" }}
                    >
                      <span className="ds-step-num">
                        {status === "done" ? <CheckCircle2 size={14} /> : idx + 1}
                      </span>
                      <span style={{ whiteSpace: "nowrap" }}>{sec.title}</span>
                    </button>
                    {!isLast && <div className="ds-step-line" />}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Sections */}
            {SECTIONS.map(renderSection)}

            {/* Sticky action bar */}
            <div className="pf-sticky-bar">
              <div className={`pf-status ${dirty ? "unsaved" : "saved"}`}>
                <span className="dot" />
                {dirty ? "Unsaved changes" : savedAt ? "Saved just now" : "Auto-save enabled"}
              </div>
              <div style={{ flex: 1 }} />
              <button className="ds-btn-sec" disabled={saving} onClick={() => doSave(true)}>
                {saving ? <span className="spinner dark" /> : <Save size={14} style={{ marginRight: 5 }} />}
                Save draft
              </button>
              <button className="ds-btn-pri" disabled={saving || !f.name.trim() || !f.oneLiner.trim() || !f.description.trim()} onClick={() => doSave(false)}>
                {saving ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2, marginRight: 8 }} /> : null}
                {isEdit ? "Save changes" : "Save product"}
              </button>
              <button className="ds-btn-ter" onClick={onCancel} disabled={saving}>
                <X size={14} style={{ marginRight: 4 }} />
                Cancel
              </button>
            </div>
          </div>

          {/* Sidebar: AI Readiness */}
          <div className="pf-sidebar">
            <div className="pf-panel">
              <div className="pf-panel-title">AI Readiness</div>
              <div className="pf-readiness-score">
                <span className="num">{readiness}</span>
                <span className="lbl">%</span>
              </div>
              <div className="pf-readiness-bar">
                <div className="fill" style={{ width: `${readiness}%` }} />
              </div>

              <div className="pf-readiness-list">
                {SECTIONS.map((sec) => {
                  const status = getSectionStatus(sec.id, f);
                  const completion = getSectionCompletion(sec.id, f);
                  return (
                    <button
                      className={`pf-readiness-item ${status === "done" ? "done" : ""}`}
                      key={sec.id}
                      onClick={() => openSection(sec.id)}
                      style={{ background: "transparent", border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}
                    >
                      <span className={`icon ${status === "done" ? "ok" : status === "partial" ? "partial" : "empty"}`}>
                        {status === "done" ? "✓" : status === "partial" ? "◐" : "○"}
                      </span>
                      <span style={{ flex: 1 }}>{sec.title}</span>
                      <span style={{ fontSize: 11, color: "var(--faint)", fontWeight: 600 }}>
                        {status === "done" ? "Done" : `${completion}%`}
                      </span>
                    </button>
                  );
                })}
              </div>

              {suggestions.length > 0 && (
                <div className="pf-suggestions">
                  <div className="pf-suggestions-title">Suggestions</div>
                  {suggestions.map((sug, i) => (
                    <button
                      className="pf-suggestion"
                      key={i}
                      onClick={() => openSection(sug.section)}
                      style={{ background: "transparent", border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}
                    >
                      <span className="arrow"><ArrowRight size={12} /></span>
                      {sug.text}
                    </button>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line-soft)", fontSize: 12, color: "var(--muted)", lineHeight: 1.55 }}>
                {readiness >= 80
                  ? "Great profile! Your scripts will be highly specific and effective."
                  : readiness >= 50
                  ? "Good start. Add more details for sharper, more relevant scripts."
                  : "Add the basics to start generating effective sales scripts."}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
