import React, { useState, useEffect } from "react";
import { listScheduledCalls, createScheduledCall, updateScheduledCall, deleteScheduledCall } from "../api/client.js";

const STATUSES = [
  { id: "scheduled", label: "Scheduled", color: "var(--accent-ink)" },
  { id: "completed", label: "Completed", color: "var(--ok)" },
  { id: "cancelled", label: "Cancelled", color: "var(--aggressive)" },
  { id: "no_show", label: "No show", color: "var(--instr)" },
];

function formatDate(ts) {
  if (!ts) return "";
  const d = new Date(Number(ts));
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(Number(ts));
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function isPast(ts) {
  return ts && Date.now() > Number(ts);
}

export default function ScheduledCallsView({ products }) {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    product_id: "",
    prospect_name: "",
    prospect_company: "",
    prospect_email: "",
    method: "consultative",
    call_type: "discovery",
    duration: 30,
    scheduled_at: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    notes: "",
  });

  useEffect(() => {
    loadCalls();
  }, []);

  async function loadCalls() {
    setLoading(true);
    try {
      const rows = await listScheduledCalls();
      setCalls(rows || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const resetForm = () => {
    setForm({
      product_id: "",
      prospect_name: "",
      prospect_company: "",
      prospect_email: "",
      method: "consultative",
      call_type: "discovery",
      duration: 30,
      scheduled_at: "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      notes: "",
    });
    setEditing(null);
  };

  const openNew = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (call) => {
    setEditing(call);
    setForm({
      product_id: call.product_id || "",
      prospect_name: call.prospect_name || "",
      prospect_company: call.prospect_company || "",
      prospect_email: call.prospect_email || "",
      method: call.method || "consultative",
      call_type: call.call_type || "discovery",
      duration: call.duration || 30,
      scheduled_at: call.scheduled_at ? new Date(Number(call.scheduled_at)).toISOString().slice(0, 16) : "",
      timezone: call.timezone || "UTC",
      notes: call.notes || "",
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.prospect_name.trim() || !form.scheduled_at) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        scheduled_at: new Date(form.scheduled_at).getTime(),
      };
      if (editing) {
        await updateScheduledCall(editing.id, payload);
      } else {
        await createScheduledCall(payload);
      }
      await loadCalls();
      setShowForm(false);
      resetForm();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this scheduled call?")) return;
    try {
      await deleteScheduledCall(id);
      await loadCalls();
    } catch (e) {
      console.error(e);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await updateScheduledCall(id, { status });
      await loadCalls();
    } catch (e) {
      console.error(e);
    }
  };

  const upcoming = calls.filter((c) => c.status === "scheduled" && !isPast(c.scheduled_at));
  const past = calls.filter((c) => c.status !== "scheduled" || isPast(c.scheduled_at));

  return (
    <div>
      <div className="ps-top">
        <div>
          <div className="ps-eyebrow">P5.3</div>
          <div className="ps-title">Call Schedule</div>
          <div className="ps-sub">Plan calls, track outcomes, and stay prepared.</div>
        </div>
        <button className="ps-btn pri" onClick={openNew}>+ Schedule call</button>
      </div>

      <div className="ps-body">
        {loading && (
          <div className="loading-box">
            <div className="ring" />
            <div className="msg">Loading schedule…</div>
          </div>
        )}

        {!loading && calls.length === 0 && (
          <div className="ps-empty">
            <div className="big">No calls scheduled</div>
            <p>Plan your next call to get a prep briefing and track outcomes.</p>
            <button className="ps-btn pri" onClick={openNew}>+ Schedule your first call</button>
          </div>
        )}

        {!loading && calls.length > 0 && (
          <>
            <div className="ai-section-h" style={{ marginBottom: 14 }}>📅 Upcoming ({upcoming.length})</div>
            {upcoming.length === 0 && <div className="ps-empty" style={{ padding: 24, marginBottom: 20 }}><div className="big" style={{ fontSize: 15 }}>No upcoming calls</div><p style={{ fontSize: 13 }}>You're all caught up.</p></div>}
            <div className="schedule-grid" style={{ marginBottom: 24 }}>
              {upcoming.map((c) => (
                <div key={c.id} className="schedule-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div className="schedule-time">{formatTime(c.scheduled_at)}</div>
                      <div className="schedule-date">{formatDate(c.scheduled_at)} · {c.timezone}</div>
                    </div>
                    <span className="schedule-status scheduled">Scheduled</span>
                  </div>
                  <div className="schedule-prospect">{c.prospect_name}{c.prospect_company && ` · ${c.prospect_company}`}</div>
                  {c.prospect_email && <div className="fhint" style={{ marginTop: 0 }}>📧 {c.prospect_email}</div>}
                  <div className="schedule-meta">
                    {c.product_name && <span className="chip n">{c.product_name}</span>}
                    {c.method && <span className="chip">{c.method}</span>}
                    {c.call_type && <span className="chip">{c.call_type}</span>}
                    {c.duration && <span className="chip">{c.duration} min</span>}
                  </div>
                  {c.notes && <div className="fhint" style={{ marginTop: 2 }}>📝 {c.notes}</div>}
                  <div className="schedule-actions">
                    <button className="ps-btn ghost sm" onClick={() => openEdit(c)}>Edit</button>
                    <button className="ps-btn ghost sm" onClick={() => updateStatus(c.id, "completed")}>✓ Complete</button>
                    <button className="ps-btn danger sm" onClick={() => remove(c.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="ai-section-h" style={{ marginBottom: 14 }}>🗓 Past & History ({past.length})</div>
            <div className="schedule-grid">
              {past.map((c) => (
                <div key={c.id} className={`schedule-card ${isPast(c.scheduled_at) && c.status === "scheduled" ? "past" : ""}`}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div className="schedule-time">{formatTime(c.scheduled_at)}</div>
                      <div className="schedule-date">{formatDate(c.scheduled_at)}</div>
                    </div>
                    <span className={`schedule-status ${c.status}`}>{STATUSES.find((s) => s.id === c.status)?.label || c.status}</span>
                  </div>
                  <div className="schedule-prospect">{c.prospect_name}{c.prospect_company && ` · ${c.prospect_company}`}</div>
                  <div className="schedule-meta">
                    {c.product_name && <span className="chip n">{c.product_name}</span>}
                    {c.method && <span className="chip">{c.method}</span>}
                    {c.call_type && <span className="chip">{c.call_type}</span>}
                  </div>
                  <div className="schedule-actions">
                    {c.status === "scheduled" && (
                      <>
                        <button className="ps-btn ghost sm" onClick={() => updateStatus(c.id, "completed")}>✓ Complete</button>
                        <button className="ps-btn ghost sm" onClick={() => updateStatus(c.id, "cancelled")}>✗ Cancel</button>
                        <button className="ps-btn ghost sm" onClick={() => updateStatus(c.id, "no_show")}>👻 No show</button>
                      </>
                    )}
                    <button className="ps-btn danger sm" onClick={() => remove(c.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Form overlay */}
        {showForm && (
          <div className="overlay" onClick={() => setShowForm(false)}>
            <div className="modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 18, marginBottom: 16 }}>{editing ? "Edit scheduled call" : "Schedule a call"}</div>
              <div className="schedule-form">
                <div className="frow">
                  <label className="flab">Product</label>
                  <select className="fsel" value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })}>
                    <option value="">Select…</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="frow">
                  <label className="flab">Prospect name *</label>
                  <input className="finp" value={form.prospect_name} onChange={(e) => setForm({ ...form, prospect_name: e.target.value })} placeholder="e.g. Rahul Sharma" />
                </div>
                <div className="frow">
                  <label className="flab">Company</label>
                  <input className="finp" value={form.prospect_company} onChange={(e) => setForm({ ...form, prospect_company: e.target.value })} placeholder="e.g. Acme Corp" />
                </div>
                <div className="frow">
                  <label className="flab">Email</label>
                  <input className="finp" value={form.prospect_email} onChange={(e) => setForm({ ...form, prospect_email: e.target.value })} placeholder="rahul@acme.com" />
                </div>
                <div className="frow">
                  <label className="flab">Date & time *</label>
                  <input className="finp" type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
                </div>
                <div className="frow">
                  <label className="flab">Duration (min)</label>
                  <input className="finp" type="number" min={5} max={120} value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} />
                </div>
                <div className="frow">
                  <label className="flab">Timezone</label>
                  <input className="finp" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
                </div>
                <div className="frow" style={{ gridColumn: "1 / -1" }}>
                  <label className="flab">Notes</label>
                  <textarea className="ftext" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Prep notes, agenda, or reminders…" style={{ minHeight: 60 }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
                <button className="ps-btn ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="ps-btn pri" disabled={!form.prospect_name.trim() || !form.scheduled_at || saving} onClick={save}>
                  {saving ? <><span className="spinner" /> Saving…</> : editing ? "Update" : "Schedule"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
