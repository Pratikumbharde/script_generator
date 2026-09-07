import React, { useState, useEffect } from "react";
import { Zap } from "lucide-react";
import { listAutomationRules, createAutomationRule, updateAutomationRule, deleteAutomationRule } from "../api/client.js";
import LimitedInput from './shared/LimitedInput.jsx'
import LimitedTextarea from './shared/LimitedTextarea.jsx'

const TRIGGERS = [
  { id: "script.completed", label: "Script generated" },
  { id: "script.used", label: "Script marked as used" },
  { id: "call.scheduled", label: "Call scheduled" },
  { id: "call.completed", label: "Call completed" },
  { id: "feedback.created", label: "Feedback logged" },
];

const ACTIONS = [
  { id: "webhook", label: "Webhook (HTTP POST)" },
  { id: "email", label: "Email notification" },
  { id: "slack", label: "Slack message" },
];

// ── Validation ─────────────────────────────────────────────────────────────
// The target field expects a different format per action type. Disallowed
// characters are blocked at the keyboard as they're typed; paste (which
// bypasses keydown) is cleaned by the sanitizers in onChange.
const TARGET_META = {
  webhook: { label: "Webhook URL", placeholder: "https://hooks.zapier.com/…" },
  email: { label: "Email address", placeholder: "alerts@company.com" },
  slack: { label: "Slack channel", placeholder: "#sales-alerts" },
};

const KEY_FILTERS = {
  webhook: /[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=%]/, // RFC 3986 URL characters
  email: /[A-Za-z0-9@._+\-]/,
  slack: /[A-Za-z0-9#._-]/,
};

const SANITIZERS = {
  webhook: (v) => v.replace(/\s+/g, ""),
  email: (v) => {
    const noSpace = v.replace(/\s+/g, "");
    const parts = noSpace.split("@");
    return parts.length > 2 ? parts[0] + "@" + parts.slice(1).join("") : noSpace;
  },
  slack: (v) => v.replace(/[^A-Za-z0-9#._-]/g, ""),
};

function validateTarget(value, actionType) {
  const v = value.trim();
  if (!v) {
    if (actionType === "slack") return "Enter a Slack channel, e.g. #sales-alerts";
    if (actionType === "email") return "Enter an email address";
    return "Enter a webhook URL";
  }
  if (actionType === "webhook") {
    if (!/^https?:\/\//i.test(v)) return "Webhook URL must start with http:// or https://";
    try {
      const u = new URL(v);
      if (!/^https?:$/.test(u.protocol)) throw new Error("bad protocol");
    } catch {
      return "Enter a valid URL, e.g. https://hooks.zapier.com/…";
    }
  } else if (actionType === "email") {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return "Enter a valid email address, e.g. alerts@company.com";
  } else if (!/^#[A-Za-z0-9][A-Za-z0-9._-]{0,78}$/.test(v)) {
    return "Slack channels start with # and use letters, numbers, dots, or dashes";
  }
  return "";
}

function validatePayload(value) {
  if (!value.trim()) return ""; // optional field
  try {
    JSON.parse(value);
    return "";
  } catch {
    return "Invalid JSON — check for missing quotes, commas, or brackets";
  }
}

export default function AutomationRulesView() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ trigger_event: "script.completed", action_type: "webhook", target_url: "", payload_template: "", active: true });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadRules();
  }, []);

  async function loadRules() {
    setLoading(true);
    try {
      const rows = await listAutomationRules();
      setRules(rows || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const EMPTY_FORM = { trigger_event: "script.completed", action_type: "webhook", target_url: "", payload_template: "", active: true };

  const openForm = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setShowForm(true);
  };

  const setFieldError = (field, err) =>
    setErrors((prev) => {
      const next = { ...prev };
      if (err) next[field] = err;
      else delete next[field];
      return next;
    });

  const validateField = (field, value, actionType = form.action_type) => {
    const err = field === "target" ? validateTarget(value, actionType) : validatePayload(value);
    setFieldError(field, err);
    return !err;
  };

  // Keyboard guard: block disallowed characters before they enter the field.
  const keyFilter = (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return; // let copy/paste/undo through
    if (e.key === " ") { e.preventDefault(); return; }
    const allowed = KEY_FILTERS[form.action_type];
    if (e.key.length === 1 && allowed && !allowed.test(e.key)) e.preventDefault();
  };

  const targetChange = (e) => {
    const v = SANITIZERS[form.action_type](e.target.value);
    setForm({ ...form, target_url: v });
    if (errors.target) validateField("target", v); // live-fix once an error is showing
  };

  const actionChange = (e) => {
    const type = e.target.value;
    setForm({ ...form, action_type: type });
    // the expected format changed — re-check what's already typed
    if (form.target_url.trim() || errors.target) validateField("target", form.target_url, type);
    else setFieldError("target", "");
  };

  const payloadChange = (e) => {
    setForm({ ...form, payload_template: e.target.value });
    if (errors.payload) validateField("payload", e.target.value);
  };

  const save = async () => {
    const ok = [validateField("target", form.target_url), validateField("payload", form.payload_template)].every(Boolean);
    if (!ok) return;
    setSaving(true);
    try {
      await createAutomationRule(form);
      await loadRules();
      setShowForm(false);
      setForm(EMPTY_FORM);
      setErrors({});
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (rule) => {
    try {
      await updateAutomationRule(rule.id, { ...rule, active: !rule.active });
      await loadRules();
    } catch (e) {
      console.error(e);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this automation rule?")) return;
    try {
      await deleteAutomationRule(id);
      await loadRules();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <div className="ps-top">
        <div>
          
          <div className="ps-title"><Zap size={22} style={{ marginRight: 8, verticalAlign: "-3px" }} />Automation Rules</div>
          <div className="ps-sub">Zapier-style triggers. When X happens, send a webhook, email, or Slack message.</div>
        </div>
        <button className="ps-btn pri" onClick={openForm}>+ Add rule</button>
      </div>

      <div className="ps-body">
        {loading && (
          <div className="loading-box">
            <div className="ring" />
            <div className="msg">Loading rules…</div>
          </div>
        )}

        {!loading && rules.length === 0 && (
          <div className="ps-empty">
            <div className="big">No automation rules yet</div>
            <p>Connect Pitch Studio to your tools. When events happen, we'll send data automatically.</p>
            <button className="ps-btn pri" onClick={openForm}>+ Create your first rule</button>
          </div>
        )}

        {!loading && rules.length > 0 && (
          <div className="lib-list">
            {rules.map((r) => (
              <div key={r.id} className="lib-row" style={{ padding: "14px 16px" }}>
                <div className="lib-main">
                  <div className="lib-prod" style={{ fontSize: 14, marginBottom: 6 }}>
                    When <span className="chip n">{TRIGGERS.find((t) => t.id === r.trigger_event)?.label || r.trigger_event}</span>
                    {" → "}
                    <span className="chip">{ACTIONS.find((a) => a.id === r.action_type)?.label || r.action_type}</span>
                  </div>
                  <div className="lib-chips" style={{ marginTop: 4 }}>
                    <span className="chip" style={{ fontSize: 11 }}>🔗 {r.target_url}</span>
                    <span className="chip" style={{ background: r.active ? "#E6F6EF" : "#F2F5FA", color: r.active ? "var(--ok)" : "var(--faint)", fontSize: 11 }}>
                      {r.active ? "● Active" : "○ Paused"}
                    </span>
                  </div>
                </div>
                <div className="lib-actions">
                  <button className="ps-btn ghost sm" onClick={() => toggleActive(r)}>{r.active ? "Pause" : "Activate"}</button>
                  <button className="ps-btn danger sm" onClick={() => remove(r.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <div className="overlay" onClick={() => setShowForm(false)}>
            <div className="modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Add Automation Rule</div>
              <div className="frow">
                <label className="flab">When this happens<span className="req">*</span></label>
                <select className="fsel" value={form.trigger_event} onChange={(e) => setForm({ ...form, trigger_event: e.target.value })}>
                  {TRIGGERS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              <div className="frow">
                <label className="flab">Then do this<span className="req">*</span></label>
                <select className="fsel" value={form.action_type} onChange={actionChange}>
                  {ACTIONS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                </select>
              </div>
              <div className="frow">
                <label className="flab">{TARGET_META[form.action_type].label}<span className="req">*</span></label>
                <LimitedInput
                  className={`finp${errors.target ? " finp-error" : ""}`}
                  maxLength={500}
                  value={form.target_url}
                  onChange={targetChange}
                  onKeyDown={keyFilter}
                  onBlur={() => validateField("target", form.target_url)}
                  placeholder={TARGET_META[form.action_type].placeholder}
                />
                {errors.target && <div className="ferr">{errors.target}</div>}
              </div>
              <div className="frow">
                <label className="flab">Payload template <span className="opt">(optional JSON)</span></label>
                <LimitedTextarea
                  className={`ftext${errors.payload ? " ftext-error" : ""}`}
                  maxLength={5000}
                  value={form.payload_template}
                  onChange={payloadChange}
                  onBlur={() => validateField("payload", form.payload_template)}
                  placeholder={'{"event": "{{trigger}}", "product": "{{productName}}"}'}
                  style={{ minHeight: 80 }}
                />
                {errors.payload && <div className="ferr">{errors.payload}</div>}
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
                <button className="ps-btn ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="ps-btn pri" disabled={saving} onClick={save}>
                  {saving ? <><span className="spinner" /> Saving…</> : "Create rule"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
