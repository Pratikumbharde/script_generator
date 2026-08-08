import React, { useEffect, useState } from 'react'
import { listCrmOAuthConnections, saveCrmOAuthConnection, deleteCrmOAuthConnection } from '../api/client.js'

export default function CrmOAuthView() {
  const [salesforce, setSalesforce] = useState([])
  const [hubspot, setHubspot] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ crm_type: 'salesforce', access_token: '', refresh_token: '', instance_url: '' })

  async function load() {
    setLoading(true)
    try {
      const sf = await listCrmOAuthConnections('salesforce')
      const hs = await listCrmOAuthConnections('hubspot')
      setSalesforce(sf || [])
      setHubspot(hs || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleSave() {
    if (!form.access_token.trim()) return
    await saveCrmOAuthConnection({
      crm_type: form.crm_type,
      access_token: form.access_token,
      refresh_token: form.refresh_token,
      instance_url: form.instance_url,
    })
    setForm({ crm_type: 'salesforce', access_token: '', refresh_token: '', instance_url: '' })
    await load()
  }

  async function handleDelete(id) {
    if (!confirm('Remove this CRM connection?')) return
    await deleteCrmOAuthConnection(id)
    await load()
  }

  function renderConnections(rows, type) {
    if (rows.length === 0) return <div className="ps-muted">No {type} connections yet.</div>
    return rows.map((conn) => (
      <div key={conn.id} className="ps-card" style={{ padding: 12, marginBottom: 8 }}>
        <div className="ps-flex-between">
          <div>
            <strong>{conn.instance_url || type}</strong>
            <div className="ps-muted" style={{ fontSize: 12 }}>
              Expires: {conn.expires_at ? new Date(conn.expires_at).toLocaleDateString() : 'N/A'} • {conn.active ? 'Active' : 'Inactive'}
            </div>
          </div>
          <button className="ps-btn-ghost" onClick={() => handleDelete(conn.id)}>🗑</button>
        </div>
      </div>
    ))
  }

  return (
    <div className="ps-container">
      <div className="ps-header">
        <h1>🔗 CRM Native Integrations</h1>
        <p className="ps-muted">Connect Salesforce or HubSpot for bidirectional sync. (Token-based for demo; OAuth can be wired in production.)</p>
      </div>

      <div className="ps-card" style={{ marginBottom: 24 }}>
        <h3 className="ps-section-title">Add Connection</h3>
        <div className="ps-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
          <select className="ps-select" value={form.crm_type} onChange={(e) => setForm({ ...form, crm_type: e.target.value })}>
            <option value="salesforce">Salesforce</option>
            <option value="hubspot">HubSpot</option>
          </select>
          <input className="ps-input" placeholder="Access token" value={form.access_token} onChange={(e) => setForm({ ...form, access_token: e.target.value })} />
          <input className="ps-input" placeholder="Instance URL (optional)" value={form.instance_url} onChange={(e) => setForm({ ...form, instance_url: e.target.value })} />
        </div>
        <input className="ps-input" placeholder="Refresh token (optional)" value={form.refresh_token} onChange={(e) => setForm({ ...form, refresh_token: e.target.value })} style={{ marginBottom: 12 }} />
        <button className="ps-btn" onClick={handleSave} disabled={!form.access_token.trim()}>💾 Save Connection</button>
      </div>

      {loading ? (
        <div className="ps-loading"><div className="ps-spinner" /> Loading connections...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <h3 className="ps-section-title">Salesforce</h3>
            {renderConnections(salesforce, 'Salesforce')}
          </div>
          <div>
            <h3 className="ps-section-title">HubSpot</h3>
            {renderConnections(hubspot, 'HubSpot')}
          </div>
        </div>
      )}
    </div>
  )
}
