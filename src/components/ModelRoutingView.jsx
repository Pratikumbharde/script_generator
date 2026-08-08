import React, { useEffect, useState } from 'react'
import { routeChat, getModelRoutingLogs } from '../api/client.js'

const TASK_TYPES = [
  { value: 'script_generation', label: 'Script Generation' },
  { value: 'coaching', label: 'Coaching' },
  { value: 'sentiment', label: 'Sentiment Analysis' },
  { value: 'deal_scoring', label: 'Deal Scoring' },
  { value: 'chat', label: 'Chat' },
  { value: 'refinement', label: 'Refinement' },
  { value: 'competitor_intel', label: 'Competitor Intel' },
]

export default function ModelRoutingView() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [taskType, setTaskType] = useState('chat')
  const [prompt, setPrompt] = useState('')
  const [preferredModel, setPreferredModel] = useState('')
  const [routing, setRouting] = useState(false)
  const [result, setResult] = useState(null)

  async function loadLogs() {
    setLoading(true)
    try {
      const data = await getModelRoutingLogs()
      setLogs(data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadLogs() }, [])

  async function handleRoute() {
    if (!prompt.trim()) return
    setRouting(true)
    try {
      const messages = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: prompt },
      ]
      const res = await routeChat(taskType, messages, preferredModel || undefined)
      setResult(res)
      await loadLogs()
    } catch (e) {
      alert(e.message)
    } finally {
      setRouting(false)
    }
  }

  return (
    <div className="ps-container">
      <div className="ps-header">
        <h1>🔄 Multi-Model AI Routing</h1>
        <p className="ps-muted">Intelligent model selection with automatic fallback chains.</p>
      </div>

      <div className="ps-card" style={{ marginBottom: 24 }}>
        <h3 className="ps-section-title">Test Routing</h3>
        <div className="ps-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <select className="ps-select" value={taskType} onChange={(e) => setTaskType(e.target.value)}>
            {TASK_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select className="ps-select" value={preferredModel} onChange={(e) => setPreferredModel(e.target.value)}>
            <option value="">Auto-select model</option>
            <option value="glm-5.2:cloud">glm-5.2:cloud</option>
            <option value="glm-5.2">glm-5.2</option>
          </select>
        </div>
        <input className="ps-input" placeholder="Enter a test prompt..." value={prompt} onChange={(e) => setPrompt(e.target.value)} style={{ marginBottom: 12 }} />
        <button className="ps-btn" onClick={handleRoute} disabled={routing || !prompt.trim()}>
          {routing ? 'Routing...' : '🔄 Route to Best Model'}
        </button>

        {result && (
          <div className="ps-callout" style={{ marginTop: 16 }}>
            <div><strong>Model Used:</strong> {result.model}</div>
            <div><strong>Duration:</strong> {result.duration_ms}ms</div>
            <div style={{ marginTop: 8 }}><strong>Response:</strong></div>
            <div style={{ fontSize: 13, marginTop: 4, whiteSpace: 'pre-wrap' }}>{result.content}</div>
          </div>
        )}
      </div>

      <h2 className="ps-section-title">Routing History</h2>
      {loading ? (
        <div className="ps-loading"><div className="ps-spinner" /> Loading logs...</div>
      ) : logs.length === 0 ? (
        <div className="ps-empty">No routing logs yet. Run a test above.</div>
      ) : (
        <div className="ps-card">
          <table className="ps-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Task</th>
                <th>Model</th>
                <th>Fallback</th>
                <th style={{ textAlign: 'right' }}>Duration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{new Date(log.created_at).toLocaleString()}</td>
                  <td><span className="ps-tag">{log.task_type}</span></td>
                  <td>{log.model_used}</td>
                  <td>{log.fallback_from || '—'}</td>
                  <td style={{ textAlign: 'right' }}>{log.duration_ms}ms</td>
                  <td>
                    {log.success ? (
                      <span style={{ color: '#22c55e', fontWeight: 700 }}>✓ Success</span>
                    ) : (
                      <span style={{ color: '#ef4444', fontWeight: 700 }}>✕ Failed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
