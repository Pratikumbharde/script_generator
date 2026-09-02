import { useState, useEffect } from 'react'
import { RefreshCw, TrendingUp, Target, AlertTriangle, Lightbulb, CheckCircle2, ArrowRight, BarChart3 } from 'lucide-react'
import WinRateBar from './shared/WinRateBar.jsx'
import { getLearnedPatterns, getImprovementSuggestions, refreshPatterns } from '../api/client.js'

/**
 * SelfImprovementView — closed-loop script optimization dashboard.
 * Shows win rates, patterns, AI insights, and improvement suggestions.
 */
export default function SelfImprovementView() {
  const [patterns, setPatterns] = useState(null)
  const [suggestions, setSuggestions] = useState(null)
  const [loading, setLoading] = useState(true)
  const [suggesting, setSuggesting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadPatterns()
  }, [])

  const loadPatterns = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getLearnedPatterns()
      setPatterns(data)
    } catch (err) {
      setError(err.message || 'Failed to load patterns')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refreshPatterns()
      await loadPatterns()
    } catch (err) {
      setError(err.message || 'Refresh failed')
    } finally {
      setRefreshing(false)
    }
  }

  const handleSuggest = async (method, callType) => {
    setSuggesting(true)
    setError('')
    try {
      const data = await getImprovementSuggestions({ method, call_type: callType })
      setSuggestions(data)
    } catch (err) {
      setError(err.message || 'Failed to get suggestions')
    } finally {
      setSuggesting(false)
    }
  }

  if (loading) {
    return (
      <div className="si-view">
        <div className="si-top">
          <div>
            <div className="ps-eyebrow">Optimize</div>
            <div className="ps-title">Self-Improvement</div>
            <div className="ps-sub">Your scripts learn from every call outcome.</div>
          </div>
        </div>
        <div className="ps-card" style={{ padding: 40, textAlign: 'center' }}>
          <div className="loading-box"><div className="ring" /><div className="msg">Loading patterns…</div></div>
        </div>
      </div>
    )
  }

  const { methodStats = [], callTypeStats = [], insights = [], losingPatterns = [], topPerforming = [], totalScripts = 0, totalWins = 0, totalLosses = 0, overallWinRate = 0, minimumData = false } = patterns || {}

  return (
    <div className="si-view">
      <div className="si-top">
        <div>
          <div className="ps-eyebrow">Optimize</div>
          <div className="ps-title">Self-Improvement</div>
          <div className="ps-sub">Your scripts learn from every call outcome. Track patterns, discover what works, and let AI improve future scripts.</div>
        </div>
        <button className="ps-btn ghost" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw size={16} className={refreshing ? 'ca-spin' : ''} /> Refresh
        </button>
      </div>

      {error && <div className="ca-error">{error}</div>}

      {!minimumData ? (
        <div className="si-empty">
          <div className="si-empty-icon"><Target size={48} /></div>
          <div className="si-empty-title">Not enough data yet</div>
          <div className="si-empty-desc">
            You need at least 3 call outcomes to unlock pattern analysis.
            Mark your scripts as Won or Lost after each call to start building insights.
          </div>
          <div className="si-empty-stat">{totalScripts} call{totalScripts !== 1 ? 's' : ''} tracked so far</div>
        </div>
      ) : (
        <>
          {/* Overall Stats */}
          <div className="si-stats-row">
            <div className="si-stat-card">
              <div className="si-stat-num">{totalScripts}</div>
              <div className="si-stat-label">Total Calls</div>
            </div>
            <div className="si-stat-card">
              <div className="si-stat-num si-stat-wins">{totalWins}</div>
              <div className="si-stat-label">Wins</div>
            </div>
            <div className="si-stat-card">
              <div className="si-stat-num si-stat-losses">{totalLosses}</div>
              <div className="si-stat-label">Losses</div>
            </div>
            <div className="si-stat-card">
              <div className="si-stat-num" style={{ color: overallWinRate >= 70 ? 'var(--say)' : overallWinRate >= 50 ? 'var(--amber)' : '#DC2626' }}>{overallWinRate}%</div>
              <div className="si-stat-label">Win Rate</div>
            </div>
          </div>

          {/* Win Rate by Methodology */}
          {methodStats.length > 0 && (
            <div className="si-section">
              <h3 className="si-section-title"><BarChart3 size={16} /> Win Rate by Methodology</h3>
              <div className="si-bars">
                {methodStats
                  .sort((a, b) => b.winRate - a.winRate)
                  .map(m => <WinRateBar key={m.method} label={m.method} winRate={m.winRate} wins={m.wins} total={m.total} />)}
              </div>
            </div>
          )}

          {/* Win Rate by Call Type */}
          {callTypeStats.length > 0 && (
            <div className="si-section">
              <h3 className="si-section-title"><Target size={16} /> Win Rate by Call Type</h3>
              <div className="si-bars">
                {callTypeStats
                  .sort((a, b) => b.winRate - a.winRate)
                  .map(c => <WinRateBar key={c.callType} label={c.callType} winRate={c.winRate} wins={c.wins} total={c.total} />)}
              </div>
            </div>
          )}

          {/* AI Insights */}
          {insights.length > 0 && (
            <div className="si-section">
              <h3 className="si-section-title"><TrendingUp size={16} /> AI Insights</h3>
              <div className="si-insight-list">
                {insights.map((insight, i) => (
                  <div key={i} className="si-insight">
                    <CheckCircle2 size={16} className="si-insight-icon" />
                    <span>{insight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Losing Patterns */}
          {losingPatterns.length > 0 && (
            <div className="si-section">
              <h3 className="si-section-title"><AlertTriangle size={16} /> Losing Patterns</h3>
              <div className="si-pattern-list">
                {losingPatterns.map((p, i) => (
                  <div key={i} className="si-pattern-card">
                    <div className="si-pattern-text">{p.pattern}</div>
                    <div className="si-pattern-suggestion"><ArrowRight size={14} /> {p.suggestion}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Improvement Suggestions */}
          <div className="si-section">
            <h3 className="si-section-title"><Lightbulb size={16} /> Improvement Suggestions</h3>
            <div className="si-suggest-actions">
              {methodStats.slice(0, 3).map(m => (
                <button key={m.method} className="ps-btn ghost" onClick={() => handleSuggest(m.method)} disabled={suggesting}>
                  <Lightbulb size={14} /> Suggest for {m.method}
                </button>
              ))}
              <button className="ps-btn ghost" onClick={() => handleSuggest()} disabled={suggesting}>
                <Lightbulb size={14} /> General suggestions
              </button>
            </div>

            {suggesting && (
              <div className="si-suggest-loading">
                <div className="ca-upload-spinner" />
                <span>Analyzing your call data…</span>
              </div>
            )}

            {suggestions && suggestions.suggestions?.length > 0 && (
              <div className="si-suggest-list">
                {suggestions.suggestions.map((s, i) => (
                  <div key={i} className="si-suggest-card">
                    <div className="si-suggest-area">{s.area}</div>
                    <div className="si-suggest-current"><span className="si-suggest-label">Current:</span> {s.current}</div>
                    <div className="si-suggest-recommended"><span className="si-suggest-label">Recommended:</span> {s.recommended}</div>
                    <div className="si-suggest-why">{s.why}</div>
                    {s.confidence != null && (
                      <div className="si-suggest-confidence">Confidence: {Math.round(s.confidence * 100)}%</div>
                    )}
                  </div>
                ))}
                {suggestions.learnedAdjustments && (
                  <div className="si-adjustments">
                    <div className="si-adj-title">Learned Adjustments</div>
                    {suggestions.learnedAdjustments.optimalDuration && (
                      <div className="si-adj-item">Optimal call duration: <strong>{suggestions.learnedAdjustments.optimalDuration} min</strong></div>
                    )}
                    {suggestions.learnedAdjustments.recommendedPersona && (
                      <div className="si-adj-item">Recommended persona: <strong>{suggestions.learnedAdjustments.recommendedPersona}</strong></div>
                    )}
                    {suggestions.learnedAdjustments.keyObjections?.length > 0 && (
                      <div className="si-adj-item">Key objections to prepare: <strong>{suggestions.learnedAdjustments.keyObjections.join(', ')}</strong></div>
                    )}
                    {suggestions.learnedAdjustments.openingStyle && (
                      <div className="si-adj-item">Opening style: <strong>{suggestions.learnedAdjustments.openingStyle}</strong></div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Top Performing Scripts */}
          {topPerforming.length > 0 && (
            <div className="si-section">
              <h3 className="si-section-title"><CheckCircle2 size={16} /> Top Performing Scripts</h3>
              <div className="si-top-list">
                {topPerforming.slice(0, 5).map(s => (
                  <div key={s.id} className="si-top-item">
                    <span className="si-top-method">{s.method}</span>
                    <span className="si-top-type">{s.callType}</span>
                    <span className="si-top-dur">{s.duration}min</span>
                    <span className="si-top-badge">Won</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}