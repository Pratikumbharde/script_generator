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

export default function AutomationRulesView() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ trigger_event: "script.completed", action_type: "webhook", target_url: "", payload_template: "", active: true });

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

  const save = async () => {
    if (!form.target_url.trim()) return;
    setSaving(true);
    try {
      await createAutomationRule(form);
      await loadRules();
      setShowForm(false);
      setForm({ trigger_event: "script.completed", action_type: "webhook", target_url: "", payload_template: "", active: true });
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
          <div className="ps-eyebrow">P6.2</div>
          <div className="ps-title"><Zap size={22} style={{ marginRight: 8, verticalAlign: "-3px" }} />Automation Rules</div>
          <div className="ps-sub">Zapier-style triggers. When X happens, send a webhook, email, or Slack message.</div>
        </div>
        <button className="ps-btn pri" onClick={() => setShowForm(true)}>+ Add rule</button>
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
            <button className="ps-btn pri" onClick={() => setShowForm(true)}>+ Create your first rule</button>
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
                <select className="fsel" value={form.action_type} onChange={(e) => setForm({ ...form, action_type: e.target.value })}>
                  {ACTIONS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                </select>
              </div>
              <div className="frow">
                <label className="flab">Target URL / Email / Channel<span className="req">*</span></label>
                <LimitedInput className="finp" maxLength={500} value={form.target_url} onChange={(e) => setForm({ ...form, target_url: e.target.value })} placeholder="https://hooks.zapier.com/… or email@company.com" />
              </div>
              <div className="frow">
                <label className="flab">Payload template <span className="opt">(optional JSON)</span></label>
                <LimitedTextarea className="ftext" maxLength={5000} value={form.payload_template} onChange={(e) => setForm({ ...form, payload_template: e.target.value })} placeholder={'{"event": "{{trigger}}", "product": "{{productName}}"}'} style={{ minHeight: 80 }} />
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
                <button className="ps-btn ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="ps-btn pri" disabled={!form.target_url.trim() || saving} onClick={save}>
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
