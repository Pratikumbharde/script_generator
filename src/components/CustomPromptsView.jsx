import React, { useEffect, useState } from 'react'
import { listCustomPrompts, createCustomPrompt, updateCustomPrompt, deleteCustomPrompt } from '../api/client.js'

const TYPE_OPTIONS = [
  { value: 'system', label: 'System Prompt' },
  { value: 'opening', label: 'Opening' },
  { value: 'objection', label: 'Objection Handler' },
  { value: 'discovery', label: 'Discovery' },
  { value: 'closing', label: 'Closing' },
  { value: 'tone', label: 'Tone Guidance' },
]

export default function CustomPromptsView() {
  const [prompts, setPrompts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', type: 'system', prompt: '', is_default: false })

  async function load() {
    setLoading(true)
    try {
      const data = await listCustomPrompts()
      setPrompts(data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleSave() {
    if (!form.name.trim() || !form.prompt.trim()) return
    try {
      if (editing) {
        await updateCustomPrompt(editing, form)
      } else {
        await createCustomPrompt(form)
      }
      setEditing(null)
      setForm({ name: '', type: 'system', prompt: '', is_default: false })
      await load()
    } catch (e) {
      alert(e.message)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this custom prompt?')) return
    await deleteCustomPrompt(id)
    await load()
  }

  function startEdit(p) {
    setEditing(p.id)
    setForm({ name: p.name, type: p.type, prompt: p.prompt, is_default: !!p.is_default })
  }

  return (
    <div className="ps-container">
      <div className="ps-header">
        <h1>✨ Custom AI Prompts</h1>
        <p className="ps-muted">Override the default AI prompt templates for your team.</p>
      </div>

      <div className="ps-card" style={{ marginBottom: 24 }}>
        <h3 className="ps-section-title">{editing ? 'Edit Prompt' : 'New Custom Prompt'}</h3>
        <div className="ps-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <input className="ps-input" placeholder="Prompt name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select className="ps-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <textarea className="ps-textarea" rows={6} placeholder="Enter your custom prompt here..." value={form.prompt} onChange={(e) => setForm({ ...form, prompt: e.target.value })} />
        <div className="ps-form-actions" style={{ marginTop: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} />
            Set as default for this type
          </label>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="ps-btn" onClick={handleSave} disabled={!form.name.trim() || !form.prompt.trim()}>{editing ? 'Update' : 'Save'} Prompt</button>
            {editing && <button className="ps-btn ghost" onClick={() => { setEditing(null); setForm({ name: '', type: 'system', prompt: '', is_default: false }) }}>Cancel</button>}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="ps-loading"><div className="ps-spinner" /> Loading prompts...</div>
      ) : prompts.length === 0 ? (
        <div className="ps-empty">No custom prompts yet. Create your first above.</div>
      ) : (
        <div className="ps-grid">
          {prompts.map((p) => (
            <div key={p.id} className="ps-card">
              <div className="ps-flex-between">
                <div>
                  <strong>{p.name}</strong>
                  <span className="ps-tag" style={{ marginLeft: 8 }}>{TYPE_OPTIONS.find((o) => o.value === p.type)?.label || p.type}</span>
                  {p.is_default && <span className="ps-tag ps-tag-accent" style={{ marginLeft: 4 }}>Default</span>}
                </div>
                <div className="ps-flex" style={{ gap: 8 }}>
                  <button className="ps-btn-ghost" onClick={() => startEdit(p)}>✏️</button>
                  <button className="ps-btn-ghost" onClick={() => handleDelete(p.id)}>🗑</button>
                </div>
              </div>
              <pre style={{ marginTop: 10, fontSize: 12, background: 'var(--paper)', padding: 10, borderRadius: 8, maxHeight: 120, overflow: 'auto' }}>{p.prompt.slice(0, 300)}{p.prompt.length > 300 ? '...' : ''}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
