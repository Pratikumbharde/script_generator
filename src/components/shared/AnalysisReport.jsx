import { useState } from 'react'
import {
  CheckCircle2, AlertTriangle, XCircle, Lightbulb,
  Target, TrendingUp, ArrowRight, ChevronDown, ChevronUp,
  ClipboardList, Sparkles, RotateCcw
} from 'lucide-react'

const SCORE_COLORS = {
  excellent: { bg: 'var(--say-bg)', color: 'var(--say)', border: 'var(--say-line)' },
  good: { bg: 'var(--say-bg)', color: 'var(--say)', border: 'var(--say-line)' },
  average: { bg: 'var(--amber-bg)', color: 'var(--amber)', border: 'var(--instr-line)' },
  poor: { bg: '#FEE2E2', color: '#DC2626', border: '#FCA5A5' },
}

function scoreTier(s) {
  if (s >= 80) return 'excellent'
  if (s >= 60) return 'good'
  if (s >= 40) return 'average'
  return 'poor'
}

function tierColors(tier) {
  return SCORE_COLORS[tier] || SCORE_COLORS.average
}

function ScoreCard({ label, score, icon }) {
  if (score == null) return null
  const tier = scoreTier(score)
  const c = tierColors(tier)
  return (
    <div className="ca-score-card" style={{ borderColor: c.border }}>
      <div className="ca-score-ring" style={{ background: c.bg }}>
        <span className="ca-score-num" style={{ color: c.color }}>{score}</span>
      </div>
      <div className="ca-score-label">{label}</div>
    </div>
  )
}

function AdherenceItem({ item }) {
  return (
    <div className={`ca-adh-item ${item.covered ? 'ca-adh-ok' : 'ca-adh-miss'}`}>
      <span className="ca-adh-icon">
        {item.covered ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
      </span>
      <div className="ca-adh-content">
        <div className="ca-adh-segment">{item.segment || item.label || 'Segment'}</div>
        {item.notes && <div className="ca-adh-notes">{item.notes}</div>}
      </div>
    </div>
  )
}

function OpportunityCard({ opp, index }) {
  return (
    <div className="ca-opp-card" key={index}>
      <div className="ca-opp-moment">
        <AlertTriangle size={14} />
        <span>{opp.moment || `Moment ${index + 1}`}</span>
      </div>
      <div className="ca-opp-context">{opp.context}</div>
      <div className="ca-opp-missed">
        <span className="ca-opp-label">Missed:</span> {opp.missed}
      </div>
      <div className="ca-opp-suggestion">
        <span className="ca-opp-label">Try instead:</span> {opp.suggestion}
      </div>
    </div>
  )
}

function ObjectionCard({ obj, index }) {
  const score = obj.score ?? null
  const tier = score != null ? scoreTier(score) : null
  const c = tier ? tierColors(tier) : null
  return (
    <div className="ca-obj-card" key={index}>
      <div className="ca-obj-header">
        <span className="ca-obj-objection">“{obj.objection}”</span>
        {score != null && (
          <span className="ca-obj-score" style={c ? { background: c.bg, color: c.color } : {}}>
            {score}/100
          </span>
        )}
      </div>
      <div className="ca-obj-response">
        <span className="ca-obj-label">Your response:</span> {obj.response}
      </div>
      <div className="ca-obj-better">
        <span className="ca-obj-label">Better approach:</span> {obj.better}
      </div>
    </div>
  )
}

/**
 * AnalysisReport — displays the results of a call analysis.
 *
 * Props:
 * - analysis — the analysis object from the API
 * - onReanalyze() — called when user wants to re-run analysis
 * - scriptLabel — optional name of the script compared against
 */
export default function AnalysisReport({ analysis, onReanalyze, scriptLabel }) {
  const [expanded, setExpanded] = useState({})

  const {
    overall_score, adherence_score, discovery_score, objection_score,
    closing_score, rapport_score, adherence_breakdown, missed_opportunities,
    objection_handling, strengths, improvements, coaching_tips, action_items,
    summary
  } = analysis || {}

  const parsed = (field) => {
    if (Array.isArray(field)) return field
    if (typeof field === 'string') { try { return JSON.parse(field) } catch { return [] } }
    return []
  }

  const breakdown = parsed(adherence_breakdown)
  const opportunities = parsed(missed_opportunities)
  const objections = parsed(objection_handling)
  const strengthsList = parsed(strengths)
  const improvementsList = parsed(improvements)
  const tipsList = parsed(coaching_tips)
  const actionsList = parsed(action_items)

  const toggle = (key) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))

  if (!analysis) return null

  return (
    <div className="ca-report">
      {/* Overall Score */}
      <div className="ca-report-section ca-overall-section">
        <div className="ca-overall-score">
          <div className="ca-overall-ring">
            <span className="ca-overall-num">{overall_score ?? '—'}</span>
            <span className="ca-overall-label">Overall</span>
          </div>
          {scriptLabel && <div className="ca-overall-script">vs <strong>{scriptLabel}</strong></div>}
        </div>
        <div className="ca-score-grid">
          <ScoreCard label="Adherence" score={adherence_score} />
          <ScoreCard label="Discovery" score={discovery_score} />
          <ScoreCard label="Objection Handling" score={objection_score} />
          <ScoreCard label="Closing" score={closing_score} />
          <ScoreCard label="Rapport" score={rapport_score} />
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="ca-report-section ca-summary-section">
          <h3 className="ca-section-title"><Sparkles size={16} /> Summary</h3>
          <p className="ca-summary-text">{summary}</p>
        </div>
      )}

      {/* Adherence Breakdown */}
      {breakdown.length > 0 && (
        <div className="ca-report-section">
          <button className="ca-section-toggle" onClick={() => toggle('adherence')}>
            <Target size={16} /> Script Adherence
            <span className="ca-toggle-count">{breakdown.filter(i => i.covered).length}/{breakdown.length} covered</span>
            {expanded.adherence ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {expanded.adherence && (
            <div className="ca-adh-list">
              {breakdown.map((item, i) => <AdherenceItem key={i} item={item} />)}
            </div>
          )}
        </div>
      )}

      {/* Missed Opportunities */}
      {opportunities.length > 0 && (
        <div className="ca-report-section">
          <button className="ca-section-toggle" onClick={() => toggle('opportunities')}>
            <AlertTriangle size={16} /> Missed Opportunities ({opportunities.length})
            {expanded.opportunities ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {expanded.opportunities && (
            <div className="ca-opp-list">
              {opportunities.map((opp, i) => <OpportunityCard key={i} opp={opp} index={i} />)}
            </div>
          )}
        </div>
      )}

      {/* Objection Handling */}
      {objections.length > 0 && (
        <div className="ca-report-section">
          <button className="ca-section-toggle" onClick={() => toggle('objections')}>
            <XCircle size={16} /> Objection Handling ({objections.length})
            {expanded.objections ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {expanded.objections && (
            <div className="ca-obj-list">
              {objections.map((obj, i) => <ObjectionCard key={i} obj={obj} index={i} />)}
            </div>
          )}
        </div>
      )}

      {/* Strengths */}
      {strengthsList.length > 0 && (
        <div className="ca-report-section">
          <button className="ca-section-toggle" onClick={() => toggle('strengths')}>
            <CheckCircle2 size={16} /> Strengths ({strengthsList.length})
            {expanded.strengths ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {expanded.strengths && (
            <ul className="ca-simple-list ca-strengths">
              {strengthsList.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          )}
        </div>
      )}

      {/* Improvements */}
      {improvementsList.length > 0 && (
        <div className="ca-report-section">
          <button className="ca-section-toggle" onClick={() => toggle('improvements')}>
            <TrendingUp size={16} /> Improvements ({improvementsList.length})
            {expanded.improvements ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {expanded.improvements && (
            <ul className="ca-simple-list ca-improvements">
              {improvementsList.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          )}
        </div>
      )}

      {/* Coaching Tips */}
      {tipsList.length > 0 && (
        <div className="ca-report-section">
          <button className="ca-section-toggle" onClick={() => toggle('tips')}>
            <Lightbulb size={16} /> Coaching Tips ({tipsList.length})
            {expanded.tips ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {expanded.tips && (
            <ul className="ca-simple-list ca-tips">
              {tipsList.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          )}
        </div>
      )}

      {/* Action Items */}
      {actionsList.length > 0 && (
        <div className="ca-report-section">
          <button className="ca-section-toggle" onClick={() => toggle('actions')}>
            <ClipboardList size={16} /> Action Items ({actionsList.length})
            {expanded.actions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {expanded.actions && (
            <ul className="ca-simple-list ca-actions">
              {actionsList.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
          )}
        </div>
      )}

      {/* Re-analyze */}
      {onReanalyze && (
        <div className="ca-report-actions">
          <button className="ca-reanalyze-btn" onClick={onReanalyze}>
            <RotateCcw size={16} /> Re-analyze with different script
          </button>
        </div>
      )}
    </div>
  )
}