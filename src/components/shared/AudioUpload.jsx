import { useState, useRef, useCallback } from 'react'
import { Upload, Mic, FileAudio, X } from 'lucide-react'
import VoiceRecorder from './VoiceRecorder.jsx'
import { transcribeAudio } from '../../api/client.js'

const ACCEPTED_TYPES = [
  'audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/wav',
  'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'audio/m4a',
  'audio/webm;codecs=opus'
]
const ACCEPTED_EXT = '.mp3,.wav,.webm,.m4a,.ogg,.ogg,.mp4'
const MAX_SIZE_MB = 25

/**
 * AudioUpload — drag-drop / file picker / live recording for call analysis.
 *
 * Props:
 * - onTranscript(result) — called with { text, confidence, language, diarization, segments }
 * - onFile(file) — called when a file is selected (before transcription)
 * - language — default language code (default: 'en')
 */
export default function AudioUpload({ onTranscript, onFile, language = 'en' }) {
  const [mode, setMode] = useState(null) // null | 'upload' | 'record'
  const [dragOver, setDragOver] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const [progress, setProgress] = useState('')
  const fileRef = useRef(null)

  const handleFile = useCallback(async (file) => {
    if (!file) return
    setError('')

    // Validate type
    const ext = file.name.split('.').pop().toLowerCase()
    const validExts = ['mp3', 'wav', 'webm', 'm4a', 'ogg', 'mp4', 'mpeg']
    if (!validExts.includes(ext) && !ACCEPTED_TYPES.includes(file.type)) {
      setError(`Unsupported format: .${ext}. Accepted: ${validExts.join(', ')}`)
      return
    }

    // Validate size
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max: ${MAX_SIZE_MB}MB.`)
      return
    }

    setFileName(file.name)
    setProgress('Uploading…')
    onFile?.(file)

    // Transcribe
    setTranscribing(true)
    setProgress('Transcribing…')
    try {
      const result = await transcribeAudio(file, language)
      setProgress('')
      onTranscript?.(result)
    } catch (err) {
      const msg = err.message || 'Transcription failed'
      if (msg.includes('Deepgram') || msg.includes('503') || msg.includes('API key')) {
        setError('File transcription requires a Deepgram API key. Try "Record Live" or "Type Call Details" instead — no API key needed.')
      } else if (msg.includes('STT') || msg.includes('transcription')) {
        setError(msg + ' — Try "Record Live" instead, which uses browser speech recognition.')
      } else {
        setError(msg)
      }
      setProgress('')
    } finally {
      setTranscribing(false)
    }
  }, [language, onTranscript, onFile])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOver(false)
  }, [])

  const handleInputChange = useCallback((e) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleVoiceResult = useCallback((result) => {
    onTranscript?.(result)
  }, [onTranscript])

  const handleVoiceText = useCallback((text) => {
    // If VoiceRecorder gives just text, wrap as single-speaker result
    if (text && !onTranscript) return
  }, [onTranscript])

  // If currently transcribing, show progress
  if (transcribing) {
    return (
      <div className="ca-upload-zone ca-uploading">
        <div className="ca-upload-spinner" />
        <div className="ca-upload-progress">{progress || 'Transcribing audio…'}</div>
        {fileName && <div className="ca-upload-file">{fileName}</div>}
      </div>
    )
  }

  // Error state
  const errorBlock = error && (
    <div className="ca-upload-error">
      <X size={14} /> {error}
      <button className="ca-error-dismiss" onClick={() => setError('')}>Dismiss</button>
    </div>
  )

  return (
    <div className="ca-upload">
      {errorBlock}

      {/* Choose mode */}
      {!mode && (
        <div className="ca-upload-choices">
          <button className="ca-upload-choice" onClick={() => setMode('upload')}>
            <Upload size={24} />
            <span className="ca-choice-label">Upload Recording</span>
            <span className="ca-choice-desc">Drag & drop or browse for an audio file</span>
            <span className="ca-choice-formats">MP3, WAV, WebM, M4A, OGG — max {MAX_SIZE_MB}MB</span>
          </button>
          <button className="ca-upload-choice" onClick={() => setMode('record')}>
            <Mic size={24} />
            <span className="ca-choice-label">Record Live</span>
            <span className="ca-choice-desc">Use your microphone to record directly</span>
          </button>
        </div>
      )}

      {/* Upload mode */}
      {mode === 'upload' && (
        <div
          className={`ca-upload-zone ${dragOver ? 'ca-drag-over' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <FileAudio size={32} />
          <div className="ca-upload-text">Drop your audio file here</div>
          <div className="ca-upload-or">or</div>
          <button className="ca-upload-btn" onClick={() => fileRef.current?.click()}>
            Browse Files
          </button>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED_EXT}
            style={{ display: 'none' }}
            onChange={handleInputChange}
          />
          <div className="ca-upload-hint">Supported: MP3, WAV, WebM, M4A, OGG — max {MAX_SIZE_MB}MB</div>
          <button className="ca-back-link" onClick={() => setMode(null)}>← Back</button>
        </div>
      )}

      {/* Record mode */}
      {mode === 'record' && (
        <div className="ca-upload-zone ca-record-zone">
          <VoiceRecorder
            onTranscript={handleVoiceResult}
            onText={handleVoiceText}
            language={language}
            showLanguagePicker={true}
          />
          <button className="ca-back-link" onClick={() => setMode(null)}>← Back</button>
        </div>
      )}
    </div>
  )
}