import { useState, useEffect, useMemo } from 'react'
import { ArrowLeft, FileAudio, History, Loader2, PenLine, Search, X } from 'lucide-react'
import AudioUpload from './shared/AudioUpload.jsx'
import DiarizedTranscript from './shared/DiarizedTranscript.jsx'
import AnalysisReport from './shared/AnalysisReport.jsx'
import VoiceRecorder from './shared/VoiceRecorder.jsx'
import { analyzeCall, listCallAnalyses, getCallAnalysis, listScripts } from '../api/client.js'

const STEPS = {
  UPLOAD: 'upload',
  TRANSCRIBING: 'transcribing',
  REVIEW: 'review',
  ANALYZING: 'analyzing',
  RESULTS: 'results',
}

/**
 * CallAnalysisView — Upload/record a call, type details, transcribe, review, analyze.
 *
 * Props:
 * - products — list of products (for product context)
 * - initialScriptId — pre-selected script (from ScriptCockpit "Analyze" button)
 * - onBack — navigate back
 */
export default function CallAnalysisView({ products = [], initialScriptId = null, onBack }) {
  const [step, setStep] = useState(STEPS.UPLOAD)
  const [transcriptResult, setTranscriptResult] = useState(null)
  const [editedTranscript, setEditedTranscript] = useState('')
  const [selectedScriptId, setSelectedScriptId] = useState(initialScriptId || '')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [analysisResult, setAnalysisResult] = useState(null)
  const [error, setError] = useState('')
  const [pastAnalyses, setPastAnalyses] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [historyQuery, setHistoryQuery] = useState('')
  const [historySort, setHistorySort] = useState('newest')
  const [scripts, setScripts] = useState([])
  const [inputMode, setInputMode] = useState(null) // null | 'audio' | 'type'
  const [typedCall, setTypedCall] = useState('')

  // Load scripts and past analyses on mount
  useEffect(() => {
    listScripts()
      .then(setScripts)
      .catch(() => {})
    listCallAnalyses()
      .then(setPastAnalyses)
      .catch(() => {})
  }, [])

  // Filtered & sorted past analyses
  const filteredAnalyses = useMemo(() => {
    let list = pastAnalyses
    if (historyQuery.trim()) {
      const q = historyQuery.toLowerCase()
      list = list.filter(a =>
        (a.transcript || '').toLowerCase().includes(q) ||
        (a.overall_score != null && String(a.overall_score).includes(q)) ||
        (a.created_at || '').toLowerCase().includes(q)
      )
    }
    const sorted = [...list]
    switch (historySort) {
      case 'oldest': sorted.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0)); break
      case 'score_high': sorted.sort((a, b) => (b.overall_score ?? 0) - (a.overall_score ?? 0)); break
      case 'score_low': sorted.sort((a, b) => (a.overall_score ?? 0) - (b.overall_score ?? 0)); break
      case 'newest': default: sorted.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)); break
    }
    return sorted
  }, [pastAnalyses, historyQuery, historySort])

  // When transcript arrives from upload/record
  const handleTranscript = (result) => {
    if (!result || !result.text) {
      setError('No transcript returned. Try again or type your call details manually.')
      setStep(STEPS.UPLOAD)
      return
    }
    setTranscriptResult(result)
    // Build readable text from segments (with speaker labels) or flat text
    if (result.segments?.length > 1 && result.diarization) {
      setEditedTranscript(result.segments.map(s => `${s.speaker}: ${s.text}`).join('\n'))
    } else {
      setEditedTranscript(result.text)
    }
    setStep(STEPS.REVIEW)
  }

  // When user types call details manually
  const handleTypedSubmit = () => {
    if (!typedCall.trim()) {
      setError('Please describe the call details.')
      return
    }
    setTranscriptResult({
      text: typedCall,
      confidence: 1,
      language: 'en',
      diarization: false,
      segments: [{ speaker: 'Speaker 1', text: typedCall, start: 0, end: 0, confidence: 1 }],
    })
    setEditedTranscript(typedCall)
    setStep(STEPS.REVIEW)
  }

  // Run analysis
  const handleAnalyze = async () => {
    const transcriptText = editedTranscript.trim()
    if (!transcriptText) return
    setStep(STEPS.ANALYZING)
    setError('')

    try {
      const data = {
        transcript: transcriptText,
        segments: transcriptResult?.segments || [],
      }
      if (selectedScriptId) data.script_id = selectedScriptId
      if (selectedProductId) data.product_id = selectedProductId

      const result = await analyzeCall(data)
      setAnalysisResult(result.analysis || result)
      setStep(STEPS.RESULTS)

      // Refresh past analyses
      listCallAnalyses().then(setPastAnalyses).catch(() => {})
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.')
      setStep(STEPS.REVIEW)
    }
  }

  // Re-analyze with different script
  const handleReanalyze = () => {
    setStep(STEPS.REVIEW)
    setAnalysisResult(null)
  }

  // View a past analysis
  const handleViewPast = async (id) => {
    try {
      const analysis = await getCallAnalysis(id)
      setAnalysisResult(analysis)
      setStep(STEPS.RESULTS)
      setShowHistory(false)
    } catch (err) {
      setError('Failed to load analysis')
    }
  }

  // Script label for display
  const selectedScript = scripts.find(s => s.id?.toString() === selectedScriptId?.toString())
  const scriptLabel = selectedScript
    ? `${selectedScript.method || ''} ${selectedScript.call_type || ''} ${selectedScript.duration || ''}min`.trim()
    : ''

  return (
    <div className="ca-view">
      <div className="ca-top">
        <div>
          <div className="ps-eyebrow">Intelligence</div>
          <div className="ps-title">Call Analysis</div>
          <div className="ps-sub">Upload a recording, type call details, or record live — get AI-powered feedback on script adherence, missed opportunities, and coaching tips.</div>
        </div>
        <div className="ca-top-actions">
          {pastAnalyses.length > 0 && (
            <button className="ps-btn ghost" onClick={() => setShowHistory(!showHistory)}>
              <History size={16} /> Past Analyses ({pastAnalyses.length})
            </button>
          )}
          {onBack && (
            <button className="ps-btn ghost" onClick={onBack}>
              <ArrowLeft size={16} /> Back
            </button>
          )}
        </div>
      </div>

      {/* Past analyses dropdown */}
      {showHistory && pastAnalyses.length > 0 && (
        <div className="ca-history-panel">
          <div className="ca-history-header">Previous Analyses ({pastAnalyses.length})</div>
          <div className="ca-history-toolbar">
            <div className="dt-search" style={{ flex: 1, minWidth: 0 }}>
              <Search size={14} className="dt-search-icon" />
              <input
                type="text"
                placeholder="Search analyses…"
                value={historyQuery}
                onChange={e => setHistoryQuery(e.target.value)}
              />
              {historyQuery && <button className="dt-search-clear" onClick={() => setHistoryQuery('')}><X size={13} /></button>}
            </div>
            <select className="fsel" value={historySort} onChange={e => setHistorySort(e.target.value)} style={{ minWidth: 130 }}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="score_high">Highest score</option>
              <option value="score_low">Lowest score</option>
            </select>
          </div>
          {filteredAnalyses.length === 0 ? (
            <div style={{ padding: '16px 14px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
              No analyses match "{historyQuery}"
            </div>
          ) : filteredAnalyses.map(a => (
            <button key={a.id} className="ca-history-item" onClick={() => handleViewPast(a.id)}>
              <div className="ca-history-score">{a.overall_score ?? '—'}</div>
              <div className="ca-history-info">
                <div className="ca-history-date">{a.created_at ? new Date(a.created_at).toLocaleDateString() : 'N/A'}</div>
                <div className="ca-history-preview">{(a.transcript || '').slice(0, 80)}…</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {error && <div className="ca-error">{error}</div>}

      {/* Step 1: Choose input method */}
      {step === STEPS.UPLOAD && (
        <div className="ca-step">
          <div className="ca-step-header">
            <span className="ca-step-num">1</span>
            <span className="ca-step-title">How would you like to provide the call?</span>
          </div>

          {!inputMode && (
            <div className="ca-upload-choices ca-three-choices">
              <button className="ca-upload-choice" onClick={() => setInputMode('audio')}>
                <FileAudio size={24} />
                <span className="ca-choice-label">Upload or Record Audio</span>
                <span className="ca-choice-desc">Upload a recording file or use your mic to record live</span>
                <span className="ca-choice-formats">MP3, WAV, WebM, M4A, OGG — max 25MB</span>
              </button>
              <button className="ca-upload-choice" onClick={() => setInputMode('type')}>
                <PenLine size={24} />
                <span className="ca-choice-label">Type Call Details</span>
                <span className="ca-choice-desc">Describe what you said and what the customer said</span>
                <span className="ca-choice-formats">Best for: no recording available, or browser mic not working</span>
              </button>
            </div>
          )}

          {/* Audio upload/record mode */}
          {inputMode === 'audio' && (
            <div>
              <AudioUpload onTranscript={handleTranscript} />
              <button className="ca-back-link" onClick={() => setInputMode(null)}>← Back to options</button>
            </div>
          )}

          {/* Type call details mode */}
          {inputMode === 'type' && (
            <div className="ca-type-panel">
              <div className="ca-type-hint">
                <strong>Tip:</strong> For best analysis, label who said what. Use formats like:
                <div className="ca-type-examples">
                  <div><code>Sales Rep:</code> Hi, this is Alex from Acme Corp...</div>
                  <div><code>Customer:</code> Oh hi, I was actually looking for...</div>
                  <div className="ca-type-example-alt">Or describe the flow: "I opened by asking about their challenges. The customer said they struggle with X..."</div>
                </div>
              </div>
              <div style={{ position: 'relative' }}>
                <textarea
                  className="finp"
                  style={{ minHeight: 200, resize: 'vertical', width: '100%', fontSize: 14, lineHeight: 1.6, paddingRight: 44 }}
                  placeholder={`Sales Rep: Hi, this is [your name] from [company]...&#10;Customer: Oh hi, yes I was actually looking for...&#10;Sales Rep: Great! Can you tell me more about...&#10;Customer: Well, our main challenge is...`}
                  value={typedCall}
                  onChange={e => setTypedCall(e.target.value)}
                />
                <div style={{ position: 'absolute', top: 8, right: 8 }}>
                  <VoiceRecorder compact showLanguagePicker={false} onText={(text) => setTypedCall(text)} />
                </div>
              </div>
              <div className="ca-step-actions" style={{ marginTop: 12 }}>
                <button className="ps-btn ghost" onClick={() => { setInputMode(null); setTypedCall(''); }}>← Back</button>
                <button className="ps-btn pri" onClick={handleTypedSubmit} disabled={!typedCall.trim()}>Continue →</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Review transcript */}
      {step === STEPS.REVIEW && (
        <div className="ca-step">
          <div className="ca-step-header">
            <span className="ca-step-num">2</span>
            <span className="ca-step-title">Review & Edit Transcript</span>
          </div>

          {transcriptResult && transcriptResult.diarization && transcriptResult.segments?.length > 1 ? (
            <DiarizedTranscript
              result={transcriptResult}
              onInsert={(text) => setEditedTranscript(text)}
              onClose={() => {}}
            />
          ) : null}

          <div className="ca-edit-section">
            <label className="ca-edit-label">
              <strong>Edit transcript before analysis</strong> — add speaker labels or fix mistakes for better results:
            </label>
            <div style={{ position: 'relative' }}>
              <textarea
                className="finp"
                style={{ minHeight: 180, resize: 'vertical', width: '100%', fontSize: 13, lineHeight: 1.6, fontFamily: 'monospace', paddingRight: 44 }}
                value={editedTranscript}
                onChange={e => setEditedTranscript(e.target.value)}
                placeholder="Sales Rep: Hi, this is Alex from Acme Corp...
Customer: Oh hi, yes I was looking for..."
              />
              <div style={{ position: 'absolute', top: 8, right: 8 }}>
                <VoiceRecorder compact showLanguagePicker={false} onText={(text) => setEditedTranscript(text)} />
              </div>
            </div>
            <div className="ca-edit-hint">
              💡 <strong>For best results:</strong> Label who said what using <code>Sales Rep:</code> and <code>Customer:</code> prefixes. The AI uses these to understand the conversation flow.
            </div>
          </div>

          <div className="ca-script-select">
            <div className="ca-script-select-label">
              Which script were you following?
            </div>
            <select
              className="ps-select"
              value={selectedScriptId}
              onChange={e => setSelectedScriptId(e.target.value)}
            >
              <option value="">Select a script for detailed adherence scoring…</option>
              {scripts.map(s => (
                <option key={s.id} value={s.id}>
                  {s.method || ''} {s.call_type || ''} {s.duration || ''}min — {s.productName || 'Untitled'}
                </option>
              ))}
            </select>
            {!selectedScriptId && (
              <div className="ca-script-hint">
                ⚠️ No script selected — analysis will be general. Select a script for segment-by-segment adherence scoring.
              </div>
            )}
          </div>

          <div className="ca-script-select" style={{ marginTop: 10 }}>
            <div className="ca-script-select-label">
              Link to a product? <span className="ca-optional">(optional)</span>
            </div>
            <select
              className="ps-select"
              value={selectedProductId}
              onChange={e => setSelectedProductId(e.target.value)}
            >
              <option value="">No product</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="ca-step-actions">
            <button className="ps-btn ghost" onClick={() => { setStep(STEPS.UPLOAD); setTranscriptResult(null); setEditedTranscript(''); setTypedCall(''); setInputMode(null); }}>
              ← Start over
            </button>
            <button className="ps-btn pri" onClick={handleAnalyze} disabled={!editedTranscript.trim()}>
              Analyze Call
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Analyzing */}
      {step === STEPS.ANALYZING && (
        <div className="ca-step ca-analyzing">
          <div className="ca-step-header">
            <span className="ca-step-num">3</span>
            <span className="ca-step-title">Analyzing Call…</span>
          </div>
          <div className="ca-analyzing-box">
            <Loader2 size={32} className="ca-spin" />
            <div className="ca-analyzing-text">
              AI is analyzing your call for script adherence, missed opportunities, and coaching suggestions.
            </div>
            <div className="ca-analyzing-sub">This may take 15-30 seconds.</div>
          </div>
        </div>
      )}

      {/* Step 4: Results */}
      {step === STEPS.RESULTS && analysisResult && (
        <div className="ca-step">
          <div className="ca-step-header">
            <span className="ca-step-num">✓</span>
            <span className="ca-step-title">Analysis Results</span>
          </div>
          <AnalysisReport
            analysis={analysisResult}
            onReanalyze={handleReanalyze}
            scriptLabel={scriptLabel || undefined}
          />

          <div className="ca-step-actions">
            <button className="ps-btn ghost" onClick={() => { setStep(STEPS.UPLOAD); setTranscriptResult(null); setEditedTranscript(''); setAnalysisResult(null); setInputMode(null); }}>
              ← New Analysis
            </button>
          </div>
        </div>
      )}
    </div>
  )
}