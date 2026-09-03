import React, { useState, useEffect, useMemo } from 'react'
import { listVoiceDocs, createVoiceDoc, deleteVoiceDoc, getVoiceDNA, analyzeVoiceDNA, toggleVoiceDNA } from '../api/client.js'
import { RowSkeleton } from './shared/Skeletons.jsx'
import LimitedInput from './shared/LimitedInput.jsx'
import LimitedTextarea from './shared/LimitedTextarea.jsx'
import AudioUpload from './shared/AudioUpload.jsx'
import { Sparkles, RefreshCw, Trash2, Upload, FileText, ToggleLeft, ToggleRight, Search, X } from 'lucide-react'

const DOC_TYPES = [
  { id: 'pitch_deck', label: 'Pitch deck', icon: '📊' },
  { id: 'email', label: 'Email / Copy', icon: '✉️' },
  { id: 'call_recording', label: 'Call recording', icon: '🎙' },
  { id: 'call_transcript', label: 'Call transcript', icon: '📝' },
  { id: 'brand_guide', label: 'Brand guide', icon: '📖' },
  { id: 'competitor_battlecard', label: 'Battlecard', icon: '⚔️' },
  { id: 'other', label: 'Other', icon: '📄' },
]

const PROFILE_FIELDS = [
  { key: 'tone', label: 'Tone' },
  { key: 'formality', label: 'Formality' },
  { key: 'communication_style', label: 'Communication Style' },
  { key: 'sentence_style', label: 'Sentence Style' },
  { key: 'preferred_vocabulary', label: 'Preferred Vocabulary' },
  { key: 'avoid_vocabulary', label: 'Avoid Vocabulary' },
  { key: 'messaging_patterns', label: 'Messaging Patterns' },
  { key: 'brand_terminology', label: 'Brand Terminology' },
  { key: 'guidelines', label: 'Guidelines' },
]

export default function VoiceDNA() {
  const [docs, setDocs] = useState(null)
  const [profile, setProfile] = useState(null)
  const [dnaEnabled, setDnaEnabled] = useState(true)
  const [creating, setCreating] = useState(false)
  const [uploadingRecording, setUploadingRecording] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', type: 'pitch_deck', content: '', tags: '' })
  const [docQuery, setDocQuery] = useState('')
  const [docTypeFilter, setDocTypeFilter] = useState('all')
  const [docSort, setDocSort] = useState('newest')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [docsData, profileData] = await Promise.all([
        listVoiceDocs(),
        getVoiceDNA().catch(() => null),
      ])
      setDocs(docsData || [])
      setProfile(profileData)

      // Check preferences for voice_dna_enabled
      const prefs = await fetch('/api/preferences', {
        headers: { Authorization: `Bearer ${localStorage.getItem('ps_token') || ''}` },
      }).then(r => r.json()).catch(() => ({}))
      if (prefs.preferences) {
        setDnaEnabled(prefs.preferences.voice_dna_enabled !== 0)
      }
    } catch (e) {
      setDocs([])
    }
  }

  const save = async () => {
    if (!form.name.trim() || !form.content.trim()) return
    await createVoiceDoc({ ...form, name: form.name.trim(), content: form.content.trim() })
    setForm({ name: '', type: 'pitch_deck', content: '', tags: '' })
    setCreating(false)
    const updatedDocs = await listVoiceDocs()
    setDocs(updatedDocs)
  }

  const remove = async (id) => {
    if (!confirm('Delete this document?')) return
    await deleteVoiceDoc(id)
    const updatedDocs = await listVoiceDocs()
    setDocs(updatedDocs)
  }

  const handleRecordingTranscript = async (result) => {
    if (!result || !result.text) {
      setError('Transcription failed. Please try again or type the transcript manually.')
      setUploadingRecording(false)
      return
    }
    // Build text from segments or plain text
    const transcript = result.diarization && result.segments?.length > 1
      ? result.segments.map(s => `${s.speaker}: ${s.text}`).join('\n')
      : result.text

    await createVoiceDoc({
      name: `Call Recording — ${new Date().toLocaleDateString()}`,
      type: 'call_recording',
      content: transcript,
      tags: 'recording,transcript',
    })
    const updatedDocs = await listVoiceDocs()
    setDocs(updatedDocs)
    setUploadingRecording(false)
  }

  const handleAnalyze = async () => {
    setAnalyzing(true)
    setError('')
    try {
      const result = await analyzeVoiceDNA()
      setProfile(result)
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleToggle = async () => {
    const newValue = !dnaEnabled
    setDnaEnabled(newValue)
    try {
      await toggleVoiceDNA(newValue)
    } catch {
      setDnaEnabled(!newValue)
    }
  }

  // Filtered & sorted documents
  const filteredDocs = useMemo(() => {
    if (!docs) return []
    let list = docs
    // Search by name + tags
    if (docQuery.trim()) {
      const q = docQuery.toLowerCase()
      list = list.filter(d =>
        (d.name || '').toLowerCase().includes(q) ||
        (d.tags || '').toLowerCase().includes(q)
      )
    }
    // Filter by type
    if (docTypeFilter !== 'all') {
      list = list.filter(d => d.type === docTypeFilter)
    }
    // Sort
    const sorted = [...list]
    switch (docSort) {
      case 'oldest': sorted.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0)); break
      case 'name': sorted.sort((a, b) => (a.name || '').localeCompare(b.name || '')); break
      case 'newest': default: sorted.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)); break
    }
    return sorted
  }, [docs, docQuery, docTypeFilter, docSort])

  if (docs === null) {
    return (
      <>
        <div className="ps-top"><div><div className="ps-eyebrow">Voice DNA</div><div className="ps-title"><Mic size={22} style={{ marginRight: 8, verticalAlign: "-3px" }} />Company Voice</div></div></div>
        <div className="ps-body"><RowSkeleton count={5} /></div>
      </>
    )
  }

  return (
    <>
      <div className="ps-top">
        <div>
          <div className="ps-eyebrow">Voice DNA</div>
          <div className="ps-title"><Mic size={22} style={{ marginRight: 8, verticalAlign: "-3px" }} />Company Voice</div>
          <div className="ps-sub">Add company materials and analyze them to create a Voice DNA profile. The profile shapes how scripts sound when generating them.</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {!creating && !uploadingRecording && (
            <>
              <button className="ps-btn ghost" onClick={() => setUploadingRecording(true)}>
                <Upload size={16} /> Upload Recording
              </button>
              <button className="ps-btn pri" onClick={() => setCreating(true)}>
                + Add Document
              </button>
            </>
          )}
        </div>
      </div>

      <div className="ps-body">
        {error && <div className="ca-error" style={{ marginBottom: 16 }}>{error}<button className="ca-error-dismiss" onClick={() => setError('')}>Dismiss</button></div>}

        {/* Section 1: Upload Recording */}
        {uploadingRecording && (
          <div className="vdna-section" style={{ marginBottom: 24 }}>
            <div className="vdna-section-title">Transcribe a Call Recording</div>
            <div className="vdna-section-desc">Upload or record a call. The transcript will be saved as a company material.</div>
            <AudioUpload onTranscript={handleRecordingTranscript} />
            <button className="ps-btn ghost" style={{ marginTop: 10 }} onClick={() => setUploadingRecording(false)}>Cancel</button>
          </div>
        )}

        {/* Section 2: Add Document */}
        {creating && (
          <div className="ps-form" style={{ marginBottom: 24, maxWidth: 720 }}>
            <div className="frow two">
              <div>
                <label className="flab">Document name<span className="req">*</span></label>
                <LimitedInput className="finp" maxLength={200} placeholder="e.g. Q3 Pitch Deck" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="flab">Type<span className="req">*</span></label>
                <select className="fsel" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {DOC_TYPES.map((t) => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
                </select>
              </div>
            </div>
            <div className="frow">
              <label className="flab">Content<span className="req">*</span> <span className="opt">(paste text, transcript, or key excerpts)</span></label>
              <LimitedTextarea className="ftext" maxLength={10000} placeholder="Paste the text here. For a pitch deck, paste the slides' bullet points. For an email, paste the full copy." value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
            </div>
            <div className="frow">
              <label className="flab">Tags <span className="opt">(optional)</span></label>
              <LimitedInput className="finp" maxLength={500} placeholder="enterprise, formal, technical" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="ps-btn pri" disabled={!form.name.trim() || !form.content.trim()} onClick={save}>Save document</button>
              <button className="ps-btn ghost" onClick={() => setCreating(false)}>Cancel</button>
            </div>
          </div>
        )}

        {/* Section 3: Documents List */}
        <div className="vdna-section">
          <div className="vdna-section-title">Company Materials</div>
          {docs.length === 0 ? (
            <div className="ps-empty">
              <div className="big">No documents yet</div>
              <p>Add pitch decks, emails, call transcripts, or brand guides so the AI can learn your company's voice.</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="ps-btn ghost" onClick={() => setUploadingRecording(true)}>
                  <Upload size={16} /> Upload Recording
                </button>
                <button className="ps-btn pri" onClick={() => setCreating(true)}>+ Add Document</button>
              </div>
            </div>
          ) : (
            <>
              {/* Search & filter toolbar */}
              <div className="vdna-toolbar">
                <div className="dt-search" style={{ flex: 1, minWidth: 0 }}>
                  <Search size={15} className="dt-search-icon" />
                  <input
                    type="text"
                    placeholder="Search documents…"
                    value={docQuery}
                    onChange={e => setDocQuery(e.target.value)}
                  />
                  {docQuery && <button className="dt-search-clear" onClick={() => setDocQuery('')}><X size={13} /></button>}
                </div>
                <select className="fsel" value={docTypeFilter} onChange={e => setDocTypeFilter(e.target.value)} style={{ minWidth: 140 }}>
                  <option value="all">All types</option>
                  {DOC_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
                </select>
                <select className="fsel" value={docSort} onChange={e => setDocSort(e.target.value)} style={{ minWidth: 130 }}>
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="name">Name A–Z</option>
                </select>
                <span style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{filteredDocs.length} of {docs.length}</span>
              </div>
              {filteredDocs.length === 0 ? (
                <div className="ps-empty" style={{ padding: 24 }}>
                  <div style={{ fontSize: 14, color: 'var(--muted)' }}>No documents match your filters</div>
                  <button className="ps-btn ghost sm" style={{ marginTop: 10 }} onClick={() => { setDocQuery(''); setDocTypeFilter('all'); }}>Clear filters</button>
                </div>
              ) : (
                <div className="comp-grid">
                  {filteredDocs.map((d) => {
                    const typeMeta = DOC_TYPES.find((t) => t.id === d.type) || DOC_TYPES[0]
                    return (
                      <div key={d.id} className="comp-card">
                        <div className="comp-head">
                          <span className="comp-type" style={{ background: 'var(--accent-bg)', color: 'var(--accent-ink)' }}>
                            {typeMeta.icon} {typeMeta.label}
                          </span>
                          <button className="ps-btn danger sm" style={{ marginLeft: 'auto' }} onClick={() => remove(d.id)}>Delete</button>
                        </div>
                        <div className="comp-name">{d.name}</div>
                        {d.tags && (
                          <div className="comp-tags">
                            {d.tags.split(',').map((tag) => tag.trim()).filter(Boolean).map((tag, i) => (
                              <span key={i} className="chip">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="ps-btn ghost" onClick={() => setUploadingRecording(true)}>
                  <Upload size={16} /> Upload Recording
                </button>
                <button className="ps-btn ghost" onClick={() => setCreating(true)}>+ Add Document</button>
              </div>
            </>
          )}
        </div>

        {/* Section 4: Analyze */}
        <div className="vdna-section" style={{ marginTop: 32 }}>
          <div className="vdna-section-title">Voice DNA Profile</div>
          <div className="vdna-section-desc">Analyze your materials to extract the company's unique voice — tone, vocabulary, style, and guidelines.</div>

          {!profile ? (
            <div className="vdna-empty">
              {analyzing ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 32 }}>
                  <div className="vdna-spinner" />
                  <div>Analyzing your materials…</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>This takes 10-20 seconds</div>
                </div>
              ) : (
                <>
                  <div className="vdna-empty-icon"><Sparkles size={32} /></div>
                  <div className="big">No Voice DNA profile yet</div>
                  <p>Add company materials above, then click Analyze to generate your profile.</p>
                  <button className="ps-btn pri" disabled={docs.length === 0 || analyzing} onClick={handleAnalyze}>
                    <Sparkles size={16} /> Analyze Voice DNA
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="vdna-profile">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div className="vdna-profile-title">Your Company Voice Profile</div>
                <button className="ps-btn ghost" disabled={analyzing} onClick={handleAnalyze}>
                  <RefreshCw size={14} /> {analyzing ? 'Analyzing…' : 'Re-analyze'}
                </button>
              </div>
              {analyzing && <div style={{ textAlign: 'center', padding: 16 }}><div className="vdna-spinner" /><div style={{ marginTop: 8, color: 'var(--muted)' }}>Re-analyzing…</div></div>}
              {!analyzing && (
                <div className="vdna-profile-grid">
                  {PROFILE_FIELDS.map(({ key, label }) => (
                    <div key={key} className="vdna-profile-card">
                      <div className="vdna-profile-label">{label}</div>
                      <div className="vdna-profile-value">{profile[key] || '—'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 5: Toggle */}
        <div className="vdna-section" style={{ marginTop: 32 }}>
          <div className="vdna-toggle-row">
            <div>
              <div className="vdna-toggle-title">Apply Company Voice DNA to generated scripts</div>
              <div className="vdna-toggle-desc">When enabled, scripts will follow your company's tone, vocabulary, and style. When disabled, scripts use a neutral voice.</div>
            </div>
            <button className={`vdna-toggle ${dnaEnabled ? 'vdna-toggle-on' : 'vdna-toggle-off'}`} onClick={handleToggle}>
              {dnaEnabled ? <ToggleRight size={40} /> : <ToggleLeft size={40} />}
              <span>{dnaEnabled ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}