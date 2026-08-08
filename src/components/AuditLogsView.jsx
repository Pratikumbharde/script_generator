import React, { useEffect, useState } from 'react'
import { listAuditLogs, listWorkspaceAuditLogs } from '../api/client.js'

export default function AuditLogsView() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('mine') // mine | workspace
  const [filter, setFilter] = useState('')
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  async function load(reset = false) {
    setLoading(true)
    try {
      const newOffset = reset ? 0 : offset
      const data = view === 'workspace'
        ? await listWorkspaceAuditLogs({ limit: 50, offset: newOffset })
        : await listAuditLogs({ limit: 50, offset: newOffset, action: filter || undefined })
      const rows = data || []
      setLogs(reset ? rows : [...logs, ...rows])
      setHasMore(rows.length === 50)
      if (reset) setOffset(0)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(true) }, [view, filter])

  function actionColor(action) {
    if (action.includes('create') || action.includes('add')) return '#22c55e'
    if (action.includes('delete') || action.includes('remove')) return '#ef4444'
    if (action.includes('update') || action.includes('edit')) return '#f59e0b'
    if (action.includes('login') || action.includes('export')) return '#3b82f6'
    return 'var(--faint)'
  }

  return (
    <div className="ps-container">
      <div className="ps-header">
        <h1>📋 Audit Logs</h1>
        <p className="ps-muted">Immutable record of every action in your workspace.</p>
      </div>

      <div className="ps-form-row" style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <select className="ps-select" value={view} onChange={(e) => setView(e.target.value)}>
          <option value="mine">My Activity</option>
          <option value="workspace">Workspace Activity</option>
        </select>
        <input className="ps-input" placeholder="Filter by action..." value={filter} onChange={(e) => setFilter(e.target.value)} style={{ maxWidth: 240 }} />
      </div>

      {loading && logs.length === 0 ? (
        <div className="ps-loading"><div className="ps-spinner" /> Loading audit logs...</div>
      ) : logs.length === 0 ? (
        <div className="ps-empty">No audit logs found.</div>
      ) : (
        <div className="ps-card">
          <table className="ps-table">
            <thead>
              <tr>
                <th>Time</th>
                {view === 'workspace' && <th>User</th>}
                <th>Action</th>
                <th>Entity</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{new Date(log.created_at).toLocaleString()}</td>
                  {view === 'workspace' && <td>{log.email || '-'}</td>}
                  <td>
                    <span style={{ fontWeight: 700, fontSize: 12, color: actionColor(log.action) }}>{log.action}</span>
                  </td>
                  <td>{log.entity_type ? `${log.entity_type}:${log.entity_id}` : '-'}</td>
                  <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {log.details || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button className="ps-btn ghost" onClick={() => { setOffset((o) => o + 50); load(); }} disabled={loading}>
                {loading ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
