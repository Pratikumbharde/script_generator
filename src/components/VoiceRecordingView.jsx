import React, { useEffect, useState } from 'react'
import { listScripts, listVoiceRecordings, createVoiceRecording, deleteVoiceRecording } from '../api/client.js'

export default function VoiceRecordingView({ scripts: scriptsProp = [] }) {
  const [scripts, setScripts] = useState(scriptsProp)
  const [recordings, setRecordings] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ script_id: '', segment_index: -1, text_content: '', voice_id: 'default' })

  useEffect(() => {
    if (scriptsProp.length > 0) return
    listScripts().then((s) => setScripts(s || [])).catch(() => {})
  }, [scriptsProp])

  async function load() {
    setLoading(true)
    try {
      const data = await listVoiceRecordings()
      setRecordings(data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleCreate() {
    if (!form.text_content.trim()) return
    setCreating(true)
    try {
      await createVoiceRecording(form)
      setForm({ script_id: '', segment_index: -1, text_content: '', voice_id: 'default' })
      await load()
    } catch (e) {
      alert(e.message)
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this recording?')) return
    await deleteVoiceRecording(id)
    await load()
  }

  function statusColor(status) {
    if (status === 'completed') return '#22c55e'
    if (status === 'processing') return '#f59e0b'
    if (status === 'failed') return '#ef4444'
    return 'var(--faint)'
  }

  // Simple TTS using Web Speech API
  async function playTTS(text) {
    if (!window.speechSynthesis) {
      alert('Text-to-speech not supported in this browser.')
      return
    }
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.95
    utterance.pitch = 1
    window.speechSynthesis.speak(utterance)
  }

  return (
    <div className="ps-container">
      <div className="ps-header">
        <h1>🎙 Voice Clone / TTS</h1>
        <p className="ps-muted">Generate AI voice recordings of your scripts for async practice and team review.</p>
      </div>

      <div className="ps-card" style={{ marginBottom: 24 }}>
        <h3 className="ps-section-title">Create Recording</h3>
        <div className="ps-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <select className="ps-select" value={form.script_id} onChange={(e) => setForm({ ...form, script_id: e.target.value })}>
            <option value="">Select script (optional)</option>
            {scripts.map((s) => (
              <option key={s.id} value={s.id}>{s.method} • {s.call_type}</option>
            ))}
          </select>
          <select className="ps-select" value={form.voice_id} onChange={(e) => setForm({ ...form, voice_id: e.target.value })}>
            <option value="default">Default Voice</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <textarea className="ps-textarea" rows={4} placeholder="Paste script text to convert to speech..." value={form.text_content} onChange={(e) => setForm({ ...form, text_content: e.target.value })} />
        <div className="ps-form-actions" style={{ marginTop: 12 }}>
          <button className="ps-btn" onClick={handleCreate} disabled={creating || !form.text_content.trim()}>
            {creating ? 'Creating...' : '🎙 Generate Recording'}
          </button>
          <button className="ps-btn ghost" onClick={() => playTTS(form.text_content)} disabled={!form.text_content.trim()}>
            ▶ Preview (Browser TTS)
          </button>
        </div>
      </div>

      {loading ? (
        <div className="ps-loading"><div className="ps-spinner" /> Loading recordings...</div>
      ) : recordings.length === 0 ? (
        <div className="ps-empty">No recordings yet. Create your first above.</div>
      ) : (
        <div className="ps-grid">
          {recordings.map((rec) => (
            <div key={rec.id} className="ps-card">
              <div className="ps-flex-between">
                <div>
                  <span className="ps-tag" style={{ background: statusColor(rec.status), color: '#fff' }}>{rec.status}</span>
                  <span className="ps-muted" style={{ marginLeft: 8, fontSize: 12 }}>{new Date(rec.created_at).toLocaleDateString()}</span>
                </div>
                <button className="ps-btn-ghost" onClick={() => handleDelete(rec.id)}>🗑</button>
              </div>

              <div className="ps-muted" style={{ fontSize: 12, marginTop: 4 }}>Voice: {rec.voice_id} • Duration: {rec.duration_seconds ? `${rec.duration_seconds}s` : '—'}</div>

              <pre style={{ marginTop: 10, fontSize: 12, background: 'var(--paper)', padding: 10, borderRadius: 8, maxHeight: 100, overflow: 'auto' }}>{rec.text_content.slice(0, 200)}{rec.text_content.length > 200 ? '...' : ''}</pre>

              <div className="ps-flex" style={{ gap: 8, marginTop: 12 }}>
                {rec.audio_url && (
                  <audio controls src={rec.audio_url} style={{ flex: 1, height: 32 }} />
                )}
                <button className="ps-btn-sm" onClick={() => playTTS(rec.text_content)}>▶ Play</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
