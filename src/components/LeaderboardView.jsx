import React, { useEffect, useState } from 'react'
import { Trophy } from 'lucide-react'
import { getLeaderboard, getRepTrends } from '../api/client.js'

export default function LeaderboardView() {
  const [data, setData] = useState({ members: [], benchmark: {} })
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('')
  const [selectedRep, setSelectedRep] = useState(null)
  const [trends, setTrends] = useState([])

  async function load() {
    setLoading(true)
    try {
      const res = await getLeaderboard(period || undefined)
      setData(res || { members: [], benchmark: {} })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [period])

  async function openTrends(member) {
    setSelectedRep(member)
    try {
      const res = await getRepTrends(member.id)
      setTrends(res || [])
    } catch (e) {
      setTrends([])
    }
  }

  const { members, benchmark } = data

  function sparkline(values, color = 'var(--accent)') {
    if (values.length < 2) return null
    const max = Math.max(...values, 1)
    const points = values.map((v, i) => `${(i / (values.length - 1)) * 60},${50 - (v / max) * 40}`).join(' ')
    return (
      <svg width={64} height={32} viewBox="0 0 60 50">
        <polyline fill="none" stroke={color} strokeWidth={2} points={points} />
      </svg>
    )
  }

  return (
    <div className="ps-container">
      <div className="ps-header">
        <h1><Trophy size={24} style={{ marginRight: 10, verticalAlign: "-4px" }} />Team Leaderboard</h1>
        <p className="ps-muted">Compare rep performance, benchmark vs team average, and spot trends.</p>
      </div>

      <div className="ps-form-row" style={{ marginBottom: 16 }}>
        <select className="ps-select" value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="">All time</option>
          {Array.from({ length: 6 }, (_, i) => {
            const d = new Date()
            d.setMonth(d.getMonth() - i)
            const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            return <option key={val} value={val}>{val}</option>
          })}
        </select>
      </div>

      {Object.keys(benchmark).length > 0 && (
        <div className="ps-grid" style={{ marginBottom: 24 }}>
          {[
            { label: 'Avg Scripts', value: benchmark.avg_scripts || 0 },
            { label: 'Avg Calls', value: benchmark.avg_calls || 0 },
            { label: 'Avg Wins', value: benchmark.avg_wins || 0 },
            { label: 'Avg Rating', value: benchmark.avg_rating || 0 },
          ].map((stat) => (
            <div key={stat.label} className="ps-stat-card">
              <div className="ps-stat-value">{stat.value}</div>
              <div className="ps-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="ps-loading"><div className="ps-spinner" /> Loading leaderboard...</div>
      ) : members.length === 0 ? (
        <div className="ps-empty">No team data yet. Invite team members and start generating scripts.</div>
      ) : (
        <div className="ps-card">
          <table className="ps-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Rep</th>
                <th style={{ textAlign: 'right' }}>Scripts</th>
                <th style={{ textAlign: 'right' }}>Calls</th>
                <th style={{ textAlign: 'right' }}>Wins</th>
                <th style={{ textAlign: 'right' }}>Win Rate</th>
                <th style={{ textAlign: 'right' }}>Rating</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m, i) => {
                const rate = m.scripts_used > 0 ? Math.round((m.wins / m.scripts_used) * 100) : 0
                return (
                  <tr key={m.id} style={{ cursor: 'pointer' }} onClick={() => openTrends(m)}>
                    <td><strong>#{i + 1}</strong></td>
                    <td>{m.email}</td>
                    <td style={{ textAlign: 'right' }}>{m.scripts_generated || 0}</td>
                    <td style={{ textAlign: 'right' }}>{m.scripts_used || 0}</td>
                    <td style={{ textAlign: 'right', color: '#22c55e', fontWeight: 700 }}>{m.wins || 0}</td>
                    <td style={{ textAlign: 'right' }}>{rate}%</td>
                    <td style={{ textAlign: 'right' }}>{m.avg_rating || '-'}</td>
                    <td>{sparkline([m.scripts_generated, m.scripts_used, m.wins, m.calls_completed || 0])}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedRep && (
        <div className="ps-overlay" onClick={() => setSelectedRep(null)}>
          <div className="ps-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ps-flex-between" style={{ marginBottom: 16 }}>
              <h2>📈 {selectedRep.email} — Trends</h2>
              <button className="ps-btn-ghost" onClick={() => setSelectedRep(null)}>✕</button>
            </div>
            {trends.length === 0 ? (
              <div className="ps-empty">No monthly trend data yet.</div>
            ) : (
              <div>
                <table className="ps-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th style={{ textAlign: 'right' }}>Scripts</th>
                      <th style={{ textAlign: 'right' }}>Wins</th>
                      <th style={{ textAlign: 'right' }}>Calls</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trends.map((t) => (
                      <tr key={t.month}>
                        <td>{t.month}</td>
                        <td style={{ textAlign: 'right' }}>{t.scripts}</td>
                        <td style={{ textAlign: 'right', color: '#22c55e', fontWeight: 700 }}>{t.wins}</td>
                        <td style={{ textAlign: 'right' }}>{t.calls}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="ps-flex" style={{ gap: 24, marginTop: 16, justifyContent: 'center' }}>
                  {sparkline(trends.map((t) => t.scripts), 'var(--accent)')}
                  {sparkline(trends.map((t) => t.wins), '#22c55e')}
                  {sparkline(trends.map((t) => t.calls), '#f59e0b')}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
