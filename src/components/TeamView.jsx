import React, { useState, useEffect } from "react";
import { S, slug } from "../utils/helpers.js";
import { LANGUAGES } from "../data/constants.js";
import {
  updateWorkspace, inviteMember, joinWorkspace,
  listApiKeys, createApiKey, deleteApiKey,
  listWebhooks, createWebhook, updateWebhook, deleteWebhook,
  listCrmConnections, createCrmConnection, deleteCrmConnection,
  getTeam, updateTeamRole, inviteTeamMember, assignScript, unassignScript, listScripts
} from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import {
  Users, Shield, UserPlus, Mail, ChevronDown, X, FileText, MoreHorizontal, Check
} from "lucide-react";
import LimitedInput from './shared/LimitedInput.jsx'
import LimitedTextarea from './shared/LimitedTextarea.jsx'

/* ============================================================
   TeamView — RBAC team management page
   Shows team members, roles, invite, and script assignment
   ============================================================ */

export default function TeamView({ company, staff, products, workspace, onSaveCompany, onRefresh, user, canGenerate }) {
  const { setWorkspace } = useAuth();
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteName, setInviteName] = useState("");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteMsg, setInviteMsg] = useState("");
  const [inviteErr, setInviteErr] = useState("");
  const [roleMenuOpen, setRoleMenuOpen] = useState(null);
  const [roleSaving, setRoleSaving] = useState(null);
  const [scripts, setScripts] = useState([]);
  const [assignMenuOpen, setAssignMenuOpen] = useState(null);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    loadMembers();
    loadScripts();
  }, []);

  const loadMembers = async () => {
    setMembersLoading(true);
    try {
      const m = await getTeam();
      setMembers(m);
    } catch (e) {
      // Fallback to workspace members
      setMembers(workspace?.members || []);
    } finally {
      setMembersLoading(false);
    }
  };

  const loadScripts = async () => {
    try {
      const s = await listScripts();
      setScripts(s);
    } catch (e) {
      setScripts([]);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviteBusy(true);
    setInviteMsg("");
    setInviteErr("");
    try {
      const data = await inviteTeamMember(inviteEmail.trim(), inviteRole, inviteName.trim() || undefined);
      setInviteMsg(data.message || "Invite sent successfully");
      setInviteEmail("");
      setInviteName("");
      setInviteRole("member");
      loadMembers();
    } catch (e) {
      setInviteErr(e.message || "Failed to send invite");
    } finally {
      setInviteBusy(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setRoleSaving(userId);
    try {
      await updateTeamRole(userId, newRole);
      setMembers((prev) => prev.map((m) => m.id === userId ? { ...m, role: newRole } : m));
      setRoleMenuOpen(null);
    } catch (e) {
      alert(e.message || "Failed to update role");
    } finally {
      setRoleSaving(null);
    }
  };

  const getScriptCountForMember = (memberId) => {
    // Count scripts assigned to this member from the workspace members data
    const member = members.find((m) => m.id === memberId);
    return member?.script_count || member?.assigned_scripts?.length || 0;
  };

  const coName = company;
  const [coNameEdit, setCoNameEdit] = useState(coName);
  const wsMembers = workspace?.members || [];
  const wsPending = workspace?.pending || [];
  const isOwner = workspace?.role === "owner" || workspace?.role === "admin";

  // Merge API members with workspace members for display
  const displayMembers = members.length > 0 ? members : wsMembers;

  const roleBadgeStyle = (role) => {
    if (role === "admin") return { background: "var(--accent)", color: "#fff" };
    if (role === "manager") return { background: "#2B4CF0", color: "#fff" };
    return { background: "var(--bg-soft)", color: "var(--muted)" };
  };

  return (
    <>
      <div className="ps-top">
        <div>
          <div className="ps-eyebrow">Team</div>
          <div className="ps-title"><Users size={22} style={{ marginRight: 8, verticalAlign: "-3px" }} />Team Management</div>
          <div className="ps-sub">Manage your team members, their roles, and script assignments.</div>
        </div>
        {isAdmin && !showInvite && (
          <button className="ps-btn pri" onClick={() => setShowInvite(true)}>
            <UserPlus size={16} /> Invite Member
          </button>
        )}
      </div>

      <div className="ps-body" style={{ maxWidth: 900 }}>
        {/* Invite modal */}
        {showInvite && (
          <div className="ps-card" style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Invite a Team Member</div>
              <button className="ps-btn ghost sm" onClick={() => { setShowInvite(false); setInviteMsg(""); setInviteErr(""); }}>
                <X size={14} />
              </button>
            </div>
            <div className="frow two" style={{ marginBottom: 12 }}>
              <div>
                <label className="flab">Email address<span className="req">*</span></label>
                <LimitedInput className="finp" maxLength={300} placeholder="teammate@company.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
              </div>
              <div>
                <label className="flab">Name (optional)</label>
                <LimitedInput className="finp" maxLength={200} placeholder="Full name" value={inviteName} onChange={(e) => setInviteName(e.target.value)} />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label className="flab">Role<span className="req">*</span></label>
              <select className="fsel" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                <option value="member">Member — Can view assigned scripts</option>
                <option value="manager">Manager — Can generate scripts & manage team</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="ps-btn pri" disabled={!inviteEmail.trim() || inviteBusy} onClick={handleInvite}>
                {inviteBusy ? "Sending…" : "Send Invite"}
              </button>
              <button className="ps-btn ghost" onClick={() => { setShowInvite(false); setInviteMsg(""); setInviteErr(""); }}>Cancel</button>
            </div>
            {inviteMsg && <div style={{ color: "var(--ok)", fontSize: 13, marginTop: 10 }}>{inviteMsg}</div>}
            {inviteErr && <div className="err" style={{ marginTop: 10 }}>{inviteErr}</div>}
          </div>
        )}

        {/* Members list */}
        <div className="ps-card" style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
            <Users size={18} style={{ verticalAlign: -3, marginRight: 6 }} />
            Team Members ({displayMembers.length})
          </div>

          {membersLoading ? (
            <div style={{ padding: 20, textAlign: "center", color: "var(--muted)" }}>
              <div className="ring" style={{ margin: "0 auto" }} />
              <div style={{ marginTop: 8 }}>Loading team…</div>
            </div>
          ) : displayMembers.length === 0 ? (
            <div className="ps-empty" style={{ padding: 30 }}>
              <div className="big">No team members yet</div>
              <p>Invite your first team member to get started.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 0 }}>
              {displayMembers.map((m) => {
                const memberId = m.id || m.email;
                const mRole = m.role || "member";
                const scriptCount = getScriptCountForMember(memberId);
                return (
                  <div key={memberId} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "12px 0",
                    borderBottom: "1px solid var(--line-soft)"
                  }}>
                    <div className="avatar" style={{ width: 36, height: 36, fontSize: 13, flexShrink: 0 }}>
                      {(m.name || m.email || "?").split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {m.name || m.email?.split("@")[0] || "Member"}
                      </div>
                      <div style={{ color: "var(--muted)", fontSize: 12 }}>
                        {m.email}
                        {scriptCount > 0 && <span> · {scriptCount} script{scriptCount !== 1 ? "s" : ""} assigned</span>}
                      </div>
                    </div>

                    {/* Role badge & dropdown */}
                    <div style={{ position: "relative" }}>
                      {isAdmin && mRole !== "owner" ? (
                        <>
                          <button
                            className="ps-btn ghost sm"
                            style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
                            onClick={() => setRoleMenuOpen(roleMenuOpen === memberId ? null : memberId)}
                          >
                            <span className="chip n" style={roleBadgeStyle(mRole)}>{mRole}</span>
                            {roleSaving === memberId ? <span className="spinner dark" /> : <ChevronDown size={12} />}
                          </button>
                          {roleMenuOpen === memberId && (
                            <div style={{
                              position: "absolute", right: 0, top: "100%", marginTop: 4,
                              background: "#fff", border: "1px solid var(--line-soft)", borderRadius: 8,
                              boxShadow: "0 8px 24px rgba(0,0,0,.12)", zIndex: 50, minWidth: 160
                            }}>
                              {["admin", "manager", "member"].map((r) => (
                                <button key={r} className="dt-dropdown-item" style={{ width: "100%", textAlign: "left" }}
                                  onClick={() => handleRoleChange(memberId, r)}>
                                  <span className="chip n" style={roleBadgeStyle(r)}>{r}</span>
                                  {mRole === r && <Check size={14} style={{ marginLeft: 8, color: "var(--ok)" }} />}
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="chip n" style={roleBadgeStyle(mRole)}>{mRole}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Workspace settings (existing) */}
        <div className="ps-card" style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>Workspace settings</div>
          <WorkspaceSettings workspace={workspace} />
        </div>

        {/* Integrations (existing) */}
        <div className="ps-card" style={{ marginBottom: 20 }}>
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

/* ---------- Workspace Settings sub-component (preserved from original) ---------- */
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
          <label className="flab">Workspace name<span className="req">*</span></label>
          <LimitedInput className="finp" maxLength={200} value={wsName} onChange={(e) => setWsName(e.target.value)} placeholder="e.g. Acme Sales" />
        </div>
        <button className="ps-btn pri" disabled={!wsName.trim() || wsName === workspace?.name} onClick={saveName}>Save</button>
      </div>

      {isOwner && (
        <>
          <div style={{ borderTop: "1px solid var(--line-soft)", paddingTop: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Invite teammates</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <LimitedInput className="finp" maxLength={300} placeholder="teammate@company.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
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
            <LimitedInput className="finp" maxLength={500} placeholder="Paste invite token here" value={joinToken} onChange={(e) => setJoinToken(e.target.value)} />
          </div>
          <button className="ps-btn ghost" disabled={!joinToken.trim()} onClick={acceptJoin}>Join</button>
        </div>
        {joinMsg && <div style={{ color: "var(--ok)", fontSize: 13, marginTop: 8 }}>{joinMsg}</div>}
        {joinErr && <div className="err" style={{ marginTop: 8 }}>{joinErr}</div>}
      </div>
    </>
  );
}

/* ---------- Integrations sub-component (preserved from original) ---------- */
function IntegrationsSettings() {
  const [keys, setKeys] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [whUrl, setWhUrl] = useState("");
  const [whEvents, setWhEvents] = useState("script.completed,script.used");
  const [whSecret, setWhSecret] = useState("");
  const [loading, setLoading] = useState(false);

  const [crms, setCrms] = useState([]);
  const [crmType, setCrmType] = useState("zapier");
  const [crmUrl, setCrmUrl] = useState("");
  const [crmToken, setCrmToken] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try { const k = await listApiKeys(); setKeys(k); } catch (_) {}
    try { const w = await listWebhooks(); setWebhooks(w); } catch (_) {}
    try { const c = await listCrmConnections(); setCrms(c); } catch (_) {}
  };

  const generateKey = async () => {
    setLoading(true);
    try {
      const data = await createApiKey(newKeyName || "My API Key");
      setNewKeyValue(data.key);
      setNewKeyName("");
      loadData();
    } catch (e) { console.error("Failed to create key:", e); }
    finally { setLoading(false); }
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
    } catch (e) { console.error("Failed to create webhook:", e); }
    finally { setLoading(false); }
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
    } catch (e) { console.error("Failed to connect CRM:", e); }
    finally { setLoading(false); }
  };

  const removeCrm = async (id) => {
    if (!confirm("Disconnect this CRM?")) return;
    await deleteCrmConnection(id);
    loadData();
  };

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>API Keys</div>
        <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 12 }}>Use these to generate scripts from your CRM, Zapier, or internal tools.</div>
        {keys.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            {keys.map((k) => (
              <div key={k.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, padding: "8px 0", borderBottom: "1px solid var(--line-soft)" }}>
                <span style={{ fontWeight: 600 }}>{k.name}</span>
                <span style={{ color: "var(--faint)", fontFamily: "monospace", fontSize: 12 }}>{k.scopes}</span>
                <span style={{ color: "var(--faint)", marginLeft: "auto" }}>{k.last_used_at ? `Used ${new Date(k.last_used_at).toLocaleDateString()}` : "Never used"}</span>
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
            <LimitedInput className="finp" maxLength={200} placeholder="Key name (e.g. Zapier)" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} />
          </div>
          <button className="ps-btn pri" disabled={loading} onClick={generateKey}>Generate key</button>
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--line-soft)", paddingTop: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Webhooks</div>
        <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 12 }}>Get notified when scripts are completed or used.</div>
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
            <LimitedInput className="finp" maxLength={500} placeholder="https://your-app.com/webhooks/pitch-studio" value={whUrl} onChange={(e) => setWhUrl(e.target.value)} />
          </div>
          <LimitedInput className="finp" maxLength={500} style={{ maxWidth: 180 }} placeholder="Events (comma-separated)" value={whEvents} onChange={(e) => setWhEvents(e.target.value)} />
          <LimitedInput className="finp" maxLength={200} style={{ maxWidth: 140 }} placeholder="Secret (optional)" value={whSecret} onChange={(e) => setWhSecret(e.target.value)} />
          <button className="ps-btn pri" disabled={loading || !whUrl.trim()} onClick={addWebhook}>Add webhook</button>
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--line-soft)", paddingTop: 16, marginTop: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>CRM Integration</div>
        <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 12 }}>Log script usage back to your CRM.</div>
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
            <LimitedInput className="finp" maxLength={500} placeholder="https://hooks.zapier.com/... or CRM webhook URL" value={crmUrl} onChange={(e) => setCrmUrl(e.target.value)} />
          </div>
          <LimitedInput className="finp" maxLength={500} style={{ maxWidth: 160 }} placeholder="API token (optional)" value={crmToken} onChange={(e) => setCrmToken(e.target.value)} />
          <button className="ps-btn pri" disabled={loading || !crmUrl.trim()} onClick={addCrm}>Connect</button>
        </div>
      </div>
    </>
  );
}