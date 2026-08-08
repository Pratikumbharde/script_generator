import React, { useEffect, useState } from 'react'
import { getUsage, getWorkspaceUsage } from '../api/client.js'

export default function UsageDashboardView() {
  const [data, setData] = useState({ summary: [], daily: [] })
  const [workspaceData, setWorkspaceData] = useState({ members: [] })
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)
  const [view, setView] = useState('mine') // mine | workspace

  async function load() {
    setLoading(true)
    try {
      const res = await getUsage(days)
      setData(res || { summary: [], daily: [] })
      if (view === 'workspace') {
        const ws = await getWorkspaceUsage(days)
        setWorkspaceData(ws || { members: [] })
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [days, view])

  const totalCalls = data.summary.reduce((a, s) => a + s.calls, 0)
  const totalTokens = data.summary.reduce((a, s) => a + s.tokens, 0)
  const avgDuration = data.summary.length
    ? Math.round(data.summary.reduce((a, s) => a + s.avg_duration, 0) / data.summary.length)
    : 0

  function miniBar(values, max) {
    return (
      <div className="ps-flex" style={{ gap: 2, height: 32, alignItems: 'flex-end' }}>
        {values.map((v, i) => (
          <div key={i} title={`${v.day}: ${v.calls} calls`} style={{ flex: 1, background: 'var(--accent)', borderRadius: 2, height: `${max > 0 ? (v.calls / max) * 100 : 0}%`, minHeight: 2, opacity: 0.85 }} />
        ))}
      </div>
    )
  }

  const maxDaily = Math.max(...data.daily.map((d) => d.calls), 1)

  return (
    <div className="ps-container">
      <div className="ps-header">
        <h1>📊 Usage Dashboard</h1>
        <p className="ps-muted">Track your AI usage, tokens consumed, and performance.</p>
      </div>

      <div className="ps-form-row" style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <select className="ps-select" value={days} onChange={(e) => setDays(Number(e.target.value))}>
          {[7, 14, 30, 60, 90].map((d) => (
            <option key={d} value={d}>Last {d} days</option>
          ))}
        </select>
        <select className="ps-select" value={view} onChange={(e) => setView(e.target.value)}>
          <option value="mine">My Usage</option>
          <option value="workspace">Team Usage</option>
        </select>
      </div>

      <div className="ps-grid" style={{ marginBottom: 24 }}>
        <div className="ps-stat-card">
          <div className="ps-stat-value">{totalCalls}</div>
          <div className="ps-stat-label">Total API Calls</div>
        </div>
        <div className="ps-stat-card">
          <div className="ps-stat-value">{totalTokens.toLocaleString()}</div>
          <div className="ps-stat-label">Tokens Used</div>
        </div>
        <div className="ps-stat-card">
          <div className="ps-stat-value">{avgDuration}ms</div>
          <div className="ps-stat-label">Avg Response Time</div>
        </div>
      </div>

      {loading ? (
        <div className="ps-loading"><div className="ps-spinner" /> Loading usage...</div>
      ) : view === 'mine' ? (
        <div>
          <h3 className="ps-section-title">Daily Activity</h3>
          <div className="ps-card" style={{ marginBottom: 24 }}>
            {data.daily.length > 0 ? miniBar(data.daily, maxDaily) : <div className="ps-empty">No usage data for this period.</div>}
          </div>

          <h3 className="ps-section-title">By Action</h3>
          <div className="ps-card">
            <table className="ps-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th style={{ textAlign: 'right' }}>Calls</th>
                  <th style={{ textAlign: 'right' }}>Tokens</th>
                  <th style={{ textAlign: 'right' }}>Avg Duration</th>
                </tr>
              </thead>
              <tbody>
                {data.summary.map((s) => (
                  <tr key={s.action}>
                    <td><span className="ps-tag">{s.action}</span></td>
                    <td style={{ textAlign: 'right' }}>{s.calls}</td>
                    <td style={{ textAlign: 'right' }}>{s.tokens.toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>{Math.round(s.avg_duration)}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div>
          <h3 className="ps-section-title">Team Usage</h3>
          <div className="ps-card">
            {workspaceData.members.length === 0 ? (
              <div className="ps-empty">No team usage data yet.</div>
            ) : (
              <table className="ps-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th style={{ textAlign: 'right' }}>Calls</th>
                    <th style={{ textAlign: 'right' }}>Tokens</th>
                  </tr>
                </thead>
                <tbody>
                  {workspaceData.members.map((m) => (
                    <tr key={m.email}>
                      <td>{m.email}</td>
                      <td style={{ textAlign: 'right' }}>{m.calls}</td>
                      <td style={{ textAlign: 'right' }}>{m.tokens.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
