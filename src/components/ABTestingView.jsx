import React, { useEffect, useState } from 'react'
import { listScripts, listScriptVariants, createScriptVariant, useScriptVariant, getVariantWinner, deleteScriptVariant } from '../api/client.js'
import LimitedInput from './shared/LimitedInput.jsx'

export default function ABTestingView({ scripts: scriptsProp = [], products = [] }) {
  const [scripts, setScripts] = useState(scriptsProp)
  const [groups, setGroups] = useState({})
  const [loading, setLoading] = useState(true)
  const [groupName, setGroupName] = useState('')
  const [variant, setVariant] = useState('A')
  const [scriptId, setScriptId] = useState('')
  const [productId, setProductId] = useState('')
  const [winners, setWinners] = useState({})

  useEffect(() => {
    if (scriptsProp.length > 0) return
    listScripts().then((s) => setScripts(s || [])).catch(() => {})
  }, [scriptsProp])

  async function load() {
    setLoading(true)
    try {
      const data = await listScriptVariants()
      const byGroup = {}
      for (const v of data || []) {
        byGroup[v.group_name] = byGroup[v.group_name] || []
        byGroup[v.group_name].push(v)
      }
      setGroups(byGroup)

      // Check winners for groups with both variants
      const wins = {}
      for (const g of Object.keys(byGroup)) {
        if (byGroup[g].length >= 2) {
          try {
            const res = await getVariantWinner(g)
            wins[g] = res
          } catch (_) {}
        }
      }
      setWinners(wins)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleAdd() {
    if (!groupName.trim() || !scriptId || !productId) return
    const script = scripts.find((s) => String(s.id) === String(scriptId))
    await createScriptVariant({
      group_name: groupName.trim(),
      variant,
      script_id: scriptId,
      product_id: productId,
      method: script?.method || '',
      call_type: script?.call_type || '',
      duration: script?.duration || 0,
      language: script?.language || 'en',
      region: script?.region || 'india',
      delivery: script?.delivery || 'phone',
      simple: script?.simple || 0,
      persona: script?.persona || 'general',
      segments_json: script?.segments_json || '',
    })
    setScriptId('')
    await load()
  }

  async function handleUse(id, outcome) {
    await useScriptVariant(id, outcome)
    await load()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this variant?')) return
    await deleteScriptVariant(id)
    await load()
  }

  return (
    <div className="ps-container">
      <div className="ps-top">
        <div>
          <div className="ps-eyebrow">Optimize</div>
          <div className="ps-title">🧪 A/B Tests</div>
          <div className="ps-sub">Create variant A/B scripts, track outcomes, and auto-promote winners.</div>
        </div>
      </div>

      <div className="ps-card" style={{ marginBottom: 24 }}>
        <h3 className="ps-section-title">Add Variant</h3>
        <div className="ps-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
          <LimitedInput
            className="ps-input"
            maxLength={200}
            placeholder="Group name (e.g. 'Enterprise-Q3')"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
          <select className="ps-select" value={variant} onChange={(e) => setVariant(e.target.value)}>
            <option value="A">Variant A</option>
            <option value="B">Variant B</option>
          </select>
          <select className="ps-select" value={productId} onChange={(e) => setProductId(e.target.value)}>
            <option value="">Select product</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <select className="ps-select" value={scriptId} onChange={(e) => setScriptId(e.target.value)} style={{ marginBottom: 12 }}>
          <option value="">Select script to variant</option>
          {scripts.map((s) => (
            <option key={s.id} value={s.id}>
              {s.method} • {s.call_type} • {s.language}
            </option>
          ))}
        </select>
        <button className="ps-btn" onClick={handleAdd} disabled={!groupName.trim() || !scriptId || !productId}>
          ➕ Add Variant
        </button>
      </div>

      {loading ? (
        <div className="ps-loading"><div className="ps-spinner" /> Loading variants...</div>
      ) : Object.keys(groups).length === 0 ? (
        <div className="ps-empty">No A/B tests yet. Create your first variant above.</div>
      ) : (
        <div className="ps-grid">
          {Object.entries(groups).map(([name, variants]) => {
            const a = variants.find((v) => v.variant === 'A')
            const b = variants.find((v) => v.variant === 'B')
            const win = winners[name]
            return (
              <div key={name} className="ps-card">
                <div className="ps-flex-between" style={{ marginBottom: 12 }}>
                  <h3 className="ps-section-title">{name}</h3>
                  {win && win.winner !== 'tie' && (
                    <span className="ps-tag ps-tag-accent">
                      🏆 Winner: Variant {win.winner} (+{win.confidence}%)
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {['A', 'B'].map((vkey) => {
                    const v = vkey === 'A' ? a : b
                    if (!v) return <div key={vkey} className="ps-empty">No variant {vkey}</div>
                    const rate = v.usage_count > 0 ? Math.round((v.win_count / v.usage_count) * 100) : 0
                    return (
                      <div key={vkey} className="ps-card" style={{ padding: 12, border: win?.winner === vkey ? '2px solid var(--accent)' : undefined }}>
                        <div className="ps-flex-between">
                          <strong>Variant {vkey}</strong>
                          <button className="ps-btn-ghost" onClick={() => handleDelete(v.id)}>🗑</button>
                        </div>
                        <div className="ps-muted" style={{ fontSize: 12, marginTop: 4 }}>{v.method} • {v.call_type}</div>
                        <div className="ps-flex" style={{ gap: 16, marginTop: 12 }}>
                          <div><div className="ps-muted" style={{ fontSize: 11 }}>Usage</div><div style={{ fontWeight: 700 }}>{v.usage_count}</div></div>
                          <div><div className="ps-muted" style={{ fontSize: 11 }}>Wins</div><div style={{ fontWeight: 700, color: '#22c55e' }}>{v.win_count}</div></div>
                          <div><div className="ps-muted" style={{ fontSize: 11 }}>Win rate</div><div style={{ fontWeight: 700 }}>{rate}%</div></div>
                        </div>
                        <div className="ps-flex" style={{ gap: 8, marginTop: 12 }}>
                          <button className="ps-btn-sm" onClick={() => handleUse(v.id, 'won')}>✅ Won</button>
                          <button className="ps-btn-sm" onClick={() => handleUse(v.id, 'lost')}>❌ Lost</button>
                          <button className="ps-btn-sm" onClick={() => handleUse(v.id, 'used')}>📞 Used</button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {win?.promote && (
                  <div className="ps-callout ps-accent" style={{ marginTop: 12 }}>
                    Variant {win.winner} is statistically ahead with {win.confidence}% confidence. Consider promoting it as the default script.
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
