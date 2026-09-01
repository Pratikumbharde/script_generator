import { useState } from 'react'
import { Copy, ClipboardPaste, User, X } from 'lucide-react'

const SPEAKER_LABELS = {
  0: 'Sales Rep',
  1: 'Prospect',
  2: 'Speaker 3',
  3: 'Speaker 4',
}

const SPEAKER_COLORS = {
  0: '#3b82f6',  // blue — Sales Rep
  1: '#f97316',  // orange — Prospect
  2: '#8b5cf6',  // purple
  3: '#10b981',  // green
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

/**
 * DiarizedTranscript — displays speaker-labeled transcript segments.
 *
 * Props:
 * - result — { text, confidence, language, diarization, segments }
 * - onInsert(text) — called when user clicks "Paste into field"
 * - onClose() — called when user dismisses the transcript
 */
export default function DiarizedTranscript({ result, onInsert, onClose }) {
  const [speakerLabels, setSpeakerLabels] = useState({})
  const [copied, setCopied] = useState(false)

  if (!result || !result.segments?.length) return null

  const { diarization, segments } = result

  // Get unique speakers in order of appearance
  const speakers = [...new Set(segments.map(s => s.speaker))]

  // Build label for a speaker
  const getLabel = (speaker) => {
    if (speakerLabels[speaker]) return speakerLabels[speaker]
    const idx = speakers.indexOf(speaker)
    return SPEAKER_LABELS[idx] || speaker
  }

  // Build flat text with speaker labels
  const flatText = segments
    .map(s => `${getLabel(s.speaker)}: ${s.text}`)
    .join('\n')

  const handleCopy = () => {
    navigator.clipboard.writeText(flatText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleInsert = () => {
    onInsert?.(flatText)
  }

  const colorFor = (speaker) => {
    const idx = speakers.indexOf(speaker)
    return SPEAKER_COLORS[idx % SPEAKER_COLORS.length] || '#6b7280'
  }

  return (
    <div className="dt-panel">
      <div className="dt-header">
        <span className="dt-title">Transcript</span>
        <div className="dt-actions">
          <button className="dt-action" onClick={handleCopy} title="Copy transcript">
            <Copy size={14} /> {copied ? 'Copied!' : 'Copy'}
          </button>
          {onInsert && (
            <button className="dt-action" onClick={handleInsert} title="Paste into field">
              <ClipboardPaste size={14} /> Insert
            </button>
          )}
          {onClose && (
            <button className="dt-action" onClick={onClose} title="Close">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {!diarization && (
        <div className="dt-notice">
          ⚠️ Speaker diarization is not available in fallback mode. All speech is shown as a single speaker.
        </div>
      )}

      {diarization && (
        <div className="dt-speaker-labels">
          {speakers.map(speaker => (
            <div key={speaker} className="dt-speaker-row">
              <span className="dt-speaker-dot" style={{ backgroundColor: colorFor(speaker) }} />
              <select
                className="dt-speaker-select"
                value={speakerLabels[speaker] || ''}
                onChange={e => setSpeakerLabels(prev => ({ ...prev, [speaker]: e.target.value }))}
              >
                <option value="">{getLabel(speaker)}</option>
                <option value="Sales Rep">Sales Rep</option>
                <option value="Prospect">Prospect</option>
                <option value="Manager">Manager</option>
              </select>
            </div>
          ))}
        </div>
      )}

      <div className="dt-segments">
        {segments.map((seg, i) => (
          <div key={i} className="dt-segment">
            <div className="dt-segment-meta">
              <span
                className="dt-segment-speaker"
                style={{ color: colorFor(seg.speaker) }}
              >
                {getLabel(seg.speaker)}
              </span>
              <span className="dt-segment-time">
                {formatTime(seg.start)} – {formatTime(seg.end)}
              </span>
              {seg.confidence != null && (
                <span className="dt-segment-conf">
                  {Math.round(seg.confidence * 100)}%
                </span>
              )}
            </div>
            <div className="dt-segment-text">{seg.text}</div>
          </div>
        ))}
      </div>
    </div>
  )
}