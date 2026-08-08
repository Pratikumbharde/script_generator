import React, { useEffect, useState } from 'react'
import { getWorkspacePermissions, getAllWorkspacePermissions, updateWorkspacePermission } from '../api/client.js'

const ROLE_LABELS = {
  owner: '👑 Owner',
  admin: '🔧 Admin',
  editor: '✏️ Editor',
  viewer: '👁 Viewer',
}

const PERM_LABELS = {
  can_generate_scripts: 'Generate scripts',
  can_edit_products: 'Edit products',
  can_delete_scripts: 'Delete scripts',
  can_view_analytics: 'View analytics',
  can_manage_team: 'Manage team',
  can_override_prompts: 'Override AI prompts',
  can_export_data: 'Export data',
}

export default function PermissionsView() {
  const [myPerms, setMyPerms] = useState(null)
  const [allPerms, setAllPerms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    try {
      const mine = await getWorkspacePermissions()
      setMyPerms(mine)
      if (mine.role === 'owner' || mine.role === 'admin') {
        const all = await getAllWorkspacePermissions()
        setAllPerms(all || [])
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function togglePerm(role, key) {
    const row = allPerms.find((p) => p.role === role)
    if (!row) return
    const updated = { ...row, [key]: row[key] ? 0 : 1 }
    await updateWorkspacePermission(role, updated)
    await load()
  }

  if (loading) return <div className="ps-loading"><div className="ps-spinner" /> Loading permissions...</div>

  return (
    <div className="ps-container">
      <div className="ps-header">
        <h1>🔐 Workspace Permissions</h1>
        <p className="ps-muted">Control who can do what in your workspace.</p>
      </div>

      {error && <div className="ps-error">{error}</div>}

      {myPerms && (
        <div className="ps-card" style={{ marginBottom: 24 }}>
          <div className="ps-flex-between">
            <div>
              <strong>Your role:</strong> <span className="ps-tag ps-tag-accent">{ROLE_LABELS[myPerms.role]}</span>
            </div>
            <div className="ps-muted" style={{ fontSize: 12 }}>Only owners and admins can edit permissions.</div>
          </div>
          <div className="ps-grid" style={{ marginTop: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
            {Object.entries(PERM_LABELS).map(([key, label]) => (
              <div key={key} className="ps-flex-between" style={{ fontSize: 13 }}>
                <span>{label}</span>
                <span style={{ color: myPerms.permissions[key] ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                  {myPerms.permissions[key] ? '✓' : '✕'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {myPerms?.role === 'owner' || myPerms?.role === 'admin' ? (
        <div>
          <h2 className="ps-section-title">Edit Permissions</h2>
          <div className="ps-card">
            <table className="ps-table">
              <thead>
                <tr>
                  <th>Role</th>
                  {Object.values(PERM_LABELS).map((l) => <th key={l}>{l}</th>)}
                </tr>
              </thead>
              <tbody>
                {['owner','admin','editor','viewer'].map((role) => {
                  const row = allPerms.find((p) => p.role === role)
                  return (
                    <tr key={role}>
                      <td><strong>{ROLE_LABELS[role]}</strong></td>
                      {Object.keys(PERM_LABELS).map((key) => (
                        <td key={key}>
                          <input
                            type="checkbox"
                            checked={row ? !!row[key] : true}
                            onChange={() => togglePerm(role, key)}
                            disabled={role === 'owner'}
                          />
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="ps-muted" style={{ fontSize: 12, marginTop: 8 }}>Owner permissions are locked (always full access).</div>
          </div>
        </div>
      ) : (
        <div className="ps-empty">You don't have permission to manage workspace permissions.</div>
      )}
    </div>
  )
}
