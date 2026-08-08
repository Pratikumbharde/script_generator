import React, { useEffect, useState } from 'react'
import { getOrganization, createOrganization, updateOrganization } from '../api/client.js'

export default function OrganizationView() {
  const [org, setOrg] = useState(null)
  const [workspaces, setWorkspaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', billing_tier: 'free' })

  async function load() {
    setLoading(true)
    try {
      const data = await getOrganization()
      setOrg(data.organization)
      setWorkspaces(data.workspaces || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleCreate() {
    if (!form.name.trim()) return
    try {
      await createOrganization({ name: form.name, billing_tier: form.billing_tier })
      setCreating(false)
      setForm({ name: '', billing_tier: 'free' })
      await load()
    } catch (e) {
      alert(e.message)
    }
  }

  async function handleUpdate() {
    if (!form.name.trim()) return
    try {
      await updateOrganization({ name: form.name, billing_tier: form.billing_tier })
      await load()
    } catch (e) {
      alert(e.message)
    }
  }

  const tiers = ['free', 'starter', 'pro', 'enterprise']

  return (
    <div className="ps-container">
      <div className="ps-header">
        <h1>🏢 Organization & Multi-Workspace</h1>
        <p className="ps-muted">Manage your organization, billing tier, and cross-workspace visibility.</p>
      </div>

      {loading ? (
        <div className="ps-loading"><div className="ps-spinner" /> Loading...</div>
      ) : !org ? (
        <div className="ps-card" style={{ marginBottom: 24 }}>
          <h3 className="ps-section-title">Create Organization</h3>
          <div className="ps-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <input className="ps-input" placeholder="Organization name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <select className="ps-select" value={form.billing_tier} onChange={(e) => setForm({ ...form, billing_tier: e.target.value })}>
              {tiers.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <button className="ps-btn" onClick={handleCreate} disabled={!form.name.trim()}>🏢 Create Organization</button>
        </div>
      ) : (
        <div>
          <div className="ps-card" style={{ marginBottom: 24 }}>
            <div className="ps-flex-between">
              <div>
                <h2>{org.name}</h2>
                <span className="ps-tag ps-tag-accent">{org.billing_tier.toUpperCase()}</span>
              </div>
              <button className="ps-btn ghost" onClick={() => { setCreating(true); setForm({ name: org.name, billing_tier: org.billing_tier }) }}>✏️ Edit</button>
            </div>
          </div>

          {creating && (
            <div className="ps-card" style={{ marginBottom: 24 }}>
              <h3 className="ps-section-title">Edit Organization</h3>
              <div className="ps-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <input className="ps-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <select className="ps-select" value={form.billing_tier} onChange={(e) => setForm({ ...form, billing_tier: e.target.value })}>
                  {tiers.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div className="ps-flex" style={{ gap: 8 }}>
                <button className="ps-btn" onClick={handleUpdate}>Save</button>
                <button className="ps-btn ghost" onClick={() => setCreating(false)}>Cancel</button>
              </div>
            </div>
          )}

          <h2 className="ps-section-title">Workspaces ({workspaces.length})</h2>
          {workspaces.length === 0 ? (
            <div className="ps-empty">No workspaces found.</div>
          ) : (
            <div className="ps-grid">
              {workspaces.map((ws) => (
                <div key={ws.id} className="ps-card">
                  <div className="ps-flex-between">
                    <strong>{ws.name}</strong>
                    <span className="ps-tag">{ws.member_count} members</span>
                  </div>
                  <div className="ps-muted" style={{ fontSize: 12, marginTop: 4 }}>Created {new Date(ws.created_at).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
