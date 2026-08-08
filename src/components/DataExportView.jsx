import React, { useState } from 'react'
import { exportWorkspaceJSON, exportWorkspaceCSV } from '../api/client.js'

export default function DataExportView() {
  const [exporting, setExporting] = useState(false)
  const [format, setFormat] = useState('json')

  async function handleExport() {
    setExporting(true)
    try {
      if (format === 'json') {
        const res = await exportWorkspaceJSON()
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `pitch-studio-export-${new Date().toISOString().slice(0, 10)}.json`
        a.click()
        URL.revokeObjectURL(url)
      } else {
        const res = await exportWorkspaceCSV()
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `pitch-studio-scripts-${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (e) {
      alert('Export failed: ' + e.message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="ps-container">
      <div className="ps-header">
        <h1>📦 Data Export & Backup</h1>
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
      </div>

      <div className="ps-card">
        <h3 className="ps-section-title">What's included</h3>
        <div className="ps-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          {[
            { icon: '📦', label: 'Products', json: true, csv: false },
            { icon: '📝', label: 'Scripts', json: true, csv: true },
            { icon: '👥', label: 'Staff', json: true, csv: false },
            { icon: '⭐', label: 'Feedback', json: true, csv: false },
            { icon: '🧩', label: 'Components', json: true, csv: false },
            { icon: '📅', label: 'Scheduled Calls', json: true, csv: false },
            { icon: '📋', label: 'Audit Logs', json: true, csv: false },
          ].map((item) => (
            <div key={item.label} className="ps-flex" style={{ gap: 8, alignItems: 'center', fontSize: 13 }}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
              <span className="ps-muted" style={{ fontSize: 11, marginLeft: 'auto' }}>
                {format === 'json' ? (item.json ? '✓' : '—') : (item.csv ? '✓' : '—')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
