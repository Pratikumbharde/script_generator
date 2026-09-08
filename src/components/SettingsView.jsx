import React, { useState, useEffect } from "react";
import {
  getPreferences,
  updatePreferences,
  getAiConfig,
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
  fetchAiModels,
  testDeepgram,
  updateBranding,
  uploadBrandingImage,
} from "../api/client.js";
import { useBrand } from "../context/BrandContext.jsx";
import { DEFAULT_LANDING } from "../data/brandingDefaults.js";
import LimitedInput from './shared/LimitedInput.jsx'
import LimitedTextarea from './shared/LimitedTextarea.jsx'
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
  Settings,
  AudioLines,
  Palette,
  LayoutTemplate,
  Image as ImageIcon,
  Globe,
} from "lucide-react";

const PROVIDERS = [
  { id: "ollama", label: "Ollama", placeholder: "glm-5.2", basePlaceholder: "http://localhost:11434", hint: "Local or Ollama Cloud endpoint. Base URL required for local; cloud uses your API key." },
  { id: "anthropic", label: "Claude (Anthropic)", placeholder: "claude-sonnet-5", basePlaceholder: "https://api.anthropic.com", hint: "Uses your Anthropic API key (sk-ant-…)." },
  { id: "deepseek", label: "DeepSeek", placeholder: "deepseek-chat", basePlaceholder: "https://api.deepseek.com", hint: "Uses your DeepSeek API key. Models: deepseek-chat, deepseek-reasoner." },
  { id: "openai", label: "OpenAI", placeholder: "gpt-4o", basePlaceholder: "https://api.openai.com", hint: "Uses your OpenAI API key (sk-…)." },
];

const PROVIDER_COLORS = {
  ollama: { bg: "#F2F5FA", border: "#D9E0E9", text: "#667180" },
  openai: { bg: "#EDF9F2", border: "#D0E9DE", text: "#1A7F5B" },
  anthropic: { bg: "#F7F8FC", border: "#D9DEEE", text: "#2B4CF0" },
  deepseek: { bg: "#F0F4FF", border: "#C7D5FB", text: "#3B5BDB" },
};

/* Small labeled input/textarea row used by the Branding + Landing Page tabs */
function LField({ label, value, onChange, max = 200, placeholder = "", textarea = false, rows = 3, hint }) {
  return (
    <div>
      <label className="ds-label" style={{ display: "block", marginBottom: 6 }}>{label}</label>
      {textarea ? (
        <LimitedTextarea className="ftext" maxLength={max} rows={rows} value={value} onChange={onChange} placeholder={placeholder} />
      ) : (
        <LimitedInput className="finp" maxLength={max} type="text" value={value} onChange={onChange} placeholder={placeholder} />
      )}
      {hint && <div className="fhint" style={{ marginTop: 5 }}>{hint}</div>}
    </div>
  );
}

/* Image picker (logo / favicon) with live preview + remove */
function ImageField({ label, value, onPick, onRemove, hint, preview = 44 }) {
  return (
    <div>
      <label className="ds-label" style={{ display: "block", marginBottom: 6 }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ width: preview, height: preview, borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
          {value
            ? <img src={value} alt={label} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
            : <ImageIcon size={18} style={{ color: "var(--faint)" }} />}
        </div>
        <label className="ps-btn ghost sm" style={{ cursor: "pointer", margin: 0 }}>
          <ImageIcon size={13} /> {value ? "Replace" : "Upload"}
          <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif,image/x-icon" style={{ display: "none" }} onChange={(e) => { onPick(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
        {value && <button className="ps-btn-ghost danger" onClick={onRemove} title="Remove image"><Trash2 size={13} /></button>}
      </div>
      {hint && <div className="fhint" style={{ marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

export default function SettingsView() {
  const [prefs, setPrefs] = useState(null);
  const [aiConfig, setAiConfig] = useState(null);
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
  const [aiModels, setAiModels] = useState([]);
  const [aiModelsLoading, setAiModelsLoading] = useState(false);
  const [aiModelsError, setAiModelsError] = useState("");
  const [dgTesting, setDgTesting] = useState(false);
  const [dgStatus, setDgStatus] = useState(null);
  const [tplForm, setTplForm] = useState({ name: "", slug: "", subject: "", body: "", description: "", variables: "", active: 1 });
  const [activeTab, setActiveTab] = useState(() => {
    try { return localStorage.getItem("ps_settings_tab") || "general"; } catch { return "general"; }
  });

  useEffect(() => {
    try { localStorage.setItem("ps_settings_tab", activeTab); } catch { /* noop */ }
  }, [activeTab]);

  const SETTINGS_TABS = [
    { id: "general", label: "General", icon: Settings },
    { id: "branding", label: "Branding", icon: Palette },
    { id: "landing", label: "Landing Page", icon: LayoutTemplate },
    { id: "email", label: "Email", icon: Mail },
    { id: "ai", label: "AI Models", icon: Cpu },
  ];

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [p, cfg, accs, tpls] = await Promise.all([
        getPreferences().catch(() => null),
        getAiConfig().catch(() => null),
        listAiAccounts().catch(() => []),
        listEmailTemplates().catch(() => []),
      ]);
      setPrefs(p);
      setAiConfig(cfg);
      setAccounts(accs || []);
      setTemplates(tpls || []);
      if (p?.theme) {
        document.querySelector(".ps-root")?.setAttribute("data-theme", p.theme);
        localStorage.setItem("ps_theme", p.theme);
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
        localStorage.setItem("ps_theme", p.theme);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  /* ── Branding (site name, logo, favicon, meta tags) & Landing page copy ──
     Edits are local until "Save" — the live brand context is refreshed on
     save so the sidebar / landing / login update immediately. */
  const { branding: liveBranding, landing: liveLanding, refresh: refreshBrand } = useBrand();
  const [brandForm, setBrandForm] = useState(null);
  const [landingForm, setLandingForm] = useState(null);
  const [brandStatus, setBrandStatus] = useState(null);
  const [landingStatus, setLandingStatus] = useState(null);

  useEffect(() => {
    if (liveBranding && !brandForm) {
      setBrandForm({
        site_name: liveBranding.site_name || "",
        site_tagline: liveBranding.site_tagline || "",
        meta_description: liveBranding.meta_description || "",
        meta_keywords: liveBranding.meta_keywords || "",
        logo_data: liveBranding.logo_data || null,
        favicon_data: liveBranding.favicon_data || null,
      });
    }
  }, [liveBranding]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (liveLanding && !landingForm) {
      setLandingForm(JSON.parse(JSON.stringify(liveLanding)));
    }
  }, [liveLanding]); // eslint-disable-line react-hooks/exhaustive-deps

  const pickBrandImage = async (file, field) => {
    if (!file) return;
    try {
      if (!file.type.startsWith("image/")) throw new Error("Please choose an image file (PNG, JPG, WebP, SVG).");
      if (file.size > 5 * 1024 * 1024) throw new Error("Image is too large — keep it under 5 MB.");
      setBrandStatus({ ok: true, msg: `Uploading ${field === "logo_data" ? "logo" : "favicon"}…` });
      const kind = field === "logo_data" ? "logo" : "favicon";
      const url = await uploadBrandingImage(file, kind);
      setBrandForm((f) => ({ ...f, [field]: url }));
      setBrandStatus({ ok: true, msg: "Image uploaded — press Save Branding to apply." });
    } catch (e) {
      setBrandStatus({ ok: false, msg: e.message || "Upload failed." });
    }
  };

  const saveBranding = async () => {
    if (!brandForm) return;
    if (!String(brandForm.site_name || "").trim()) {
      setBrandStatus({ ok: false, msg: "Site name is required — it appears everywhere in the app." });
      return;
    }
    setSaving(true);
    try {
      const b = await updateBranding({
        site_name: brandForm.site_name,
        site_tagline: brandForm.site_tagline || null,
        meta_description: brandForm.meta_description || null,
        meta_keywords: brandForm.meta_keywords || null,
        logo_data: brandForm.logo_data || null,
        favicon_data: brandForm.favicon_data || null,
      });
      refreshBrand(b);
      setBrandForm((f) => ({ ...f, logo_data: b.logo_data || null, favicon_data: b.favicon_data || null }));
      setBrandStatus({ ok: true, msg: "Branding saved — applied across the app." });
    } catch (e) {
      setBrandStatus({ ok: false, msg: e.message || "Could not save branding." });
    } finally {
      setSaving(false);
    }
  };

  const saveLanding = async () => {
    if (!landingForm) return;
    setSaving(true);
    try {
      const b = await updateBranding({ landing: landingForm });
      refreshBrand(b);
      setLandingStatus({ ok: true, msg: "Landing page content saved." });
    } catch (e) {
      setLandingStatus({ ok: false, msg: e.message || "Could not save landing content." });
    } finally {
      setSaving(false);
    }
  };

  /* Immutable update for the nested landing draft */
  const updLanding = (mutate) => {
    setLandingForm((f) => {
      const c = JSON.parse(JSON.stringify(f));
      mutate(c);
      return c;
    });
  };
  const resetLanding = () => {
    if (!confirm("Reset all landing page content to the default copy?")) return;
    updLanding((c) => { Object.assign(c, JSON.parse(JSON.stringify(DEFAULT_LANDING))); });
    setLandingStatus(null);
  };

  /* ── AI Account CRUD ── */
  /* Fetch the provider's model list using the credentials entered in the form.
     Falls back server-side to the user's primary account, then .env. */
  const loadAiModels = async (form) => {
    const f = form || aiForm;
    setAiModelsLoading(true);
    setAiModelsError("");
    try {
      const res = await fetchAiModels({ provider: f.provider, api_key: f.api_key || undefined, base_url: f.base_url || undefined });
      const models = res.models || [];
      setAiModels(models);
      if (!f.model && models.length) {
        const pick = f.provider === "ollama" ? (models.find((m) => m.endsWith(":cloud")) || models[0]) : models[0];
        setAiForm((prev) => ({ ...prev, model: pick }));
      }
    } catch (e) {
      setAiModels([]);
      setAiModelsError(e.message || "Could not fetch models — enter the model name manually.");
    } finally {
      setAiModelsLoading(false);
    }
  };
  const openAddAi = () => {
    setEditingAiId(null);
    const fresh = { name: "", provider: "ollama", model: "", api_key: "", base_url: PROVIDERS.find((p) => p.id === "ollama")?.basePlaceholder || "" };
    setAiForm(fresh);
    setShowAiForm(true);
    loadAiModels(fresh);
  };
  const openEditAi = (acc) => {
    setEditingAiId(acc.id);
    const f = {
      name: acc.name || "",
      provider: acc.provider || "ollama",
      model: acc.model || "",
      api_key: acc.api_key || "",
      base_url: acc.base_url || "",
    };
    setAiForm(f);
    setShowAiForm(true);
    loadAiModels(f);
  };
  const closeAiForm = () => { setShowAiForm(false); setEditingAiId(null); };
  const submitAiForm = async () => {
    if (!aiForm.name.trim() || !aiForm.base_url.trim()) return;
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

  /* ── Deepgram (Speech-to-Text) ── */
  const testDg = async () => {
    setDgTesting(true);
    setDgStatus(null);
    try {
      const res = await testDeepgram();
      setDgStatus({ ok: !!res.ok, msg: res.ok ? (res.message || "Key valid") : (res.error || "Key rejected") });
    } catch (e) {
      setDgStatus({ ok: false, msg: e.message || "Could not reach Deepgram." });
    } finally {
      setDgTesting(false);
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
        <div className="ps-top"><div><div className="ps-title"><Settings size={22} style={{ marginRight: 8, verticalAlign: "-3px" }} />Settings</div></div></div>
        <div className="ps-body"><div className="loading-box"><div className="ring" /><div className="msg">Loading settings…</div></div></div>
      </div>
    );
  }

  return (
    <div>
      <div className="ps-top">
        <div>
          <div className="ps-title"><Settings size={22} style={{ marginRight: 8, verticalAlign: "-3px" }} />Settings</div>
          <div className="ps-sub">Manage your branding, landing page content, appearance, notifications, email (SMTP + templates), and AI model accounts.</div>
        </div>
      </div>
      <div className="ps-body">
        {/* Tab bar */}
        <div className="st-tabs" role="tablist" aria-label="Settings sections">
          {SETTINGS_TABS.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`st-tab ${activeTab === tab.id ? "st-active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <TabIcon size={15} /> {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "general" && (
        <>
        {/* Theme */}
        <div className="ai-section" style={{ marginBottom: 18 }}>
          <div className="ai-section-h">🎨 Appearance</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[
              { id: "light", label: "☀️ Light" },
              { id: "dark", label: "🌙 Dark" },
            ].map((t) => {
              // Normalize the legacy "system" value so the active state stays visible
              const activeTheme = prefs.theme === "system" ? "light" : prefs.theme;
              return (
                <button key={t.id} className={`ps-btn ${activeTheme === t.id ? "pri" : "ghost"}`} onClick={() => savePrefs({ theme: t.id })} disabled={saving}>
                  {t.label}
                </button>
              );
            })}
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

        </>
        )}

        {activeTab === "branding" && (
          !brandForm ? (
            <div className="ai-section" style={{ marginBottom: 18 }}><div className="loading-box"><div className="ring" /><div className="msg">Loading branding…</div></div></div>
          ) : (
          <>
          {/* Site identity */}
          <div className="ai-section" style={{ marginBottom: 18 }}>
            <div className="ai-section-h"><Globe size={16} style={{ verticalAlign: "-3px", marginRight: 6 }} />Site Identity</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14, lineHeight: 1.55 }}>
              These values apply <b>everywhere</b> — browser tab title, sidebar, login/register screens, landing page and the PWA (app name + icon).
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
              <LField
                label="Site Name"
                value={brandForm.site_name}
                onChange={(e) => { setBrandForm((f) => ({ ...f, site_name: e.target.value })); setBrandStatus(null); }}
                max={80}
                placeholder="Pitch Studio"
                hint="Shown in the sidebar, login page, landing page and browser tab."
              />
              <LField
                label="Tagline (optional)"
                value={brandForm.site_tagline}
                onChange={(e) => { setBrandForm((f) => ({ ...f, site_tagline: e.target.value })); setBrandStatus(null); }}
                max={200}
                placeholder="The live-call cockpit for sales teams"
              />
            </div>
          </div>

          {/* Logo & favicon */}
          <div className="ai-section" style={{ marginBottom: 18 }}>
            <div className="ai-section-h"><ImageIcon size={16} style={{ verticalAlign: "-3px", marginRight: 6 }} />Logo & Favicon</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 }}>
              <ImageField
                label="Logo"
                value={brandForm.logo_data}
                onPick={(file) => pickBrandImage(file, "logo_data")}
                onRemove={() => { setBrandForm((f) => ({ ...f, logo_data: null })); setBrandStatus(null); }}
                hint="Shown in the sidebar, login page and landing nav/footer. PNG/SVG with transparent background works best. Max 5 MB — leave empty to keep the default accent dot."
              />
              <ImageField
                label="Favicon"
                value={brandForm.favicon_data}
                onPick={(file) => pickBrandImage(file, "favicon_data")}
                onRemove={() => { setBrandForm((f) => ({ ...f, favicon_data: null })); setBrandStatus(null); }}
                hint="Browser tab icon and PWA/app icon. Square PNG 192×192 or 512×512 recommended. Max 5 MB."
              />
            </div>
          </div>

          {/* Meta tags */}
          <div className="ai-section" style={{ marginBottom: 18 }}>
            <div className="ai-section-h"><Globe size={16} style={{ verticalAlign: "-3px", marginRight: 6 }} />Meta Tags (SEO)</div>
            <div style={{ display: "grid", gap: 14 }}>
              <LField
                label="Meta Description"
                value={brandForm.meta_description}
                onChange={(e) => { setBrandForm((f) => ({ ...f, meta_description: e.target.value })); setBrandStatus(null); }}
                max={300}
                textarea
                rows={2}
                placeholder="AI sales script generator for high-performing teams"
                hint={'Used for the meta description tag — what search engines show under your link.'}
              />
              <LField
                label="Meta Keywords (optional, comma-separated)"
                value={brandForm.meta_keywords}
                onChange={(e) => { setBrandForm((f) => ({ ...f, meta_keywords: e.target.value })); setBrandStatus(null); }}
                max={300}
                placeholder="sales scripts, sales enablement, AI sales coach"
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <button className="ps-btn pri" onClick={saveBranding} disabled={saving}>
              {saving ? "Saving…" : "Save Branding"}
            </button>
            {brandStatus && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: brandStatus.ok ? "#1A7F5B" : "#B23237", background: brandStatus.ok ? "#EDF9F2" : "#FDF2F2", border: `1px solid ${brandStatus.ok ? "#C8E9D8" : "#F0C9CA"}`, borderRadius: 10, padding: "8px 14px" }}>
                {brandStatus.ok ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                {brandStatus.msg}
              </div>
            )}
          </div>
          </>
          )
        )}

        {activeTab === "landing" && (
          !landingForm ? (
            <div className="ai-section" style={{ marginBottom: 18 }}><div className="loading-box"><div className="ring" /><div className="msg">Loading landing content…</div></div></div>
          ) : (
          <>
          <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14, lineHeight: 1.55 }}>
            Edit the public landing page copy. Leave a field empty to fall back to the default text.
            In the hero title, wrap words in <code style={{ background: "#F2F5FA", padding: "1px 5px", borderRadius: 4, fontSize: 11 }}>**double asterisks**</code> to render them with the accent highlight.
          </div>

          {/* Hero */}
          <div className="ai-section" style={{ marginBottom: 18 }}>
            <div className="ai-section-h">🚀 Hero Section</div>
            <div style={{ display: "grid", gap: 14 }}>
              <LField label="Eyebrow (badge above the title)" value={landingForm.eyebrow} onChange={(e) => updLanding((c) => { c.eyebrow = e.target.value; })} max={120} placeholder="AI-powered sales enablement" />
              <LField label="Hero Title" value={landingForm.hero_title} onChange={(e) => updLanding((c) => { c.hero_title = e.target.value; })} max={300} textarea rows={2} placeholder='Walk into every sales call with the **perfect script** — already in your pocket.' hint="Use **…** around words to give them the accent-gradient highlight." />
              <LField label="Hero Subtitle" value={landingForm.hero_subtitle} onChange={(e) => updLanding((c) => { c.hero_subtitle = e.target.value; })} max={600} textarea rows={3} />
              <LField label="Note under CTAs" value={landingForm.hero_note} onChange={(e) => updLanding((c) => { c.hero_note = e.target.value; })} max={200} placeholder="Free to start · No credit card" />
            </div>
          </div>

          {/* Flow strip */}
          <div className="ai-section" style={{ marginBottom: 18 }}>
            <div className="ai-section-h">➡️ Flow Strip (3 steps under the hero)</div>
            <div style={{ display: "grid", gap: 14 }}>
              {landingForm.flow.map((step, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "minmax(180px, 1fr) minmax(260px, 2fr)", gap: 10, alignItems: "start" }}>
                  <LField label={`Step ${i + 1} · Title`} value={step.title} onChange={(e) => updLanding((c) => { c.flow[i].title = e.target.value; })} max={120} />
                  <LField label="Description" value={step.body} onChange={(e) => updLanding((c) => { c.flow[i].body = e.target.value; })} max={300} />
                </div>
              ))}
            </div>
          </div>

          {/* What is it */}
          <div className="ai-section" style={{ marginBottom: 18 }}>
            <div className="ai-section-h">💡 "What is it" Section</div>
            <div style={{ display: "grid", gap: 14 }}>
              <LField label="Kicker" value={landingForm.what.kicker} onChange={(e) => updLanding((c) => { c.what.kicker = e.target.value; })} max={120} />
              <LField label="Heading" value={landingForm.what.title} onChange={(e) => updLanding((c) => { c.what.title = e.target.value; })} max={200} />
              <LField label="Body" value={landingForm.what.body} onChange={(e) => updLanding((c) => { c.what.body = e.target.value; })} max={800} textarea rows={3} />
              <div>
                <label className="ds-label" style={{ display: "block", marginBottom: 6 }}>Checklist (one line per item)</label>
                <div style={{ display: "grid", gap: 8 }}>
                  {landingForm.what.checklist.map((item, i) => (
                    <LimitedInput key={i} className="finp" maxLength={200} type="text" value={item} onChange={(e) => updLanding((c) => { c.what.checklist[i] = e.target.value; })} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="ai-section" style={{ marginBottom: 18 }}>
            <div className="ai-section-h">🧭 "How it works" Section</div>
            <div style={{ display: "grid", gap: 14 }}>
              <LField label="Kicker" value={landingForm.how.kicker} onChange={(e) => updLanding((c) => { c.how.kicker = e.target.value; })} max={120} />
              <LField label="Heading" value={landingForm.how.title} onChange={(e) => updLanding((c) => { c.how.title = e.target.value; })} max={200} />
              <LField label="Lead" value={landingForm.how.lead} onChange={(e) => updLanding((c) => { c.how.lead = e.target.value; })} max={400} />
              {landingForm.how.steps.map((step, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "minmax(180px, 1fr) minmax(260px, 2fr)", gap: 10, alignItems: "start", padding: "10px 12px", border: "1px solid var(--line-soft)", borderRadius: 10 }}>
                  <LField label={`Step ${i + 1} · Title`} value={step.title} onChange={(e) => updLanding((c) => { c.how.steps[i].title = e.target.value; })} max={120} />
                  <LField label="Description" value={step.body} onChange={(e) => updLanding((c) => { c.how.steps[i].body = e.target.value; })} max={600} textarea rows={3} />
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="ai-section" style={{ marginBottom: 18 }}>
            <div className="ai-section-h">⚡ Features Grid</div>
            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
                <LField label="Kicker" value={landingForm.features.kicker} onChange={(e) => updLanding((c) => { c.features.kicker = e.target.value; })} max={120} />
                <LField label="Heading" value={landingForm.features.title} onChange={(e) => updLanding((c) => { c.features.title = e.target.value; })} max={200} />
              </div>
              {landingForm.features.items.map((item, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "minmax(180px, 1fr) minmax(260px, 2fr)", gap: 10, alignItems: "start", padding: "10px 12px", border: "1px solid var(--line-soft)", borderRadius: 10 }}>
                  <LField label={`Feature ${i + 1} · Title`} value={item.title} onChange={(e) => updLanding((c) => { c.features.items[i].title = e.target.value; })} max={120} />
                  <LField label="Description" value={item.body} onChange={(e) => updLanding((c) => { c.features.items[i].body = e.target.value; })} max={400} textarea rows={2} />
                </div>
              ))}
            </div>
          </div>

          {/* Who it's for */}
          <div className="ai-section" style={{ marginBottom: 18 }}>
            <div className="ai-section-h">👥 "Who it's for" Section</div>
            <div style={{ display: "grid", gap: 14 }}>
              <LField label="Kicker" value={landingForm.who.kicker} onChange={(e) => updLanding((c) => { c.who.kicker = e.target.value; })} max={120} />
              <LField label="Heading" value={landingForm.who.title} onChange={(e) => updLanding((c) => { c.who.title = e.target.value; })} max={200} />
              <LField label="Lead" value={landingForm.who.lead} onChange={(e) => updLanding((c) => { c.who.lead = e.target.value; })} max={800} textarea rows={3} />
              {landingForm.who.cards.map((card, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "minmax(180px, 1fr) minmax(260px, 2fr)", gap: 10, alignItems: "start", padding: "10px 12px", border: "1px solid var(--line-soft)", borderRadius: 10 }}>
                  <LField label={`Card ${i + 1} · Title`} value={card.title} onChange={(e) => updLanding((c) => { c.who.cards[i].title = e.target.value; })} max={120} />
                  <LField label="Description" value={card.body} onChange={(e) => updLanding((c) => { c.who.cards[i].body = e.target.value; })} max={400} textarea rows={2} />
                </div>
              ))}
            </div>
          </div>

          {/* Final CTA + footer */}
          <div className="ai-section" style={{ marginBottom: 18 }}>
            <div className="ai-section-h">🎯 Final CTA & Footer</div>
            <div style={{ display: "grid", gap: 14 }}>
              <LField label="CTA Heading" value={landingForm.cta.title} onChange={(e) => updLanding((c) => { c.cta.title = e.target.value; })} max={200} />
              <LField label="CTA Body" value={landingForm.cta.body} onChange={(e) => updLanding((c) => { c.cta.body = e.target.value; })} max={400} />
              <LField label="Footer Tagline" value={landingForm.footer_tagline} onChange={(e) => updLanding((c) => { c.footer_tagline = e.target.value; })} max={200} />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <button className="ps-btn pri" onClick={saveLanding} disabled={saving}>
              {saving ? "Saving…" : "Save Landing Content"}
            </button>
            <button className="ps-btn ghost" onClick={resetLanding} disabled={saving}>Reset to defaults</button>
            {landingStatus && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: landingStatus.ok ? "#1A7F5B" : "#B23237", background: landingStatus.ok ? "#EDF9F2" : "#FDF2F2", border: `1px solid ${landingStatus.ok ? "#C8E9D8" : "#F0C9CA"}`, borderRadius: 10, padding: "8px 14px" }}>
                {landingStatus.ok ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                {landingStatus.msg}
              </div>
            )}
          </div>
          </>
          )
        )}

        {activeTab === "email" && (
        <>
        {/* ── SMTP Configuration ── */}
        <div className="ai-section" style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div className="ai-section-h" style={{ margin: 0 }}>
              <Mail size={16} style={{ verticalAlign: "-3px", marginRight: 6 }} />SMTP Configuration
            </div>
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14, lineHeight: 1.55 }}>
            Configure your outgoing mail server so the app can send email notifications, call reminders, and workspace invites. If no system-wide SMTP is set by the admin, these credentials are also used to deliver password-reset emails. Use "Test SMTP" to verify before saving important changes.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14, marginBottom: 14 }}>
            {/* Host */}
            <div>
              <label className="ds-label" style={{ display: "block", marginBottom: 6 }}>SMTP Host</label>
              <LimitedInput className="finp" maxLength={200} type="text" placeholder="smtp.gmail.com" value={prefs.smtp_host || ""} onChange={(e) => savePrefs({ smtp_host: e.target.value })} />
            </div>
            {/* Port */}
            <div>
              <label className="ds-label" style={{ display: "block", marginBottom: 6 }}>Port</label>
              <input className="finp" type="number" placeholder="587" value={prefs.smtp_port || ""} onChange={(e) => savePrefs({ smtp_port: e.target.value ? parseInt(e.target.value) : null })} />
            </div>
            {/* Username */}
            <div>
              <label className="ds-label" style={{ display: "block", marginBottom: 6 }}>Username</label>
              <LimitedInput className="finp" maxLength={200} type="text" placeholder="you@example.com" value={prefs.smtp_user || ""} onChange={(e) => savePrefs({ smtp_user: e.target.value })} />
            </div>
            {/* Password */}
            <div>
              <label className="ds-label" style={{ display: "block", marginBottom: 6 }}>Password</label>
              <input className="finp" type="password" placeholder="••••••••" value={prefs.smtp_pass || ""} onChange={(e) => savePrefs({ smtp_pass: e.target.value })} />
            </div>
            {/* From Email */}
            <div>
              <label className="ds-label" style={{ display: "block", marginBottom: 6 }}>From Email</label>
              <LimitedInput className="finp" maxLength={200} type="email" placeholder="no-reply@pitchstudio.app" value={prefs.smtp_from || ""} onChange={(e) => savePrefs({ smtp_from: e.target.value })} />
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

        </>
        )}

        {activeTab === "ai" && (
        <>
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

          {aiConfig && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14, padding: "10px 14px", borderRadius: 10, background: "var(--accent-bg, #F0F4FF)", border: "1px solid rgba(43,76,240,.15)", fontSize: 13 }}>
              <Zap size={14} style={{ color: "#2B4CF0", flexShrink: 0 }} />
              <span>
                Active provider: <b>{PROVIDERS.find((p) => p.id === aiConfig.provider)?.label || aiConfig.provider}</b>
                {aiConfig.model && <> · model <b>{aiConfig.model}</b></>}
                {" · "}
                {aiConfig.source === "account" ? "from your primary account" : aiConfig.source === "preferences" ? "from legacy preferences" : "from server environment (.env fallback)"}
                {aiConfig.source === "env" && accounts.length > 0 && " — set an account as primary to override"}
              </span>
            </div>
          )}

          {accounts.length === 0 ? (
            <div className="ds-empty-state" style={{ padding: 28 }}>
              <div className="icon"><Cpu size={22} /></div>
              <h3>No AI accounts yet</h3>
              <p>Add your first AI provider account to enable script generation, coaching, deal scoring, and more.</p>
              <div className="actions"><button className="ds-btn-pri" onClick={openAddAi}><Plus size={14} /> Add Account</button></div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 12, alignItems: "stretch" }}>
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
                        <button className="ps-btn-sm" onClick={() => testAiAccount(acc)} title="Test connection"><Zap size={13} /> Test</button>
                        <button className="ps-btn-ghost" onClick={() => openEditAi(acc)} title="Edit"><Pencil size={14} /></button>
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
        {/* ── Speech-to-Text (Deepgram) ── */}
        <div className="ai-section" style={{ marginTop: 18 }}>
          <div className="ai-section-h" style={{ marginBottom: 14 }}>
            <AudioLines size={16} style={{ verticalAlign: "-3px", marginRight: 6 }} />Speech-to-Text — Deepgram
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14, lineHeight: 1.55 }}>
            Used to transcribe <b>uploaded call audio</b> in Call Analysis (with speaker separation).
            Your key is tried first; the server's .env key is the fallback. "Record Live" and "Type Call Details" need no key.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 2fr) minmax(160px, 1fr)", gap: 12, alignItems: "start" }}>
            <div>
              <label className="ds-label" style={{ display: "block", marginBottom: 6 }}>API Key</label>
              <LimitedInput
                className="finp"
                maxLength={200}
                type="password"
                placeholder="Paste your Deepgram API key"
                value={prefs.dg_api_key || ""}
                onChange={(e) => savePrefs({ dg_api_key: e.target.value })}
              />
            </div>
            <div>
              <label className="ds-label" style={{ display: "block", marginBottom: 6 }}>Model</label>
              <select
                className="fsel"
                value={prefs.dg_model || "nova-2"}
                onChange={(e) => savePrefs({ dg_model: e.target.value })}
                style={{ width: "100%" }}
              >
                <option value="nova-2">nova-2 (fast, en/hi/mr)</option>
                <option value="nova-3">nova-3 (newer, better accuracy)</option>
                <option value="base">base (cheapest)</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            <button className="ps-btn ghost sm" onClick={testDg} disabled={dgTesting}>
              <Zap size={13} /> {dgTesting ? "Testing…" : "Test key"}
            </button>
            {dgStatus && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: dgStatus.ok ? "#1A7F5B" : "#B23237", background: dgStatus.ok ? "#EDF9F2" : "#FDF2F2", border: `1px solid ${dgStatus.ok ? "#C8E9D8" : "#F0C9CA"}`, borderRadius: 8, padding: "6px 12px" }}>
                {dgStatus.ok ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                {dgStatus.msg}
              </span>
            )}
          </div>
          <div className="fhint" style={{ marginTop: 10 }}>
            No Deepgram account yet? Create one at console.deepgram.com — the free tier includes $200 in credits.
          </div>
        </div>
        </>
        )}
      </div>
      {showAiForm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,.35)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) closeAiForm(); }}>
          <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, width: "100%", maxWidth: 480, maxHeight: "90vh", overflow: "auto", padding: "22px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 17 }}>{editingAiId ? "Edit Account" : "Add AI Account"}</div>
              <button className="ps-btn-ghost" onClick={closeAiForm}><X size={16} /></button>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="ds-label" style={{ display: "block", marginBottom: 6 }}>Account Name</label>
              <LimitedInput className="finp" maxLength={200} type="text" placeholder="e.g. OpenAI Production" value={aiForm.name} onChange={(e) => setAiForm((f) => ({ ...f, name: e.target.value }))} autoFocus />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="ds-label" style={{ display: "block", marginBottom: 6 }}>Provider</label>
              <select className="fsel" value={aiForm.provider} onChange={(e) => { const np = e.target.value; const defBase = PROVIDERS.find((p) => p.id === np)?.basePlaceholder || ""; setAiForm((f) => ({ ...f, provider: np, model: "", base_url: defBase })); loadAiModels({ ...aiForm, provider: np, model: "", base_url: defBase }); }} style={{ width: "100%" }}>
                {PROVIDERS.map((p) => (<option key={p.id} value={p.id}>{p.label}</option>))}
              </select>
              {PROVIDERS.find((p) => p.id === aiForm.provider)?.hint && (
                <div className="fhint" style={{ marginTop: 6 }}>{PROVIDERS.find((p) => p.id === aiForm.provider).hint}</div>
              )}
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="ds-label" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span>Model</span>
                <button
                  type="button"
                  className="ps-btn ghost sm"
                  style={{ padding: "3px 10px", fontSize: 12 }}
                  onClick={() => loadAiModels(aiForm)}
                  disabled={aiModelsLoading}
                  title="Fetch available models using these credentials"
                >
                  {aiModelsLoading ? "Fetching…" : aiModels.length ? `↻ ${aiModels.length} models` : "⟳ Fetch models"}
                </button>
              </label>
              {aiModels.length > 0 ? (
                <select className="fsel" value={aiForm.model} onChange={(e) => setAiForm((f) => ({ ...f, model: e.target.value }))} style={{ width: "100%" }}>
                  <option value="">— select a model —</option>
                  {aiModels.map((m) => (<option key={m} value={m}>{m}</option>))}
                </select>
              ) : (
                <LimitedInput className="finp" maxLength={200} type="text" placeholder={PROVIDERS.find((p) => p.id === aiForm.provider)?.placeholder || "model-name"} value={aiForm.model} onChange={(e) => setAiForm((f) => ({ ...f, model: e.target.value }))} />
              )}
              {aiModelsError && <div className="fhint" style={{ marginTop: 6, color: "#B23237" }}>{aiModelsError}</div>}
              {!aiModelsError && aiModels.length > 0 && <div className="fhint" style={{ marginTop: 6 }}>Fetched from the provider using your credentials — pick one, or refetch after changing the key.</div>}
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="ds-label" style={{ display: "block", marginBottom: 6 }}>API Key</label>
              <input className="finp" type="password" placeholder="sk-… or your provider API key" value={aiForm.api_key} onChange={(e) => setAiForm((f) => ({ ...f, api_key: e.target.value }))} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label className="ds-label" style={{ display: "block", marginBottom: 6 }}>Base URL <span style={{ color: "#B23237" }}>*</span></label>
              <LimitedInput className="finp" maxLength={500} type="text" placeholder={PROVIDERS.find((p) => p.id === aiForm.provider)?.basePlaceholder || ""} value={aiForm.base_url} onChange={(e) => setAiForm((f) => ({ ...f, base_url: e.target.value }))} />
              {!aiForm.base_url.trim() && <div className="fhint" style={{ marginTop: 6, color: "#B23237" }}>Base URL is required — e.g. {PROVIDERS.find((p) => p.id === aiForm.provider)?.basePlaceholder || "https://…"}</div>}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button className="ps-btn ghost" onClick={closeAiForm}>Cancel</button>
              <button className="ps-btn pri" onClick={submitAiForm} disabled={saving || !aiForm.name.trim() || !aiForm.base_url.trim()}>
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
              <LimitedInput className="finp" maxLength={200} type="text" placeholder="e.g. Weekly Digest" value={tplForm.name} onChange={(e) => setTplForm((f) => ({ ...f, name: e.target.value }))} autoFocus />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="ds-label" style={{ display: "block", marginBottom: 6 }}>Slug (unique ID)</label>
              <LimitedInput className="finp" maxLength={100} type="text" placeholder="e.g. weekly_digest" value={tplForm.slug} onChange={(e) => setTplForm((f) => ({ ...f, slug: e.target.value }))} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="ds-label" style={{ display: "block", marginBottom: 6 }}>Subject</label>
              <LimitedInput className="finp" maxLength={300} type="text" placeholder="e.g. Your weekly performance digest" value={tplForm.subject} onChange={(e) => setTplForm((f) => ({ ...f, subject: e.target.value }))} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="ds-label" style={{ display: "block", marginBottom: 6 }}>Body</label>
              <LimitedTextarea
                className="ftext"
                maxLength={10000}
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
              <LimitedInput className="finp" maxLength={500} type="text" placeholder='["user_name", "company_name", "scripts_count"]' value={tplForm.variables} onChange={(e) => setTplForm((f) => ({ ...f, variables: e.target.value }))} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="ds-label" style={{ display: "block", marginBottom: 6 }}>Description (optional)</label>
              <LimitedInput className="finp" maxLength={300} type="text" placeholder="Short note about when this template is used" value={tplForm.description} onChange={(e) => setTplForm((f) => ({ ...f, description: e.target.value }))} />
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
