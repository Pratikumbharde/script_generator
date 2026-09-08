import React, { useState } from 'react'
import { exportWorkspaceJSON, exportWorkspaceCSV } from '../api/client.js'

export default function DataExportView() {
  const [exporting, setExporting] = useState(false)
  const [format, setFormat] = useState('json')
  const [error, setError] = useState('')

  async function download(res, filename) {
    if (!res.ok) {
      // e.g. 403 when the role lacks can_export_data — show the message, don't save a broken file
      let msg = `Export failed (HTTP ${res.status})`
      try {
        const body = await res.json()
        if (body?.error) msg = body.error
      } catch { /* not JSON — keep the HTTP status message */ }
      throw new Error(msg)
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleExport() {
    setExporting(true)
    setError('')
    try {
      const stamp = new Date().toISOString().slice(0, 10)
      if (format === 'json') {
        await download(await exportWorkspaceJSON(), `pitch-studio-export-${stamp}.json`)
      } else {
        await download(await exportWorkspaceCSV(), `pitch-studio-scripts-${stamp}.csv`)
      }
    } catch (e) {
      setError(e.message || 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="ps-container">
      <div className="ps-header">
        <h1>Export</h1>
        <p className="ps-muted">Export your workspace data for backups, compliance, or migration.</p>
      </div>

      <div className="ps-card" style={{ marginBottom: 24 }}>
        <h3 className="ps-section-title">Export Format</h3>
        <div className="ps-form-row" style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <label className="ps-card" style={{ flex: 1, cursor: 'pointer', border: format === 'json' ? '2px solid var(--accent)' : undefined }}>
            <input type="radio" name="fmt" value="json" checked={format === 'json'} onChange={() => setFormat('json')} style={{ marginRight: 8 }} />
            <strong>JSON Export</strong>
            <div className="ps-muted" style={{ fontSize: 12, marginTop: 4 }}>Full workspace dump: products, scripts, staff, feedback, components, scheduled calls, audit logs.</div>
          </label>
          <label className="ps-card" style={{ flex: 1, cursor: 'pointer', border: format === 'csv' ? '2px solid var(--accent)' : undefined }}>
            <input type="radio" name="fmt" value="csv" checked={format === 'csv'} onChange={() => setFormat('csv')} style={{ marginRight: 8 }} />
            <strong>CSV Export</strong>
            <div className="ps-muted" style={{ fontSize: 12, marginTop: 4 }}>Scripts only — spreadsheet-friendly with product names, methods, outcomes.</div>
          </label>
        </div>
        <button className="ps-btn pri" onClick={handleExport} disabled={exporting}>
          {exporting ? 'Exporting...' : '⬇ Download Export'}
        </button>
        {error && (
          <div className="ps-muted" style={{ marginTop: 12, color: 'var(--danger, #ef4444)' }}>
            ⚠ {error}
          </div>
        )}
      </div>

      <div className="ps-card">
        <h3 className="ps-section-title">What's included</h3>
        <div className="exp-included-grid">
          {[
            { icon: '📦', label: 'Products', json: true, csv: false },
            { icon: '📝', label: 'Scripts', json: true, csv: true },
            { icon: '👥', label: 'Staff', json: true, csv: false },
            { icon: '⭐', label: 'Feedback', json: true, csv: false },
            { icon: '🧩', label: 'Components', json: true, csv: false },
            { icon: '📅', label: 'Scheduled Calls', json: true, csv: false },
            { icon: '📋', label: 'Audit Logs', json: true, csv: false },
          ].map((item) => (
            <div key={item.label} className="exp-item">
              <span>{item.icon}</span>
              <span>{item.label}</span>
              <span className="ps-muted" style={{ fontSize: 11 }}>
                {format === 'json' ? (item.json ? '✓' : '—') : (item.csv ? '✓' : '—')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
