import { useState, useRef, useCallback, useEffect } from 'react'
import { Mic, Square, Loader } from 'lucide-react'
import { transcribeAudio } from '../../api/client'

const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'mr', label: 'Marathi' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'it', label: 'Italian' },
  { code: 'ja', label: 'Japanese' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ko', label: 'Korean' },
]

// Map our language codes to Web Speech API BCP-47 codes
const WEB_SPEECH_LANG_MAP = {
  en: 'en-US',
  hi: 'hi-IN',
  mr: 'mr-IN',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  pt: 'pt-BR',
  it: 'it-IT',
  ja: 'ja-JP',
  zh: 'zh-CN',
  ko: 'ko-KR',
}

/**
 * VoiceRecorder — reusable mic button that records audio and transcribes it.
 *
 * Two modes:
 * 1. Web Speech API (browser-native, zero backend) — used when available.
 *    - If onText callback is provided, streams text LIVE as you speak (dictation mode)
 *    - If only onTranscript is provided, delivers the complete result on stop
 * 2. Server-side fallback (Deepgram / VEXYL-STT / AI) — for uploaded files or browsers without Web Speech
 *
 * Props:
 * - onTranscript(result) — called with { text, confidence, language, diarization, segments }
 * - onText(text) — called with incremental text (live dictation into text fields)
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
  const [webSpeechSupported, setWebSpeechSupported] = useState(false)
  const mediaRef = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const recognitionRef = useRef(null)
  const finalTextRef = useRef('') // accumulated final text from Web Speech API
  const gotResultRef = useRef(false) // whether any onresult has fired this session
  const silenceCheckRef = useRef(null) // timeout that warns if no audio is detected
  const hangWatchdogRef = useRef(null) // timeout that force-aborts a session stuck with no events at all
  const wantListeningRef = useRef(false) // user intent — keep listening across Chrome's auto-restarts
  const restartAttemptsRef = useRef(0) // consecutive restarts with no recognized speech (caps a broken-mic retry loop)

  // Check Web Speech API support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    setWebSpeechSupported(!!SpeechRecognition)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      wantListeningRef.current = false
      if (timerRef.current) clearInterval(timerRef.current)
      if (silenceCheckRef.current) clearTimeout(silenceCheckRef.current)
      if (hangWatchdogRef.current) clearTimeout(hangWatchdogRef.current)
      if (mediaRef.current) mediaRef.current.getTracks().forEach(t => t.stop())
      if (recognitionRef.current) {
        try { recognitionRef.current.abort() } catch {}
      }
    }
  }, [])

  const stopCleanup = useCallback(() => {
    setRecording(false)
    setLoading(false)
    setDuration(0)
    wantListeningRef.current = false
    restartAttemptsRef.current = 0
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (silenceCheckRef.current) {
      clearTimeout(silenceCheckRef.current)
      silenceCheckRef.current = null
    }
    if (hangWatchdogRef.current) {
      clearTimeout(hangWatchdogRef.current)
      hangWatchdogRef.current = null
    }
    if (mediaRef.current) {
      mediaRef.current.getTracks().forEach(t => t.stop())
      mediaRef.current = null
    }
    recognitionRef.current = null
  }, [])

  // Starts one recognition attempt and arms two watchdogs against it:
  // - silenceCheck (6s): informational hint if nothing's been heard yet
  // - hangWatchdog (9s): some Chrome/Edge setups never fire ANY event at all
  //   (no result, no error, no end) when the speech service is unreachable —
  //   force-abort so onend's restart logic can take over instead of leaving
  //   the UI stuck on "Listening…" indefinitely
  const beginSession = useCallback((recognitionInstance) => {
    gotResultRef.current = false
    if (silenceCheckRef.current) clearTimeout(silenceCheckRef.current)
    if (hangWatchdogRef.current) clearTimeout(hangWatchdogRef.current)

    recognitionInstance.start()

    silenceCheckRef.current = setTimeout(() => {
      if (!gotResultRef.current && recognitionRef.current === recognitionInstance) {
        setError('No audio detected yet. If this keeps happening, check that your microphone isn\'t muted and that Windows allows this browser to access it (Settings > Privacy & security > Microphone).')
      }
    }, 6000)

    hangWatchdogRef.current = setTimeout(() => {
      if (!gotResultRef.current && recognitionRef.current === recognitionInstance) {
        console.warn('[WebSpeech] No response from the speech service after 9s — forcing a restart')
        try { recognitionInstance.abort() } catch {}
      }
    }, 9000)
  }, [])

  // ─── Web Speech API (browser-native, zero backend) ───
  // Chrome's "continuous" recognition mode frequently ends itself on its own
  // (firing 'no-speech' or 'aborted', then 'onend') even while the user is
  // still talking or has just gone quiet for a moment. Previously those
  // errors were silently ignored, which left the UI stuck on "Listening…"
  // forever with a dead recognition session underneath. Now we transparently
  // restart the session when that happens, so it behaves like real
  // continuous dictation instead of dying silently.
  const createRecognitionSession = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = WEB_SPEECH_LANG_MAP[language] || 'en-US'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
      gotResultRef.current = true
      restartAttemptsRef.current = 0
      if (silenceCheckRef.current) {
        clearTimeout(silenceCheckRef.current)
        silenceCheckRef.current = null
      }
      if (hangWatchdogRef.current) {
        clearTimeout(hangWatchdogRef.current)
        hangWatchdogRef.current = null
      }
      setError('') // clear any earlier "no audio detected" hint now that speech is coming through

      let interimTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTextRef.current += result[0].transcript + ' '
        } else {
          interimTranscript += result[0].transcript
        }
      }

      // Live dictation: stream text to onText as you speak
      const currentText = (finalTextRef.current + interimTranscript).trim()
      if (onText && currentText) {
        onText(currentText)
      }
    }

    recognition.onerror = (event) => {
      console.warn('[WebSpeech] Error:', event.error)
      if (event.error === 'not-allowed') {
        wantListeningRef.current = false
        setError('Microphone permission denied')
      } else if (event.error === 'audio-capture') {
        wantListeningRef.current = false
        setError('No microphone found. Check that a mic is connected and not disabled in Windows Sound settings.')
      }
      // 'no-speech', 'aborted', 'network' and other transient errors are
      // handled in onend below, which restarts the session if we're still
      // meant to be listening — don't stop the UI for those here.
    }

    recognition.onend = () => {
      if (wantListeningRef.current) {
        restartAttemptsRef.current += 1
        if (restartAttemptsRef.current > 6) {
          wantListeningRef.current = false
          setError('Speech recognition isn\'t responding. This is usually your internet connection (Chrome/Edge need to reach Google\'s speech service), or your microphone being muted/blocked in Windows Settings > Privacy & security > Microphone. Try again, or type instead.')
          stopCleanup()
          return
        }
        // Small delay avoids a tight restart loop if the mic is genuinely unavailable
        setTimeout(() => {
          if (!wantListeningRef.current) return
          try {
            const next = createRecognitionSession()
            recognitionRef.current = next
            beginSession(next)
          } catch (err) {
            console.warn('[WebSpeech] Restart failed:', err)
            wantListeningRef.current = false
            setError('Speech recognition stopped unexpectedly. Try again.')
            stopCleanup()
          }
        }, 250)
        return
      }

      // Intentional stop (or gave up above) — deliver final result
      const text = finalTextRef.current.trim()
      if (text && onTranscript) {
        onTranscript({
          text,
          confidence: 0.9,
          language,
          diarization: false,
          segments: [{ speaker: 'Speaker 1', text, start: 0, end: 0, confidence: 0.9 }],
        })
      }
      stopCleanup()
    }

    return recognition
  }, [language, onTranscript, onText, stopCleanup, beginSession])

  const startWebSpeech = useCallback(async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return false

    finalTextRef.current = ''
    restartAttemptsRef.current = 0
    wantListeningRef.current = true

    const recognition = createRecognitionSession()
    recognitionRef.current = recognition

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRef.current = stream

      const track = stream.getAudioTracks()[0]
      if (track && track.muted) {
        setError('Your microphone is muted at the system level — check Windows Settings > Privacy & security > Microphone and make sure "Let apps access your microphone" is on for this browser.')
      }

      beginSession(recognition)
      setRecording(true)
      setDuration(0)
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)

      // Auto-stop after 2 minutes
      setTimeout(() => {
        if (recognitionRef.current) {
          wantListeningRef.current = false
          recognitionRef.current.stop()
        }
      }, 120000)

      return true
    } catch (err) {
      console.warn('[WebSpeech] Failed to start:', err)
      wantListeningRef.current = false
      recognitionRef.current = null
      return false
    }
  }, [createRecognitionSession, beginSession])

  // ─── Server-side transcription fallback ───
  const startServerTranscription = useCallback(async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRef.current = stream

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
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
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
          setError(err.message || 'Transcription failed. Try using "Record Live" in Call Analysis for browser-based transcription.')
        } finally {
          setLoading(false)
          setDuration(0)
          setRecording(false)
          recorderRef.current = null
        }
      }

      recorder.start(1000)
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

  const startRecording = useCallback(async () => {
    setError('')
    finalTextRef.current = ''

    // Prefer Web Speech API (works without backend, streams live text)
    if (webSpeechSupported) {
      const started = await startWebSpeech()
      if (started) return
    }

    // Fallback to server-side transcription
    await startServerTranscription()
  }, [webSpeechSupported, startWebSpeech, startServerTranscription])

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      // Mark this as intentional so onend finalizes instead of auto-restarting
      wantListeningRef.current = false
      // Web Speech API — stop recognition (onend handler delivers final result)
      recognitionRef.current.stop()
      // Cleanup happens in onend/onerror handlers
      setRecording(false)
      setLoading(true) // Show "transcribing" while onend processes
    } else if (recorderRef.current?.state === 'recording') {
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
        {recording && <span className="vr-status">Listening…</span>}
      </div>

      {error && <div className="vr-error">{error}</div>}
    </div>
  )
}