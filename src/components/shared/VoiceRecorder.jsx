import { useState, useRef, useCallback, useEffect } from 'react'
import { Mic, Square, Loader } from 'lucide-react'
import { transcribeAudio } from '../../api/client'

const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'mr', label: 'Marathi' },
]

/**
 * VoiceRecorder — reusable mic button that records audio and transcribes it.
 *
 * Props:
 * - onTranscript(result) — called with { text, confidence, language, diarization, segments }
 * - onText(text) — called with just the flat transcript text (convenience)
 * - language — default language code (default: 'en')
 * - showLanguagePicker — show language dropdown (default: true)
 * - compact — smaller button style (default: false)
 * - className — additional CSS class
 */
export default function VoiceRecorder({
  onTranscript,
  onText,
  language: defaultLang = 'en',
  showLanguagePicker = true,
  compact = false,
  className = '',
}) {
  const [language, setLanguage] = useState(defaultLang)
  const [recording, setRecording] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [duration, setDuration] = useState(0)
  const mediaRef = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (mediaRef.current) mediaRef.current.getTracks().forEach(t => t.stop())
    }
  }, [])

  const startRecording = useCallback(async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRef.current = stream

      // Prefer webm/opus, fall back to whatever's available
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : ''

      const options = mimeType ? { mimeType } : {}
      const recorder = new MediaRecorder(stream, options)
      recorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        // Stop timer
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
        // Stop mic tracks
        stream.getTracks().forEach(t => t.stop())
        mediaRef.current = null

        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        chunksRef.current = []

        if (blob.size < 1000) {
          setError('Recording too short — try again')
          setRecording(false)
          return
        }

        setLoading(true)
        try {
          const result = await transcribeAudio(blob, language)
          onTranscript?.(result)
          onText?.(result.text || '')
        } catch (err) {
          setError(err.message || 'Transcription failed')
        } finally {
          setLoading(false)
          setDuration(0)
        }
      }

      recorder.start(1000) // collect data every second
      setRecording(true)
      setDuration(0)
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)

      // Auto-stop after 60 seconds
      setTimeout(() => {
        if (recorderRef.current?.state === 'recording') {
          recorderRef.current.stop()
          setRecording(false)
        }
      }, 60000)

    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Microphone permission denied')
      } else {
        setError('Could not start recording: ' + err.message)
      }
    }
  }, [language, onTranscript, onText])

  const stopRecording = useCallback(() => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop()
      setRecording(false)
    }
  }, [])

  const toggleRecording = () => {
    if (recording) stopRecording()
    else startRecording()
  }

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className={`vr-container ${className}`}>
      <div className="vr-row">
        <button
          className={`vr-btn ${recording ? 'vr-btn-recording' : ''} ${compact ? 'vr-btn-compact' : ''}`}
          onClick={toggleRecording}
          disabled={loading}
          title={recording ? 'Stop recording' : 'Start recording'}
        >
          {loading ? <Loader size={compact ? 14 : 16} className="vr-spin" />
            : recording ? <Square size={compact ? 14 : 16} />
            : <Mic size={compact ? 14 : 16} />}
        </button>

        {recording && (
          <span className="vr-timer">{formatDuration(duration)}</span>
        )}

        {showLanguagePicker && !recording && !loading && (
          <select
            className="vr-lang"
            value={language}
            onChange={e => setLanguage(e.target.value)}
          >
            {SUPPORTED_LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        )}

        {loading && <span className="vr-status">Transcribing…</span>}
      </div>

      {error && <div className="vr-error">{error}</div>}
    </div>
  )
}