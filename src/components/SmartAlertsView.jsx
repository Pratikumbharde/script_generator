import React, { useEffect, useState } from 'react'
import { listSmartAlerts, listAllSmartAlerts, generateSmartAlerts, dismissSmartAlert } from '../api/client.js'

export default function SmartAlertsView() {
  const [alerts, setAlerts] = useState([])
  const [allAlerts, setAllAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [view, setView] = useState('active') // active | all

  async function load() {
    setLoading(true)
    try {
      if (view === 'active') {
        const data = await listSmartAlerts()
        setAlerts(data || [])
      } else {
        const data = await listAllSmartAlerts()
        setAllAlerts(data || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [view])

  async function handleGenerate() {
    setGenerating(true)
    try {
      await generateSmartAlerts()
      await load()
    } catch (e) {
      alert(e.message)
    } finally {
      setGenerating(false)
    }
  }

  async function handleDismiss(id) {
    await dismissSmartAlert(id)
    await load()
  }

  const displayAlerts = view === 'active' ? alerts : allAlerts

  function severityIcon(sev) {
    if (sev === 'critical') return '🔴'
    if (sev === 'warning') return '🟡'
    return '🔵'
  }

  function severityBorder(sev) {
    if (sev === 'critical') return '2px solid #ef4444'
    if (sev === 'warning') return '2px solid #f59e0b'
    return '1px solid var(--line)'
  }

  return (
    <div className="ps-container">
      <div className="ps-header">
        <h1>🚨 Smart Alerts & Recommendations</h1>
        <p className="ps-muted">AI-generated proactive alerts about your sales performance.</p>
      </div>

      <div className="ps-form-row" style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <select className="ps-select" value={view} onChange={(e) => setView(e.target.value)}>
          <option value="active">Active Alerts ({alerts.length})</option>
          <option value="all">All Alerts</option>
        </select>
        <button className="ps-btn" onClick={handleGenerate} disabled={generating}>
          {generating ? 'Analyzing...' : '🧠 Generate Alerts'}
        </button>
      </div>

      {loading ? (
        <div className="ps-loading"><div className="ps-spinner" /> Loading alerts...</div>
      ) : displayAlerts.length === 0 ? (
        <div className="ps-empty">No alerts yet. Click "Generate Alerts" to analyze your performance.</div>
      ) : (
        <div className="ps-grid">
          {displayAlerts.map((alert) => (
            <div key={alert.id} className="ps-card" style={{ border: severityBorder(alert.severity) }}>
              <div className="ps-flex-between">
                <div className="ps-flex" style={{ gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 20 }}>{severityIcon(alert.severity)}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{alert.title}</div>
                    <span className="ps-tag">{alert.alert_type}</span>
                    <span className="ps-muted" style={{ marginLeft: 8, fontSize: 12 }}>{new Date(alert.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                {!alert.dismissed && (
                  <button className="ps-btn-ghost" onClick={() => handleDismiss(alert.id)}>✕ Dismiss</button>
                )}
              </div>

              <div style={{ marginTop: 12, fontSize: 13, lineHeight: 1.5 }}>{alert.message}</div>

              {(alert.metric_value !== null || alert.metric_previous !== null) && (
                <div className="ps-flex" style={{ gap: 16, marginTop: 12 }}>
                  <div><div className="ps-muted" style={{ fontSize: 11 }}>Current</div><div style={{ fontWeight: 700 }}>{alert.metric_value}</div></div>
                  <div><div className="ps-muted" style={{ fontSize: 11 }}>Previous</div><div style={{ fontWeight: 700 }}>{alert.metric_previous}</div></div>
                </div>
              )}

              {alert.action_plan && (
                <div className="ps-callout" style={{ marginTop: 12 }}>
                  <strong>🎯 Action Plan:</strong> {alert.action_plan}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
