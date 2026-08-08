import React, { useState, useEffect } from "react";
import { S, slug } from "../utils/helpers.js";
import { LANGUAGES } from "../data/constants.js";
import { updateWorkspace, inviteMember, joinWorkspace, listApiKeys, createApiKey, deleteApiKey, listWebhooks, createWebhook, updateWebhook, deleteWebhook, listCrmConnections, createCrmConnection, deleteCrmConnection } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function TeamView({ company, staff, products, workspace, onSaveCompany, onRefresh }) {
  const [coName, setCoName] = useState(company);
  const [adding, setAdding] = useState(false);
  const [nf, setNf] = useState({ name: "", role: "Sales Rep", access: [], languages: ["en"] });

  const addStaff = async () => {
    const id = slug(nf.name) + "-" + Math.random().toString(36).slice(2, 5);
    await S.set(`pstaff:${id}`, { ...nf, id });
    setNf({ name: "", role: "Sales Rep", access: [], languages: ["en"] }); setAdding(false); onRefresh();
  };
  const removeStaff = async (id) => { await S.del(`pstaff:${id}`); onRefresh(); };
  const toggleAccess = (pid) => setNf((f) => ({ ...f, access: f.access.includes(pid) ? f.access.filter((x) => x !== pid) : [...f.access, pid] }));
  const toggleLang = (lid) => setNf((f) => ({ ...f, languages: f.languages.includes(lid) ? f.languages.filter((x) => x !== lid) : [...f.languages, lid] }));

  return (
    <>
      <div className="ps-top">
        <div>
          <div className="ps-eyebrow">Workspace</div>
          <div className="ps-title">Team</div>
          <div className="ps-sub">Each rep's spoken languages drive which scripts get generated for them. Add a language here and it becomes available across the workspace.</div>
        </div>
        {!adding && <button className="ps-btn pri" onClick={() => setAdding(true)}>＋ Add teammate</button>}
      </div>
      <div className="ps-body" style={{ maxWidth: 720 }}>
        <div className="ps-card" style={{ marginBottom: 20, display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label className="flab">Company name</label>
            <input className="finp" value={coName} onChange={(e) => setCoName(e.target.value)} placeholder="Your company" />
          </div>
          <button className="ps-btn ghost" disabled={!coName.trim() || coName === company} onClick={() => onSaveCompany(coName.trim())}>Save</button>
        </div>

        {adding && (
          <div className="ps-form" style={{ marginBottom: 20, maxWidth: "none" }}>
            <div className="frow two">
              <div><label className="flab">Name</label><input className="finp" value={nf.name} onChange={(e) => setNf({ ...nf, name: e.target.value })} placeholder="Full name" /></div>
              <div><label className="flab">Role</label>
                <select className="fsel" value={nf.role} onChange={(e) => setNf({ ...nf, role: e.target.value })}>
                  <option>Sales Rep</option><option>SDR</option><option>Account Executive</option><option>Sales Manager</option><option>Admin</option>
                </select>
              </div>
            </div>
            <div className="frow">
              <label className="flab">Languages spoken <span className="opt">(pick all)</span></label>
              <div className="pill-row">
                {LANGUAGES.map((l) => (
                  <div key={l.id} className={`pill ${nf.languages.includes(l.id) ? "on" : ""}`} onClick={() => toggleLang(l.id)}>{l.name}</div>
                ))}
              </div>
              <div className="fhint">Scripts can be generated in each of these when this rep is on the team.</div>
            </div>
            <div className="frow">
              <label className="flab">Product access</label>
              {products.length === 0 ? <div className="fhint">Add products first to scope access.</div> : (
                <div className="pill-row">
                  {products.map((p) => (
                    <div key={p.id} className={`pill ${nf.access.includes(p.id) ? "on" : ""}`} onClick={() => toggleAccess(p.id)}>{p.name}</div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="ps-btn pri" disabled={!nf.name.trim() || nf.languages.length === 0} onClick={addStaff}>Add teammate</button>
              <button className="ps-btn ghost" onClick={() => setAdding(false)}>Cancel</button>
            </div>
          </div>
        )}

        {staff.length === 0 && !adding ? (
          <div className="ps-empty"><div className="big">No teammates yet</div><p>Add the reps on your team, mark which languages they speak, and choose which products each one can pull scripts for.</p><button className="ps-btn pri" onClick={() => setAdding(true)}>＋ Add teammate</button></div>
        ) : (
          staff.map((s) => (
            <div key={s.id} className="staff">
              <div className="avatar">{s.name.split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase()}</div>
              <div className="info">
                <div className="nm">{s.name}</div>
                <div className="rl">{s.role}</div>
                <div className="acc">
                  🗣 {(s.languages || ["en"]).map((id) => (LANGUAGES.find((l) => l.id === id) || {}).name).filter(Boolean).join(", ") || "English"}
                  {" · "}
                  {s.access?.length ? `Products: ${s.access.map((id) => products.find((p) => p.id === id)?.name).filter(Boolean).join(", ")}` : "No products assigned"}
                </div>
              </div>
              <button className="ps-btn danger sm" onClick={() => removeStaff(s.id)}>Remove</button>
            </div>
          ))
        )}

        {/* P1.3: Workspace management */}
        <div className="ps-card" style={{ marginTop: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>Workspace settings</div>

          <WorkspaceSettings workspace={workspace} />
        </div>

        {/* P1.4: Integrations */}
        <div className="ps-card" style={{ marginTop: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>Integrations</div>
          <IntegrationsSettings />
        </div>

        <div style={{ marginTop: 22, fontSize: 12.5, color: "var(--faint)", lineHeight: 1.55, borderTop: "1px solid var(--line-soft)", paddingTop: 16 }}>
          Note: this prototype stores everything in your browser workspace so you can try the full flow. A production SaaS would move accounts, staff logins, roles, and billing to a secure backend — the structure here mirrors how that would be organized.
        </div>
      </div>
    </>
  );
}

function WorkspaceSettings({ workspace }) {
  const { setWorkspace } = useAuth();
  const [wsName, setWsName] = useState(workspace?.name || "");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteMsg, setInviteMsg] = useState("");
  const [inviteErr, setInviteErr] = useState("");
  const [joinToken, setJoinToken] = useState("");
  const [joinMsg, setJoinMsg] = useState("");
  const [joinErr, setJoinErr] = useState("");

  useEffect(() => {
    if (workspace?.name) setWsName(workspace.name);
  }, [workspace?.name]);

  const saveName = async () => {
    await updateWorkspace(wsName.trim());
    setWorkspace({ ...workspace, name: wsName.trim() });
  };

  const sendInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviteBusy(true); setInviteMsg(""); setInviteErr("");
    try {
      const data = await inviteMember(inviteEmail.trim(), inviteRole);
      setInviteMsg(data.message || "Invite sent");
      setInviteEmail("");
    } catch (e) {
      setInviteErr(e.message || "Failed to send invite");
    } finally {
      setInviteBusy(false);
    }
  };

  const acceptJoin = async () => {
    if (!joinToken.trim()) return;
    setJoinMsg(""); setJoinErr("");
    try {
      await joinWorkspace(joinToken.trim());
      setJoinMsg("Joined workspace successfully! Refresh to see changes.");
      setJoinToken("");
    } catch (e) {
      setJoinErr(e.message || "Invalid or expired token");
    }
  };

  const isOwner = workspace?.role === 'owner' || workspace?.role === 'admin';
  const members = workspace?.members || [];
  const pending = workspace?.pending || [];

  return (
    <>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 18 }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label className="flab">Workspace name</label>
          <input className="finp" value={wsName} onChange={(e) => setWsName(e.target.value)} placeholder="e.g. Acme Sales" />
        </div>
        <button className="ps-btn pri" disabled={!wsName.trim() || wsName === workspace?.name} onClick={saveName}>Save</button>
      </div>

      {isOwner && (
    <>
          <div style={{ borderTop: "1px solid var(--line-soft)", paddingTop: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Invite teammates</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <input className="finp" placeholder="teammate@company.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
              </div>
              <select className="fsel" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} style={{ maxWidth: 140 }}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <button className="ps-btn pri" disabled={!inviteEmail.trim() || inviteBusy} onClick={sendInvite}>{inviteBusy ? "Sending…" : "Send invite"}</button>
            </div>
            {inviteMsg && <div style={{ color: "var(--ok)", fontSize: 13, marginTop: 8 }}>{inviteMsg}</div>}
            {inviteErr && <div className="err" style={{ marginTop: 8 }}>{inviteErr}</div>}
          </div>

          {pending.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: "var(--muted)" }}>Pending invites</div>
              {pending.map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13, padding: "6px 0", borderBottom: "1px solid var(--line-soft)" }}>
                  <span>{p.invited_email}</span>
                  <span className="chip n">{p.role}</span>
                  <span style={{ color: "var(--faint)", marginLeft: "auto" }}>{new Date(p.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div style={{ borderTop: "1px solid var(--line-soft)", paddingTop: 16, marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Members ({members.length})</div>
        {members.length === 0 ? (
          <div style={{ color: "var(--faint)", fontSize: 13 }}>No members yet.</div>
        ) : (
          members.map((m) => (
            <div key={m.id || m.email} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13, padding: "8px 0", borderBottom: "1px solid var(--line-soft)" }}>
              <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{m.email?.[0]?.toUpperCase() || "?"}</div>
              <span>{m.email}</span>
              <span className={`chip n ${m.role === 'owner' ? 'pri' : ''}`} style={m.role === 'owner' ? { background: 'var(--accent)', color: '#fff' } : {}}>{m.role}</span>
            </div>
          ))
        )}
      </div>

      <div style={{ borderTop: "1px solid var(--line-soft)", paddingTop: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Join a workspace</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <input className="finp" placeholder="Paste invite token here" value={joinToken} onChange={(e) => setJoinToken(e.target.value)} />
          </div>
          <button className="ps-btn ghost" disabled={!joinToken.trim()} onClick={acceptJoin}>Join</button>
        </div>
        {joinMsg && <div style={{ color: "var(--ok)", fontSize: 13, marginTop: 8 }}>{joinMsg}</div>}
        {joinErr && <div className="err" style={{ marginTop: 8 }}>{joinErr}</div>}
      </div>
    </>
  );
}

function IntegrationsSettings() {
  const [keys, setKeys] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [whUrl, setWhUrl] = useState("");
  const [whEvents, setWhEvents] = useState("script.completed,script.used");
  const [whSecret, setWhSecret] = useState("");
  const [loading, setLoading] = useState(false);

  // P3.1: CRM
  const [crms, setCrms] = useState([]);
  const [crmType, setCrmType] = useState("zapier");
  const [crmUrl, setCrmUrl] = useState("");
  const [crmToken, setCrmToken] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const k = await listApiKeys();
      setKeys(k);
    } catch (_) {}
    try {
      const w = await listWebhooks();
      setWebhooks(w);
    } catch (_) {}
    try {
      const c = await listCrmConnections();
      setCrms(c);
    } catch (_) {}
  };

  const generateKey = async () => {
    setLoading(true);
    try {
      const data = await createApiKey(newKeyName || "My API Key");
      setNewKeyValue(data.key);
      setNewKeyName("");
      loadData();
    } catch (e) {
      console.error("Failed to create key:", e);
    } finally {
      setLoading(false);
    }
  };

  const removeKey = async (id) => {
    if (!confirm("Revoke this API key? Any integrations using it will break.")) return;
    await deleteApiKey(id);
    loadData();
  };

  const addWebhook = async () => {
    if (!whUrl.trim()) return;
    setLoading(true);
    try {
      await createWebhook({ url: whUrl.trim(), events: whEvents, secret: whSecret || undefined });
      setWhUrl(""); setWhEvents("script.completed,script.used"); setWhSecret("");
      loadData();
    } catch (e) {
      console.error("Failed to create webhook:", e);
    } finally {
      setLoading(false);
    }
  };

  const toggleWebhook = async (wh) => {
    await updateWebhook(wh.id, { active: !wh.active });
    loadData();
  };

  const removeWebhook = async (id) => {
    if (!confirm("Delete this webhook?")) return;
    await deleteWebhook(id);
    loadData();
  };

  const addCrm = async () => {
    if (!crmUrl.trim()) return;
    setLoading(true);
    try {
      await createCrmConnection({ crm_type: crmType, webhook_url: crmUrl.trim(), api_token: crmToken || undefined });
      setCrmUrl(""); setCrmToken(""); setCrmType("zapier");
      loadData();
    } catch (e) {
      console.error("Failed to connect CRM:", e);
    } finally {
      setLoading(false);
    }
  };

  const removeCrm = async (id) => {
    if (!confirm("Disconnect this CRM?")) return;
    await deleteCrmConnection(id);
    loadData();
  };

  return (
    <>
      {/* API Keys */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>API Keys</div>
        <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 12 }}>
          Use these to generate scripts from your CRM, Zapier, or internal tools.
        </div>

        {keys.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            {keys.map((k) => (
              <div key={k.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, padding: "8px 0", borderBottom: "1px solid var(--line-soft)" }}>
                <span style={{ fontWeight: 600 }}>{k.name}</span>
                <span style={{ color: "var(--faint)", fontFamily: "monospace", fontSize: 12 }}>{k.scopes}</span>
                <span style={{ color: "var(--faint)", marginLeft: "auto" }}>
                  {k.last_used_at ? `Used ${new Date(k.last_used_at).toLocaleDateString()}` : "Never used"}
                </span>
                <button className="ps-btn danger sm" onClick={() => removeKey(k.id)}>Revoke</button>
              </div>
            ))}
          </div>
        )}

        {newKeyValue && (
          <div className="err" style={{ background: "#E8F6EF", borderColor: "#12A374", color: "#0B7A5B", marginBottom: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Key created — copy it now:</div>
            <code style={{ fontSize: 13, wordBreak: "break-all" }}>{newKeyValue}</code>
            <div style={{ fontSize: 12, marginTop: 6 }}>This is the only time it is shown.</div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <input className="finp" placeholder="Key name (e.g. Zapier)" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} />
          </div>
          <button className="ps-btn pri" disabled={loading} onClick={generateKey}>Generate key</button>
        </div>
      </div>

      {/* Webhooks */}
      <div style={{ borderTop: "1px solid var(--line-soft)", paddingTop: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Webhooks</div>
        <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 12 }}>
          Get notified when scripts are completed or used.
        </div>

        {webhooks.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            {webhooks.map((wh) => (
              <div key={wh.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, padding: "8px 0", borderBottom: "1px solid var(--line-soft)" }}>
                <span style={{ fontWeight: 600 }}>{wh.url}</span>
                <span className="chip n">{wh.events}</span>
                <span className={`chip n ${wh.active ? 'pri' : ''}`} style={wh.active ? { background: 'var(--accent)', color: '#fff' } : {}}>{wh.active ? "Active" : "Paused"}</span>
                <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                  <button className="ps-btn ghost sm" onClick={() => toggleWebhook(wh)}>{wh.active ? "Pause" : "Resume"}</button>
                  <button className="ps-btn danger sm" onClick={() => removeWebhook(wh.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <input className="finp" placeholder="https://your-app.com/webhooks/pitch-studio" value={whUrl} onChange={(e) => setWhUrl(e.target.value)} />
          </div>
          <input className="finp" style={{ maxWidth: 180 }} placeholder="Events (comma-separated)" value={whEvents} onChange={(e) => setWhEvents(e.target.value)} />
          <input className="finp" style={{ maxWidth: 140 }} placeholder="Secret (optional)" value={whSecret} onChange={(e) => setWhSecret(e.target.value)} />
          <button className="ps-btn pri" disabled={loading || !whUrl.trim()} onClick={addWebhook}>Add webhook</button>
        </div>
      </div>

      {/* P3.1: CRM Integration */}
      <div style={{ borderTop: "1px solid var(--line-soft)", paddingTop: 16, marginTop: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>CRM Integration</div>
        <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 12 }}>
          Log script usage back to your CRM. Works with Zapier, Make, or direct CRM webhooks.
        </div>

        {crms.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            {crms.map((c) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, padding: "8px 0", borderBottom: "1px solid var(--line-soft)" }}>
                <span style={{ fontWeight: 600, textTransform: "uppercase" }}>{c.crm_type}</span>
                <span style={{ color: "var(--faint)", wordBreak: "break-all" }}>{c.webhook_url}</span>
                <span className={`chip n ${c.active ? 'pri' : ''}`} style={c.active ? { background: 'var(--accent)', color: '#fff' } : {}}>{c.active ? "Active" : "Paused"}</span>
                <button className="ps-btn danger sm" style={{ marginLeft: "auto" }} onClick={() => removeCrm(c.id)}>Disconnect</button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <select className="fsel" value={crmType} onChange={(e) => setCrmType(e.target.value)} style={{ maxWidth: 160 }}>
            <option value="salesforce">Salesforce</option>
            <option value="hubspot">HubSpot</option>
            <option value="pipedrive">Pipedrive</option>
            <option value="zapier">Zapier</option>
            <option value="custom">Custom webhook</option>
          </select>
          <div style={{ flex: 1, minWidth: 200 }}>
            <input className="finp" placeholder="https://hooks.zapier.com/... or CRM webhook URL" value={crmUrl} onChange={(e) => setCrmUrl(e.target.value)} />
          </div>
          <input className="finp" style={{ maxWidth: 160 }} placeholder="API token (optional)" value={crmToken} onChange={(e) => setCrmToken(e.target.value)} />
          <button className="ps-btn pri" disabled={loading || !crmUrl.trim()} onClick={addCrm}>Connect</button>
        </div>
      </div>
    </>
  );
}
