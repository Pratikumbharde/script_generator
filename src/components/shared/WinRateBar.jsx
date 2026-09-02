/**
 * WinRateBar — horizontal bar chart for win rate display.
 *
 * Props:
 * - label — text label for the row
 * - winRate — percentage (0-100)
 * - wins — number of wins
 * - total — total calls
 * - color — bar color (default: accent)
 */
export default function WinRateBar({ label, winRate = 0, wins = 0, total = 0, color }) {
  const barColor = color || (winRate >= 70 ? 'var(--say)' : winRate >= 50 ? 'var(--amber)' : '#DC2626')

  return (
    <div className="si-bar-row">
      <div className="si-bar-label">{label}</div>
      <div className="si-bar-track">
        <div className="si-bar-fill" style={{ width: `${Math.min(winRate, 100)}%`, background: barColor }} />
      </div>
      <div className="si-bar-stats">
        <span className="si-bar-rate" style={{ color: barColor }}>{winRate}%</span>
        <span className="si-bar-detail">{wins}W / {total}</span>
      </div>
    </div>
  )
}