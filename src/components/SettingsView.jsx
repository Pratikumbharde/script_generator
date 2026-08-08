import React, { useState, useEffect } from "react";
import {
  getPreferences,
  updatePreferences,
  listAiAccounts,
  createAiAccount,
  updateAiAccount,
  deleteAiAccount,
  setPrimaryAiAccount,
  listEmailTemplates,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  duplicateEmailTemplate,
  testSmtp,
} from "../api/client.js";
import {
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Plus,
  Trash2,
  Star,
  Pencil,
  X,
  Mail,
  Copy,
  FileText,
  Send,
  Lock,
} from "lucide-react";

const PROVIDERS = [
  { id: "ollama", label: "Ollama", placeholder: "glm-5.2", basePlaceholder: "http://localhost:11434" },
  { id: "openai", label: "OpenAI", placeholder: "gpt-4o", basePlaceholder: "https://api.openai.com" },
  { id: "anthropic", label: "Anthropic", placeholder: "claude-sonnet-5", basePlaceholder: "https://api.anthropic.com" },
];

const PROVIDER_COLORS = {
  ollama: { bg: "#F2F5FA", border: "#D9E0E9", text: "#667180" },
  openai: { bg: "#EDF9F2", border: "#D0E9DE", text: "#1A7F5B" },
  anthropic: { bg: "#F7F8FC", border: "#D9DEEE", text: "#2B4CF0" },
};

export default function SettingsView() {
  const [prefs, setPrefs] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiTestStatus, setAiTestStatus] = useState({});
  const [smtpTestStatus, setSmtpTestStatus] = useState(null);
  const [showAiForm, setShowAiForm] = useState(false);
  const [showTplForm, setShowTplForm] = useState(false);
  const [editingAiId, setEditingAiId] = useState(null);
  const [editingTplId, setEditingTplId] = useState(null);
  const [aiForm, setAiForm] = useState({ name: "", provider: "ollama", model: "", api_key: "", base_url: "" });
  const [tplForm, setTplForm] = useState({ name: "", slug: "", subject: "", body: "", description: "", variables: "", active: 1 });

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [p, accs, tpls] = await Promise.all([
        getPreferences().catch(() => null),
        listAiAccounts().catch(() => []),
        listEmailTemplates().catch(() => []),
      ]);
      setPrefs(p);
      setAccounts(accs || []);
      setTemplates(tpls || []);
      if (p?.theme) {
        document.querySelector(".ps-root")?.setAttribute("data-theme", p.theme);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const savePrefs = async (updates) => {
    setSaving(true);
    try {
      const p = await updatePreferences(updates);
      setPrefs(p);
      if (p?.theme) {
        document.querySelector(".ps-root")?.setAttribute("data-theme", p.theme);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  /* ── AI Account CRUD ── */
  const openAddAi = () => {
    setEditingAiId(null);
    setAiForm({ name: "", provider: "ollama", model: "", api_key: "", base_url: "" });
    setShowAiForm(true);
  };
  const openEditAi = (acc) => {
    setEditingAiId(acc.id);
    setAiForm({
      name: acc.name || "",
      provider: acc.provider || "ollama",
      model: acc.model || "",
      api_key: acc.api_key || "",
      base_url: acc.base_url || "",
    });
    setShowAiForm(true);
  };
  const closeAiForm = () => { setShowAiForm(false); setEditingAiId(null); };
  const submitAiForm = async () => {
    if (!aiForm.name.trim()) return;
    setSaving(true);
    try {
      if (editingAiId) await updateAiAccount(editingAiId, aiForm);
      else await createAiAccount(aiForm);
      await loadAll();
      closeAiForm();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };
  const handleDeleteAi = async (id) => {
    if (!confirm("Delete this account?")) return;
    try { await deleteAiAccount(id); await loadAll(); }
    catch (e) { console.error(e); }
  };
  const handleSetPrimaryAi = async (id) => {
    try { await setPrimaryAiAccount(id); await loadAll(); }
    catch (e) { console.error(e); }
  };
  const testAiAccount = async (acc) => {
    setAiTestStatus((s) => ({ ...s, [acc.id]: null }));
    try {
      const wasPrimary = acc.is_primary;
      if (!wasPrimary) await setPrimaryAiAccount(acc.id);
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("ps_token") || ""}` },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: "Say 'Connection OK' and nothing else." },
          ],
          stream: false,
        }),
      });
      if (!wasPrimary) {
        const prevPrimary = accounts.find((a) => a.is_primary && a.id !== acc.id);
        if (prevPrimary) await setPrimaryAiAccount(prevPrimary.id);
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const text = data.message?.content || "";
      setAiTestStatus((s) => ({ ...s, [acc.id]: { ok: true, msg: `Connected. Response: "${text.slice(0, 50)}${text.length > 50 ? "…" : ""}"` } }));
    } catch (e) {
      setAiTestStatus((s) => ({ ...s, [acc.id]: { ok: false, msg: e.message || "Connection failed." } }));
    }
  };

  /* ── Email Template CRUD ── */
  const openAddTpl = () => {
    setEditingTplId(null);
    setTplForm({ name: "", slug: "", subject: "", body: "", description: "", variables: "", active: 1 });
    setShowTplForm(true);
  };
  const openEditTpl = (t) => {
    setEditingTplId(t.id);
    setTplForm({
      name: t.name || "",
      slug: t.slug || "",
      subject: t.subject || "",
      body: t.body || "",
      description: t.description || "",
      variables: t.variables || "",
      active: t.active ?? 1,
    });
    setShowTplForm(true);
  };
  const closeTplForm = () => { setShowTplForm(false); setEditingTplId(null); };
  const submitTplForm = async () => {
    if (!tplForm.name.trim() || !tplForm.subject.trim() || !tplForm.body.trim()) return;
    setSaving(true);
    try {
      if (editingTplId) await updateEmailTemplate(editingTplId, tplForm);
      else await createEmailTemplate(tplForm);
      await loadAll();
      closeTplForm();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };
  const handleDeleteTpl = async (id) => {
    if (!confirm("Delete this template?")) return;
    try { await deleteEmailTemplate(id); await loadAll(); }
    catch (e) { console.error(e); }
  };
  const handleDuplicateTpl = async (id) => {
    try { await duplicateEmailTemplate(id); await loadAll(); }
    catch (e) { console.error(e); }
  };

  /* ── SMTP Test ── */
  const handleTestSmtp = async () => {
    setSmtpTestStatus(null);
    try {
      const res = await testSmtp({ to: prefs?.smtp_from || "" });
      setSmtpTestStatus({ ok: true, msg: res.message || "Test email sent successfully." });
    } catch (e) {
      setSmtpTestStatus({ ok: false, msg: e.message || "SMTP test failed." });
    }
  };

  if (loading || !prefs) {
    return (
      <div>
        <div className="ps-top"><div><div className="ps-eyebrow">P6</div><div className="ps-title">Settings</div></div></div>
        <div className="ps-body"><div className="loading-box"><div className="ring" /><div className="msg">Loading settings…</div></div></div>
      </div>
    );
  }

  return (
    <div>
      <div className="ps-top">
        <div>
          <div className="ps-eyebrow">P6</div>
          <div className="ps-title">Settings</div>
          <div className="ps-sub">Manage your theme, notifications, AI model accounts, SMTP, and email templates.</div>
        </div>
      </div>
      <div className="ps-body">
        {/* Theme */}
        <div className="ai-section" style={{ marginBottom: 18 }}>
          <div className="ai-section-h">🎨 Appearance</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[
              { id: "light", label: "☀️ Light" },
              { id: "dark", label: "🌙 Dark" },
              { id: "system", label: "💻 System" },
            ].map((t) => (
              <button key={t.id} className={`ps-btn ${prefs.theme === t.id ? "pri" : "ghost"}`} onClick={() => savePrefs({ theme: t.id })} disabled={saving}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Email Notifications */}
        <div className="ai-section" style={{ marginBottom: 18 }}>
          <div className="ai-section-h">📧 Email Notifications</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { key: "email_weekly_digest", label: "Weekly performance digest", desc: "A summary of scripts, calls, and win rates every Monday." },
              { key: "email_call_reminders", label: "Call reminders", desc: "Reminders 15 minutes before scheduled calls." },
              { key: "email_script_alerts", label: "Script alerts", desc: "Notifications when team members create or update scripts." },
            ].map((item) => (
              <div key={item.key} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--line-soft)" }}>
                <input type="checkbox" checked={!!prefs[item.key]} onChange={(e) => savePrefs({ [item.key]: e.target.checked })} style={{ width: 18, height: 18, marginTop: 2, accentColor: "var(--accent)", cursor: "pointer" }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{item.label}</div>
                  <div style={{ fontSize: 12.5, color: "var(--faint)", marginTop: 2 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── SMTP Configuration ── */}
        <div className="ai-section" style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div className="ai-section-h" style={{ margin: 0 }}>
              <Mail size={16} style={{ verticalAlign: "-3px", marginRight: 6 }} />SMTP Configuration
            </div>
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14, lineHeight: 1.55 }}>
            Configure your outgoing mail server so the app can send email notifications, call reminders, and workspace invites.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14, marginBottom: 14 }}>
            {/* Host */}
            <div>
              <label className="ds-label" style={{ display: "block", marginBottom: 6 }}>SMTP Host</label>
              <input className="finp" type="text" placeholder="smtp.gmail.com" value={prefs.smtp_host || ""} onChange={(e) => savePrefs({ smtp_host: e.target.value })} />
            </div>
            {/* Port */}
            <div>
              <label className="ds-label" style={{ display: "block", marginBottom: 6 }}>Port</label>
              <input className="finp" type="number" placeholder="587" value={prefs.smtp_port || ""} onChange={(e) => savePrefs({ smtp_port: e.target.value ? parseInt(e.target.value) : null })} />
            </div>
            {/* Username */}
            <div>
              <label className="ds-label" style={{ display: "block", marginBottom: 6 }}>Username</label>
              <input className="finp" type="text" placeholder="you@example.com" value={prefs.smtp_user || ""} onChange={(e) => savePrefs({ smtp_user: e.target.value })} />
            </div>
            {/* Password */}
            <div>
              <label className="ds-label" style={{ display: "block", marginBottom: 6 }}>Password</label>
              <input className="finp" type="password" placeholder="••••••••" value={prefs.smtp_pass || ""} onChange={(e) => savePrefs({ smtp_pass: e.target.value })} />
            </div>
            {/* From Email */}
            <div>
              <label className="ds-label" style={{ display: "block", marginBottom: 6 }}>From Email</label>
              <input className="finp" type="email" placeholder="no-reply@pitchstudio.app" value={prefs.smtp_from || ""} onChange={(e) => savePrefs({ smtp_from: e.target.value })} />
            </div>
            {/* Secure toggle */}
            <div>
              <label className="ds-label" style={{ display: "block", marginBottom: 6 }}>Encryption</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className={`ps-btn ${prefs.smtp_secure === 1 ? "pri" : "ghost"}`} onClick={() => savePrefs({ smtp_secure: 1 })} disabled={saving}>🔒 TLS / SSL</button>
                <button className={`ps-btn ${prefs.smtp_secure === 0 ? "pri" : "ghost"}`} onClick={() => savePrefs({ smtp_secure: 0 })} disabled={saving}>None (PLAIN)</button>
              </div>
            </div>
          </div>

          {/* Test SMTP */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <button className="ps-btn pri" onClick={handleTestSmtp} disabled={saving}>
              <Send size={14} /> Test SMTP
            </button>
            {smtpTestStatus && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: smtpTestStatus.ok ? "#1A7F5B" : "#B23237", background: smtpTestStatus.ok ? "#EDF9F2" : "#FDF2F2", border: `1px solid ${smtpTestStatus.ok ? "#C8E9D8" : "#F0C9CA"}`, borderRadius: 10, padding: "8px 14px" }}>
                {smtpTestStatus.ok ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                {smtpTestStatus.msg}
              </div>
            )}
          </div>
        </div>

        {/* ── Email Templates ── */}
        <div className="ai-section" style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div className="ai-section-h" style={{ margin: 0 }}>
              <FileText size={16} style={{ verticalAlign: "-3px", marginRight: 6 }} />Email Templates
            </div>
            <button className="ps-btn pri sm" onClick={openAddTpl} disabled={saving}>
              <Plus size={14} /> Add Template
            </button>
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14, lineHeight: 1.55 }}>
            Manage the email templates used for transactional emails (auth, invites) and app notifications. Variables like {"{{user_name}}"} are automatically replaced at send time.
          </div>

          {(() => {
            const TRANSACTIONAL_SLUGS = new Set(['user_registration','forgot_password','otp_verification','password_changed','workspace_invite']);
            const tx = templates.filter((t) => TRANSACTIONAL_SLUGS.has(t.slug));
            const notif = templates.filter((t) => !TRANSACTIONAL_SLUGS.has(t.slug));
            const renderCard = (t, isProtected) => (
              <div key={t.id} className="ps-card" style={{ padding: "14px 16px", position: "relative", transition: ".12s", borderLeft: isProtected ? "3px solid var(--accent)" : undefined }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      {t.name}
                      {isProtected && <span className="chip n" style={{ fontSize: 11, padding: "2px 8px" }}><Lock size={11} style={{ verticalAlign: "-1px" }} /> System</span>}
                      {!t.active && <span className="chip" style={{ fontSize: 11, padding: "2px 8px" }}>Inactive</span>}
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 3 }}>
                      Subject: <b style={{ color: "var(--ink)" }}>{t.subject}</b>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--faint)", marginTop: 2 }}>
                      Slug: <code style={{ background: "#F2F5FA", padding: "1px 5px", borderRadius: 4, fontSize: 11 }}>{t.slug}</code>
                    </div>
                    {t.variables && (
                      <div style={{ fontSize: 12, color: "var(--faint)", marginTop: 4 }}>
                        Variables: {(() => { try { const v = JSON.parse(t.variables); return v.map((x) => `{{${x}}}`).join(" "); } catch { return t.variables; } })()}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, flexWrap: "wrap" }}>
                    <button className="ps-btn-ghost" onClick={() => openEditTpl(t)} title="Edit"><Pencil size={14} /></button>
                    {!isProtected && (
                      <>
                        <button className="ps-btn-ghost" onClick={() => handleDuplicateTpl(t.id)} title="Duplicate"><Copy size={14} /></button>
                        <button className="ps-btn-ghost danger" onClick={() => handleDeleteTpl(t.id)} title="Delete"><Trash2 size={14} /></button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );

            return (
              <>
                {/* Transactional */}
                {tx.length > 0 && (
                  <>
                    <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 13, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                      <Lock size={13} /> Transactional Emails
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
                      {tx.map((t) => renderCard(t, true))}
                    </div>
                  </>
                )}
                {/* Notifications */}
                {notif.length > 0 && (
                  <>
                    <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 13, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                      <FileText size={13} /> Notification Emails
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {notif.map((t) => renderCard(t, false))}
                    </div>
                  </>
                )}
                {templates.length === 0 && (
                  <div className="ds-empty-state" style={{ padding: 28 }}>
                    <div className="icon"><FileText size={22} /></div>
                    <h3>No templates yet</h3>
                    <p>Create your first email template for notifications and reminders.</p>
                    <div className="actions"><button className="ds-btn-pri" onClick={openAddTpl}><Plus size={14} /> Add Template</button></div>
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {/* ── AI Model Accounts ── */}
        <div className="ai-section" style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div className="ai-section-h" style={{ margin: 0 }}>
              <Cpu size={16} style={{ verticalAlign: "-3px", marginRight: 6 }} />AI Model Accounts
            </div>
            <button className="ps-btn pri sm" onClick={openAddAi} disabled={saving}>
              <Plus size={14} /> Add Account
            </button>
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14, lineHeight: 1.55 }}>
            Add multiple AI provider accounts. The app will use the <b>primary</b> account for all generation tasks.
          </div>

          {accounts.length === 0 ? (
            <div className="ds-empty-state" style={{ padding: 28 }}>
              <div className="icon"><Cpu size={22} /></div>
              <h3>No AI accounts yet</h3>
              <p>Add your first AI provider account to enable script generation, coaching, deal scoring, and more.</p>
              <div className="actions"><button className="ds-btn-pri" onClick={openAddAi}><Plus size={14} /> Add Account</button></div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {accounts.map((acc) => {
                const colors = PROVIDER_COLORS[acc.provider] || PROVIDER_COLORS.ollama;
                const status = aiTestStatus[acc.id];
                return (
                  <div key={acc.id} className="ps-card" style={{ padding: "14px 16px", borderLeft: `3px solid ${colors.border}`, position: "relative", transition: ".12s" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 8, padding: "3px 10px", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", flexShrink: 0 }}>
                        {acc.provider}
                      </div>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
                          {acc.name}
                          {acc.is_primary && <span className="chip n" style={{ fontSize: 11, padding: "2px 8px" }}><Star size={11} style={{ verticalAlign: "-1px" }} /> Primary</span>}
                        </div>
                        <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 3 }}>
                          Model: <b style={{ color: "var(--ink)" }}>{acc.model || "—"}</b>
                          {acc.base_url && <> · URL: {acc.base_url}</>}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, flexWrap: "wrap" }}>
                        {!acc.is_primary && <button className="ps-btn-sm" onClick={() => handleSetPrimaryAi(acc.id)} title="Set as primary"><Star size={13} /> Set Primary</button>}
                        <button className="ps-btn-ghost" onClick={() => openEditAi(acc)} title="Edit"><Pencil size={14} /></button>
                        <button className="ps-btn-ghost" onClick={() => testAiAccount(acc)} title="Test connection"><Zap size={14} /></button>
                        <button className="ps-btn-ghost danger" onClick={() => handleDeleteAi(acc.id)} title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    {status && (
                      <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: status.ok ? "#1A7F5B" : "#B23237", background: status.ok ? "#EDF9F2" : "#FDF2F2", border: `1px solid ${status.ok ? "#C8E9D8" : "#F0C9CA"}`, borderRadius: 8, padding: "7px 12px" }}>
                        {status.ok ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                        {status.msg}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── AI Account Modal ── */}
      {showAiForm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,.35)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) closeAiForm(); }}>
          <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, width: "100%", maxWidth: 480, maxHeight: "90vh", overflow: "auto", padding: "22px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 17 }}>{editingAiId ? "Edit Account" : "Add AI Account"}</div>
              <button className="ps-btn-ghost" onClick={closeAiForm}><X size={16} /></button>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="ds-label" style={{ display: "block", marginBottom: 6 }}>Account Name</label>
              <input className="finp" type="text" placeholder="e.g. OpenAI Production" value={aiForm.name} onChange={(e) => setAiForm((f) => ({ ...f, name: e.target.value }))} autoFocus />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="ds-label" style={{ display: "block", marginBottom: 6 }}>Provider</label>
              <select className="fsel" value={aiForm.provider} onChange={(e) => setAiForm((f) => ({ ...f, provider: e.target.value }))} style={{ width: "100%" }}>
                {PROVIDERS.map((p) => (<option key={p.id} value={p.id}>{p.label}</option>))}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="ds-label" style={{ display: "block", marginBottom: 6 }}>Model</label>
              <input className="finp" type="text" placeholder={PROVIDERS.find((p) => p.id === aiForm.provider)?.placeholder || "model-name"} value={aiForm.model} onChange={(e) => setAiForm((f) => ({ ...f, model: e.target.value }))} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="ds-label" style={{ display: "block", marginBottom: 6 }}>API Key</label>
              <input className="finp" type="password" placeholder="sk-… or your provider API key" value={aiForm.api_key} onChange={(e) => setAiForm((f) => ({ ...f, api_key: e.target.value }))} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label className="ds-label" style={{ display: "block", marginBottom: 6 }}>Base URL (optional)</label>
              <input className="finp" type="text" placeholder={PROVIDERS.find((p) => p.id === aiForm.provider)?.basePlaceholder || ""} value={aiForm.base_url} onChange={(e) => setAiForm((f) => ({ ...f, base_url: e.target.value }))} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button className="ps-btn ghost" onClick={closeAiForm}>Cancel</button>
              <button className="ps-btn pri" onClick={submitAiForm} disabled={saving || !aiForm.name.trim()}>
                {saving ? "Saving…" : editingAiId ? "Update Account" : "Add Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Email Template Modal ── */}
      {showTplForm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,.35)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) closeTplForm(); }}>
          <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, width: "100%", maxWidth: 560, maxHeight: "90vh", overflow: "auto", padding: "22px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 17 }}>{editingTplId ? "Edit Template" : "Add Email Template"}</div>
              <button className="ps-btn-ghost" onClick={closeTplForm}><X size={16} /></button>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="ds-label" style={{ display: "block", marginBottom: 6 }}>Template Name</label>
              <input className="finp" type="text" placeholder="e.g. Weekly Digest" value={tplForm.name} onChange={(e) => setTplForm((f) => ({ ...f, name: e.target.value }))} autoFocus />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="ds-label" style={{ display: "block", marginBottom: 6 }}>Slug (unique ID)</label>
              <input className="finp" type="text" placeholder="e.g. weekly_digest" value={tplForm.slug} onChange={(e) => setTplForm((f) => ({ ...f, slug: e.target.value }))} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="ds-label" style={{ display: "block", marginBottom: 6 }}>Subject</label>
              <input className="finp" type="text" placeholder="e.g. Your weekly performance digest" value={tplForm.subject} onChange={(e) => setTplForm((f) => ({ ...f, subject: e.target.value }))} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="ds-label" style={{ display: "block", marginBottom: 6 }}>Body</label>
              <textarea
                className="ftext"
                rows={8}
                placeholder={`Hi {{user_name}},\n\nYour weekly summary:\nScripts: {{scripts_count}}\nCalls: {{calls_made}}\n\n— {{company_name}} Team`}
                value={tplForm.body}
                onChange={(e) => setTplForm((f) => ({ ...f, body: e.target.value }))}
                style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", fontSize: 13 }}
              />
              <div className="fhint" style={{ marginTop: 6 }}>
                Use {"{{variable_name}}"} placeholders. They will be replaced with real values when the email is sent.
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="ds-label" style={{ display: "block", marginBottom: 6 }}>Variables (JSON array, optional)</label>
              <input className="finp" type="text" placeholder='["user_name", "company_name", "scripts_count"]' value={tplForm.variables} onChange={(e) => setTplForm((f) => ({ ...f, variables: e.target.value }))} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="ds-label" style={{ display: "block", marginBottom: 6 }}>Description (optional)</label>
              <input className="finp" type="text" placeholder="Short note about when this template is used" value={tplForm.description} onChange={(e) => setTplForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label className="ds-label" style={{ display: "block", marginBottom: 6 }}>Status</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className={`ps-btn ${tplForm.active === 1 ? "pri" : "ghost"}`} onClick={() => setTplForm((f) => ({ ...f, active: 1 }))}>Active</button>
                <button className={`ps-btn ${tplForm.active === 0 ? "pri" : "ghost"}`} onClick={() => setTplForm((f) => ({ ...f, active: 0 }))}>Inactive</button>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button className="ps-btn ghost" onClick={closeTplForm}>Cancel</button>
              <button className="ps-btn pri" onClick={submitTplForm} disabled={saving || !tplForm.name.trim() || !tplForm.subject.trim() || !tplForm.body.trim()}>
                {saving ? "Saving…" : editingTplId ? "Update Template" : "Add Template"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
