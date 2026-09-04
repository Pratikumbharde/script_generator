import React, { useState, useEffect } from "react";
import {
  getAnalyticsOverview,
  getWinRateTrend,
  getTopMethods,
  getTeamActivity,
} from "../api/client.js";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  FileText,
  Phone,
  Trophy,
  Users,
  CalendarDays,
  Star,
  Zap,
  Lightbulb,
} from "lucide-react";

/* ============================================================
   Analytics Dashboard — Template A
   KPIs → Charts → Insights → Actions
   ============================================================ */

function KPICard({ label, value, sub, icon: Icon, trend }) {
  const trendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? "#1A7F5B" : trend < 0 ? "#B23237" : "var(--faint)";
  return (
    <div className="ci-kpi" style={{ textAlign: "left", padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div className="ci-kpi-label" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 0 }}>
          <Icon size={14} />
          {label}
        </div>
        {trend !== undefined && (
          <span style={{ fontSize: 11, fontWeight: 700, color: trendColor, display: "flex", alignItems: "center", gap: 3 }}>
            <trendIcon size={11} />
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="ci-kpi-value">{value}</div>
      {sub && <div className="ci-kpi-sublabel">{sub}</div>}
    </div>
  );
}

function InsightCard({ title, body, icon: Icon, color, bg }) {
  return (
    <div style={{ padding: 14, borderRadius: 12, background: bg || "#FBFCFE", border: "1px solid var(--line-soft)", display: "flex", alignItems: "flex-start", gap: 12 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color }}>
        <Icon size={16} />
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 3 }}>{title}</div>
        <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.5 }}>{body}</div>
      </div>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [trend, setTrend] = useState([]);
  const [topMethods, setTopMethods] = useState([]);
  const [teamActivity, setTeamActivity] = useState([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [ov, tr, tm, ta] = await Promise.all([
        getAnalyticsOverview(),
        getWinRateTrend(),
        getTopMethods(),
        getTeamActivity(),
      ]);
      setOverview(ov);
      setTrend(tr?.trend || []);
      setTopMethods(tm?.methods || []);
      setTeamActivity(ta?.members || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const outcomeMap = overview?.outcomes || [];
  const totalCalls = overview?.callsMade || 0;
  const totalScripts = overview?.scripts || 0;
  const wins = outcomeMap.find((o) => o.outcome === "won")?.c || 0;
  const losses = outcomeMap.find((o) => o.outcome === "lost")?.c || 0;
  const noDeals = outcomeMap.find((o) => o.outcome === "no_deal")?.c || 0;
  const totalOutcomes = wins + losses + noDeals;
  const winRate = totalOutcomes > 0 ? Math.round((wins / totalOutcomes) * 100) : 0;

  const trendData = [...trend].reverse();
  const maxTotal = Math.max(...trendData.map((t) => t.total || 0), 1);
  const maxTeamWins = Math.max(...teamActivity.map((m) => m.wins || 0), 1);

  /* Insights */
  const insights = [];
  if (winRate < 30 && totalOutcomes > 5) {
    insights.push({ title: "Win rate below 30%", body: "Your current win rate is low. Review losing calls in Coaching Insights to identify patterns.", icon: Lightbulb, color: "#B5720F", bg: "#FBF1DE" });
  }
  if (totalOutcomes > 0 && topMethods.length > 0) {
    const best = topMethods[0];
    insights.push({ title: `Best method: ${best.method}`, body: `This method has a ${best.total > 0 ? Math.round(((best.wins || 0) / best.total) * 100) : 0}% win rate across ${best.total} calls.`, icon: Trophy, color: "#1A7F5B", bg: "#EDF9F2" });
  }
  if (totalCalls === 0 && totalScripts > 0) {
    insights.push({ title: "Scripts not being used", body: `${totalScripts} scripts generated but no calls marked. Start using Call Studio and mark outcomes.`, icon: Phone, color: "#2B4CF0", bg: "#EAEEFE" });
  }

  return (
    <div className="ps-container">
      <div className="ps-header">
        <h1><BarChart3 size={24} style={{ marginRight: 10, verticalAlign: "-4px" }} />Analytics</h1>
        <p className="ps-muted">Understand what's happening across your sales conversations.</p>
      </div>

      {loading ? (
        <div className="loading-box">
          <div className="ring" />
          <div className="msg">Loading analytics…</div>
        </div>
      ) : (
        <>
          {/* KPI Bar */}
          <div className="ci-kpi-bar" style={{ marginBottom: 24 }}>
            <KPICard
              label="Scripts generated"
              value={totalScripts}
              sub={`${totalScripts > 0 ? Math.round((totalCalls / totalScripts) * 100) : 0}% usage rate`}
              icon={FileText}
            />
            <KPICard
              label="Calls made"
              value={totalCalls}
              sub={`${wins} wins · ${losses} losses`}
              icon={Phone}
            />
            <KPICard
              label="Win rate"
              value={`${winRate}%`}
              sub={`${totalOutcomes} outcomes logged`}
              icon={Target}
              trend={trendData.length >= 2 ? Math.round(((trendData[trendData.length - 1].wins / (trendData[trendData.length - 1].total || 1)) - (trendData[trendData.length - 2].wins / (trendData[trendData.length - 2].total || 1))) * 100) : undefined}
            />
            <KPICard
              label="Feedback logged"
              value={overview?.feedbackCount || 0}
              sub="Script ratings & notes"
              icon={Star}
            />
          </div>

          {/* Insights strip */}
          {insights.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 16, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <Zap size={18} color="var(--accent)" />
                Key insights
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {insights.map((ins, i) => (
                  <InsightCard key={i} {...ins} />
                ))}
              </div>
            </div>
          )}

          {/* Charts grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 18 }}>
            {/* Win rate trend */}
            <div className="chart-card">
              <div className="chart-h" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <TrendingUp size={16} color="var(--accent)" />
                Win Rate Trend
              </div>
              {trendData.length === 0 ? (
                <div className="ds-empty-state" style={{ padding: 32 }}>
                  <div className="icon" style={{ width: 40, height: 40 }}><CalendarDays size={18} /></div>
                  <h3 style={{ fontSize: 15 }}>Not enough data</h3>
                  <p style={{ fontSize: 13 }}>Save scripts and log outcomes to see trends over time.</p>
                </div>
              ) : (
                <div className="bar-chart">
                  {trendData.map((t, i) => {
                    const h = Math.round(((t.total || 0) / maxTotal) * 140);
                    const wr = t.total > 0 ? Math.round(((t.wins || 0) / t.total) * 100) : 0;
                    return (
                      <div key={i} className="bar-col">
                        <div className="bar-val">{wr}%</div>
                        <div className="bar-fill" style={{ height: `${Math.max(h, 4)}px`, background: wr >= 50 ? "var(--ok)" : wr >= 30 ? "var(--amber)" : "var(--aggressive)" }} />
                        <div className="bar-label">{t.month}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Top methods */}
            <div className="chart-card">
              <div className="chart-h" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Trophy size={16} color="var(--amber)" />
                Top Performing Methods
              </div>
              {topMethods.length === 0 ? (
                <div className="ds-empty-state" style={{ padding: 32 }}>
                  <div className="icon" style={{ width: 40, height: 40 }}><Target size={18} /></div>
                  <h3 style={{ fontSize: 15 }}>No data yet</h3>
                  <p style={{ fontSize: 13 }}>Generate scripts and mark outcomes to see which methods perform best.</p>
                </div>
              ) : (
                <div className="leaderboard">
                  {topMethods.map((m, i) => {
                    const wr = m.total > 0 ? Math.round(((m.wins || 0) / m.total) * 100) : 0;
                    return (
                      <div key={i} className="lb-row">
                        <div className={`lb-rank ${i < 3 ? "top" : ""}`}>{i + 1}</div>
                        <div className="lb-name">{m.method} · {m.call_type}</div>
                        <div className="lb-stat">{wr}% win rate</div>
                        <div className="lb-bar">
                          <div className="lb-bar-inner" style={{ width: `${wr}%`, background: wr >= 50 ? "var(--ok)" : wr >= 30 ? "var(--amber)" : "var(--aggressive)" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Team leaderboard */}
            <div className="chart-card">
              <div className="chart-h" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Users size={16} color="var(--accent)" />
                Team Activity
              </div>
              {teamActivity.length === 0 ? (
                <div className="ds-empty-state" style={{ padding: 32 }}>
                  <div className="icon" style={{ width: 40, height: 40 }}><Users size={18} /></div>
                  <h3 style={{ fontSize: 15 }}>No team data</h3>
                  <p style={{ fontSize: 13 }}>Invite team members to see a leaderboard.</p>
                </div>
              ) : (
                <div className="leaderboard">
                  {teamActivity.map((m, i) => {
                    const barW = maxTeamWins > 0 ? Math.round(((m.wins || 0) / maxTeamWins) * 100) : 0;
                    return (
                      <div key={i} className="lb-row">
                        <div className={`lb-rank ${i < 3 ? "top" : ""}`}>{i + 1}</div>
                        <div className="lb-name">{m.email}</div>
                        <div className="lb-stat">{m.scripts} scripts · {m.calls} calls · {m.wins} wins</div>
                        <div className="lb-bar">
                          <div className="lb-bar-inner" style={{ width: `${barW}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Outcome breakdown */}
            <div className="chart-card">
              <div className="chart-h" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Target size={16} color="var(--accent)" />
                Outcome Breakdown
              </div>
              {totalOutcomes === 0 ? (
                <div className="ds-empty-state" style={{ padding: 32 }}>
                  <div className="icon" style={{ width: 40, height: 40 }}><Target size={18} /></div>
                  <h3 style={{ fontSize: 15 }}>No outcomes yet</h3>
                  <p style={{ fontSize: 13 }}>Mark scripts as Won or Lost to see your outcome distribution.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 4 }}>
                  {[
                    { label: "Won", value: wins, color: "#1A7F5B", bg: "#EDF9F2" },
                    { label: "Lost", value: losses, color: "#B23237", bg: "#FDF2F2" },
                    { label: "No deal", value: noDeals, color: "#667180", bg: "#F4F6FA" },
                  ].map((item) => {
                    const pct = totalOutcomes > 0 ? Math.round((item.value / totalOutcomes) * 100) : 0;
                    return (
                      <div key={item.label}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</span>
                          <span style={{ fontSize: 12, color: "var(--faint)", fontWeight: 600 }}>{item.value} ({pct}%)</span>
                        </div>
                        <div style={{ height: 8, borderRadius: 4, background: "var(--line-soft)", overflow: "hidden" }}>
                          <div style={{ height: "100%", borderRadius: 4, width: `${pct}%`, background: item.color, transition: "width .6s ease", minWidth: 4 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
