import React, { useEffect, useRef, useState } from 'react'
import { analyzeSentiment } from '../api/client.js'

export default function SentimentPanel({ transcript, onPivot }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const lastAnalyzed = useRef('')

  useEffect(() => {
    if (!transcript || transcript === lastAnalyzed.current) return
    lastAnalyzed.current = transcript

    // Debounced analysis: only analyze when transcript grows meaningfully
    const timer = setTimeout(async () => {
      if (transcript.trim().length < 60) return
      setLoading(true)
      setError('')
      try {
        const res = await analyzeSentiment({ transcript, type: 'call' })
        if (res.session) {
          setSession(res.session)
          // surface latest pivot if any
          const pivots = JSON.parse(res.session.detected_pivots || '[]')
          if (pivots.length > 0 && onPivot) onPivot(pivots[pivots.length - 1])
        }
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [transcript])

  if (!transcript || transcript.trim().length < 40) return null

  const overall = session?.overall_sentiment ?? 0
  const history = JSON.parse(session?.sentiment_history || '[]')
  const pivots = JSON.parse(session?.detected_pivots || '[]')

  const sentimentLabel = overall >= 0.3 ? 'Positive' : overall >= -0.3 ? 'Neutral' : 'Negative'
  const sentimentColor = overall >= 0.3 ? '#22c55e' : overall >= -0.3 ? '#f59e0b' : '#ef4444'

  return (
    <div className="ps-card" style={{ marginTop: 16 }}>
      <div className="ps-flex-between">
        <h3 className="ps-section-title">📊 Live Sentiment</h3>
        {loading && <span className="ps-muted">Analyzing...</span>}
      </div>

      {error && <div className="ps-error">{error}</div>}

      {session && (
        <div>
          <div className="ps-flex" style={{ gap: 16, alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: sentimentColor }}>{sentimentLabel}</div>
            <div className="ps-muted">Score: {overall.toFixed(2)}</div>
          </div>

          {history.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div className="ps-muted" style={{ fontSize: 12, marginBottom: 6 }}>Sentiment over time</div>
              <div className="ps-flex" style={{ gap: 2, height: 40, alignItems: 'flex-end' }}>
                {history.map((h, i) => {
                  const pct = Math.max(0, Math.min(100, (h.sentiment + 1) * 50))
                  const color = h.sentiment >= 0.3 ? '#22c55e' : h.sentiment >= -0.3 ? '#f59e0b' : '#ef4444'
                  return (
                    <div
                      key={i}
                      title={`${h.time}: ${h.sentiment.toFixed(2)} — ${h.reason}`}
                      style={{
                        flex: 1,
                        height: `${pct}%`,
                        background: color,
                        borderRadius: 2,
                        minWidth: 4,
                        opacity: 0.85,
                      }}
                    />
                  )
                })}
              </div>
            </div>
          )}

          {pivots.length > 0 && (
            <div>
              <div className="ps-muted" style={{ fontSize: 12, marginBottom: 6 }}>💡 Suggested Pivots</div>
              <div className="ps-list">
                {pivots.slice(-3).map((p, i) => (
                  <div key={i} className="ps-callout" style={{ marginBottom: 8 }}>
                    <strong>{p.time}:</strong> {p.suggestion}
                    <div className="ps-muted" style={{ fontSize: 12, marginTop: 2 }}>Why: {p.reason}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
