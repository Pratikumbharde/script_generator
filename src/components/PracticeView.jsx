import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { S, nameOf, parseScriptKey, callModel } from "../utils/helpers.js";
import { METHODS, CALL_TYPES, LANGUAGES } from "../data/constants.js";
import { RowSkeleton } from "./shared/Skeletons.jsx";
import LimitedTextarea from './shared/LimitedTextarea.jsx'
import {
  Mic, MicOff, RotateCcw, Trophy, TrendingUp, Target, ArrowRight,
  Search, LayoutGrid, List, SlidersHorizontal, X, Eye, Trash2,
  ChevronLeft, ChevronRight, MoreHorizontal, Inbox
} from "lucide-react";

/* ============================================================
   Practice Mode — Objection Drill
   Uses script's real objections first. AI fills gaps.
   Speech-to-text for voice input.
   Persisted history + session stats.
   ============================================================ */

const STORAGE_KEY = "ps_practice_history";
const STATS_KEY = "ps_practice_stats";

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveHistory(list) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 100))); } catch {}
}

function loadStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    return raw ? JSON.parse(raw) : { total: 0, best: 0, streak: 0, lastDate: null };
  } catch { return { total: 0, best: 0, streak: 0, lastDate: null }; }
}

function saveStats(s) {
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s)); } catch {}
}

function averageScore(scores) {
  return Math.round((scores.confidence + scores.coverage + scores.tone) / 3);
}

function scoreColor(s) {
  return s >= 80 ? "#1A7F5B" : s >= 60 ? "#B5720F" : "#B23237";
}

function scoreGrade(s) {
  if (s >= 85) return { label: "Excellent", color: "#1A7F5B" };
  if (s >= 70) return { label: "Good", color: "#0E8C7C" };
  if (s >= 55) return { label: "Fair", color: "#B5720F" };
  return { label: "Needs work", color: "#B23237" };
}

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function PracticeView({ products }) {
  const [scripts, setScripts] = useState(null);
  const [selectedScript, setSelectedScript] = useState(null);
  const [scenario, setScenario] = useState(null);
  const [response, setResponse] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState(null);
  const [reviewEntry, setReviewEntry] = useState(null);
  const [history, setHistory] = useState(() => loadHistory());
  const [stats, setStats] = useState(() => loadStats());
  const [error, setError] = useState("");
  const [loadingScripts, setLoadingScripts] = useState(true);

  /* ── History hub state ── */
  const [historyQuery, setHistoryQuery] = useState("");
  const [historyScoreFilter, setHistoryScoreFilter] = useState("all");
  const [historyViewMode, setHistoryViewMode] = useState(() => {
    try { return localStorage.getItem("ps_practice_view") || "cards"; } catch { return "cards"; }
  });
  const [historyPage, setHistoryPage] = useState(1);
  const [historySelectedIds, setHistorySelectedIds] = useState(new Set());
  const [historyShowFilters, setHistoryShowFilters] = useState(false);
  const historyPageSize = historyViewMode === "cards" ? 12 : 10;

  const textareaRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef(null);
  const abortRef = useRef(false);

  /* Load scripts */
  useEffect(() => {
    loadScripts();
  }, []);

  /* Detect speech support */
  useEffect(() => {
    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
      setSpeechSupported(true);
    }
  }, []);

  /* Cleanup speech on unmount */
  useEffect(() => {
    return () => {
      abortRef.current = true;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
    };
  }, []);

  const loadScripts = async () => {
    setLoadingScripts(true);
    try {
      const keys = await S.listKeys("pscript:");
      const out = [];
      for (const k of keys) {
        try {
          const rec = await S.get(k);
          if (!rec || !rec.data) continue;
          const meta = rec.meta || parseScriptKey(k);
          const productName = meta.productName || products.find((p) => String(p.id) === String(meta.productId))?.name || "Unknown";
          out.push({
            key: k,
            savedAt: rec.savedAt || 0,
            meta,
            data: rec.data,
            productName,
            objections: rec.data?.objections || [],
          });
        } catch {}
      }
      out.sort((a, b) => b.savedAt - a.savedAt);
      setScripts(out);
    } catch (e) {
      setError("Failed to load scripts: " + (e.message || "try again"));
    } finally {
      setLoadingScripts(false);
    }
  };

  /* ── History hub derived data ── */
  const historyGradeMeta = (avg) => {
    if (avg >= 85) return { label: "Excellent", cls: "ok", color: "#1A7F5B" };
    if (avg >= 70) return { label: "Good", cls: "accent", color: "#0E8C7C" };
    if (avg >= 55) return { label: "Fair", cls: "warn", color: "#B5720F" };
    return { label: "Needs work", cls: "bad", color: "#B23237" };
  };

  const filteredHistory = useMemo(() => {
    let list = history;
    const q = historyQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((h) =>
        (h.product || "").toLowerCase().includes(q) ||
        (h.buyerLine || "").toLowerCase().includes(q)
      );
    }
    if (historyScoreFilter !== "all") {
      list = list.filter((h) => {
        const avg = averageScore(h.scores);
        const g = historyGradeMeta(avg);
        return g.label.toLowerCase().replace(/\s+/g, "_") === historyScoreFilter;
      });
    }
    return list;
  }, [history, historyQuery, historyScoreFilter]);

  const historyTotalPages = Math.max(1, Math.ceil(filteredHistory.length / historyPageSize));
  const historyPaginated = filteredHistory.slice((historyPage - 1) * historyPageSize, historyPage * historyPageSize);

  const toggleHistoryView = (mode) => {
    setHistoryViewMode(mode);
    try { localStorage.setItem("ps_practice_view", mode); } catch { /* noop */ }
  };

  const historySelectAll = (checked) => {
    if (checked) {
      const ids = new Set(historyPaginated.map((h) => h.id));
      setHistorySelectedIds((prev) => new Set([...prev, ...ids]));
    } else {
      const ids = new Set(historyPaginated.map((h) => h.id));
      setHistorySelectedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
    }
  };

  const historyToggleSelect = (id) => {
    setHistorySelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const historyDelete = (id) => {
    const entry = history.find((h) => h.id === id);
    if (!entry) return;
    const next = history.filter((h) => h.id !== id);
    setHistory(next);
    saveHistory(next);
    setHistorySelectedIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
    setStats((prev) => {
      const remaining = next;
      const best = remaining.length > 0 ? Math.max(...remaining.map((h) => averageScore(h.scores))) : 0;
      const updated = { ...prev, total: prev.total - 1, best };
      saveStats(updated);
      return updated;
    });
  };

  const historyBulkDelete = () => {
    const ids = historySelectedIds;
    if (ids.size === 0) return;
    const next = history.filter((h) => !ids.has(h.id));
    setHistory(next);
    saveHistory(next);
    setHistorySelectedIds(new Set());
    setStats((prev) => {
      const best = next.length > 0 ? Math.max(...next.map((h) => averageScore(h.scores))) : 0;
      const updated = { ...prev, total: Math.max(0, prev.total - ids.size), best };
      saveStats(updated);
      return updated;
    });
  };

  const fmtHistoryDate = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  };

  /* ── Speech-to-text ── */
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    if (isListening) {
      stopListening();
      return;
    }

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let finalChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalChunk += transcript + " ";
        }
      }
      if (finalChunk) {
        const clean = finalChunk.trim();
        setResponse((prev) => prev + (prev ? " " : "") + clean);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted") return;
      console.error("Speech error:", event.error);
      setIsListening(false);
      recognitionRef.current = null;
      if (event.error === "not-allowed") {
        setError("Microphone access denied. Allow mic permission and try again.");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
      setError("");
    } catch (e) {
      console.error("Failed to start speech:", e);
    }
  }, [isListening, stopListening]);

  /* ── Scenario generation ── */
  const pickScenario = async (scriptRec) => {
    setSelectedScript(scriptRec);
    setScenario(null);
    setResult(null);
    setResponse("");
    setError("");
    abortRef.current = false;

    const objections = scriptRec.objections || [];

    /* Strategy 1: use a real objection from the script */
    if (objections.length > 0) {
      const pick = objections[Math.floor(Math.random() * objections.length)];
      if (pick?.objection) {
        setScenario({
          buyerLine: pick.objection.trim().slice(0, 400),
          recommendedResponse: (pick.response || "").trim().slice(0, 600),
          timestamp: Date.now(),
          source: "script",
        });
        return;
      }
    }

    /* Strategy 2: AI generates one tailored to the script */
    try {
      const opening = scriptRec.data?.opening || "";
      const SYS = "You are a skeptical buyer in a sales call. You challenge the rep with a realistic, sharp objection. Keep it to 1-2 sentences.";
      const prompt = `Product: ${scriptRec.productName}. Method: ${nameOf(METHODS, scriptRec.meta.method)}. Call type: ${nameOf(CALL_TYPES, scriptRec.meta.callType)}.

Script opening: "${opening}"

Generate one realistic buyer objection the rep would hear. Be specific to the product and context.`;
      const ai = await callModel(SYS, prompt);
      if (abortRef.current) return;
      const text = (ai.message?.content || ai.content || "").trim();
      const clean = text.replace(/^["'"]+|["'"]+$/g, "").slice(0, 400);
      setScenario({
        buyerLine: clean,
        recommendedResponse: "",
        timestamp: Date.now(),
        source: "ai",
      });
    } catch (e) {
      if (!abortRef.current) {
        setError("Failed to generate scenario: " + (e.message || "try again"));
      }
    }
  };

  /* ── Submit & evaluate ── */
  const submitResponse = async () => {
    if (!response.trim() || !scenario || !selectedScript) return;
    setEvaluating(true);
    setError("");
    stopListening();

    try {
      const SYS = `You are an elite sales coach evaluating a rep's response to a buyer objection.
Score on three dimensions (0-100):
- Confidence: Does the rep sound assured and in control?
- Coverage: Did they address the core concern fully?
- Tone: Was the delivery appropriate (not defensive, not pushy)?
Return ONLY JSON in this exact shape:
{"scoreConfidence":0-100,"scoreCoverage":0-100,"scoreTone":0-100,"feedback":"one paragraph of actionable advice","strength":"what they did well","improvement":"one thing to fix next time"}`;
      const prompt = `Product: ${selectedScript.productName}
Method: ${nameOf(METHODS, selectedScript.meta.method)}
Buyer objection: "${scenario.buyerLine}"
Rep's response: "${response.trim()}"

Evaluate the response.`;
      const ai = await callModel(SYS, prompt);
      const text = typeof ai === "string" ? ai : (ai?.message?.content || ai?.content || "");

      /* Try to extract JSON from the AI response */
      let parsed = null;
      try {
        const clean = text.replace(/\`\`\`json/gi, "").replace(/\`\`\`/g, "").trim();
        const jsonStart = clean.indexOf("{");
        const jsonEnd = clean.lastIndexOf("}");
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          parsed = JSON.parse(clean.slice(jsonStart, jsonEnd + 1));
        }
      } catch (_) { /* noop */ }

      /* Fallback: regex-extract scores if JSON didn't parse */
      if (!parsed || typeof parsed.scoreConfidence !== "number") {
        const confMatch = text.match(/confidence[:\s]+(\d+)/i);
        const covMatch = text.match(/coverage[:\s]+(\d+)/i);
        const toneMatch = text.match(/tone[:\s]+(\d+)/i);
        const anyNum = text.match(/\b(\d{1,3})\b/g);
        parsed = {
          scoreConfidence: confMatch ? parseInt(confMatch[1], 10) : (anyNum ? parseInt(anyNum[0], 10) : 50),
          scoreCoverage: covMatch ? parseInt(covMatch[1], 10) : (anyNum ? parseInt(anyNum[Math.min(1, anyNum.length - 1)], 10) : 50),
          scoreTone: toneMatch ? parseInt(toneMatch[1], 10) : (anyNum ? parseInt(anyNum[Math.min(2, anyNum.length - 1)], 10) : 50),
          feedback: text.slice(0, 600),
          strength: "",
          improvement: "",
        };
      }

      const entry = {
        id: Date.now(),
        product: selectedScript.productName,
        buyerLine: scenario.buyerLine,
        response: response.trim(),
        recommendedResponse: scenario.recommendedResponse || "",
        scores: {
          confidence: Math.min(100, Math.max(0, parsed.scoreConfidence || 0)),
          coverage: Math.min(100, Math.max(0, parsed.scoreCoverage || 0)),
          tone: Math.min(100, Math.max(0, parsed.scoreTone || 0)),
        },
        feedback: parsed.feedback || "",
        strength: parsed.strength || "",
        improvement: parsed.improvement || "",
        createdAt: Date.now(),
      };

      /* Update stats */
      const overall = averageScore(entry.scores);
      setStats((prev) => {
        const today = new Date().toDateString();
        const last = prev.lastDate ? new Date(prev.lastDate).toDateString() : null;
        const newStreak = last === today ? prev.streak : last === new Date(Date.now() - 864e5).toDateString() ? prev.streak + 1 : 1;
        const next = {
          total: prev.total + 1,
          best: Math.max(prev.best, overall),
          streak: newStreak,
          lastDate: Date.now(),
        };
        saveStats(next);
        return next;
      });

      setResult(entry);
      setHistory((h) => {
        const next = [entry, ...h].slice(0, 100);
        saveHistory(next);
        return next;
      });
      setResponse("");
    } catch (e) {
      setError("Evaluation failed: " + (e.message || "try again"));
    } finally {
      setEvaluating(false);
    }
  };

  /* ── Render helpers ── */
  const grade = result ? scoreGrade(averageScore(result.scores)) : null;
  const wc = wordCount(response);
  const wcHint = wc === 0 ? "" : wc < 15 ? "Short — add detail" : wc > 120 ? "Long — be concise" : "";

  /* Review a past session */
  const ReviewResult = ({ entry }) => {
    const g = scoreGrade(averageScore(entry.scores));
    return (
      <>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "18px 20px",
            background: g ? `${g.color}10` : "#F2F5FA",
            border: `1.5px solid ${g?.color || "var(--line)"}`,
            borderRadius: 12,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: g?.color || "var(--accent)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Space Grotesk'",
              fontWeight: 700,
              fontSize: 22,
              flexShrink: 0,
            }}
          >
            {averageScore(entry.scores)}
          </div>
          <div>
            <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 18, color: g?.color || "var(--ink)" }}>
              {g?.label || "Scored"}
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
              {new Date(entry.createdAt).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="practice-scenario" style={{ marginBottom: 14 }}>
          <div className="practice-label">Buyer said:</div>
          <div className="practice-buyer">"{entry.buyerLine}"</div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label className="flab">Your response<span className="req">*</span></label>
          <div
            style={{
              padding: 14,
              background: "#F6F8FB",
              borderRadius: 10,
              fontSize: 14,
              lineHeight: 1.6,
              border: "1px solid var(--line-soft)",
              color: "var(--ink)",
            }}
          >
            {entry.response}
          </div>
        </div>

        <div className="practice-scores">
          {[
            { label: "Confidence", value: entry.scores.confidence, icon: TrendingUp },
            { label: "Coverage", value: entry.scores.coverage, icon: Target },
            { label: "Tone", value: entry.scores.tone, icon: Trophy },
          ].map((s) => (
            <div key={s.label} className="practice-score">
              <div className="ps-label" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <s.icon size={13} />
                {s.label}
              </div>
              <div className="ps-bar-wrap">
                <div className="ps-bar" style={{ width: `${s.value}%`, background: scoreColor(s.value) }} />
              </div>
              <div className="ps-val" style={{ color: scoreColor(s.value) }}>{s.value}</div>
            </div>
          ))}
          <div className="practice-total">
            <div className="ps-label">Overall</div>
            <div className="ps-total-val" style={{ color: scoreColor(averageScore(entry.scores)) }}>
              {averageScore(entry.scores)}
            </div>
          </div>
        </div>

        {entry.strength && (
          <div
            style={{
              background: "#EDF9F2",
              border: "1.5px solid #B9E1CA",
              borderRadius: 10,
              padding: "14px 16px",
              marginBottom: 12,
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            <div style={{ fontWeight: 700, color: "#1A7F5B", marginBottom: 5, display: "flex", alignItems: "center", gap: 6 }}>
              <TrendingUp size={15} /> Strength
            </div>
            {entry.strength}
          </div>
        )}

        {entry.improvement && (
          <div
            style={{
              background: "#FBF1DE",
              border: "1.5px solid #F0D9A6",
              borderRadius: 10,
              padding: "14px 16px",
              marginBottom: 12,
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            <div style={{ fontWeight: 700, color: "#9A5B08", marginBottom: 5, display: "flex", alignItems: "center", gap: 6 }}>
              <Target size={15} /> Fix next time
            </div>
            {entry.improvement}
          </div>
        )}

        {entry.recommendedResponse && (
          <div
            style={{
              background: "#EAEEFE",
              border: "1.5px solid #C4D0F9",
              borderRadius: 10,
              padding: "14px 16px",
              marginBottom: 12,
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            <div style={{ fontWeight: 700, color: "var(--accent-ink)", marginBottom: 5, display: "flex", alignItems: "center", gap: 6 }}>
              <ArrowRight size={15} /> Recommended response
            </div>
            {entry.recommendedResponse}
          </div>
        )}

        {entry.feedback && (
          <div
            style={{
              background: "#F2F5FA",
              borderRadius: 10,
              padding: "14px 16px",
              fontSize: 14,
              lineHeight: 1.65,
              color: "var(--muted)",
            }}
          >
            <div style={{ fontWeight: 700, color: "var(--ink)", marginBottom: 5 }}>💬 Coach feedback</div>
            {entry.feedback}
          </div>
        )}
      </>
    );
  };

  if (loadingScripts || scripts === null) {
    return (
      <>
        <div className="ps-top">
          <div>
            <div className="ps-eyebrow">Practice</div>
            <div className="ps-title"><Target size={22} style={{ marginRight: 8, verticalAlign: "-3px" }} />Objection Drill</div>
            <div className="ps-sub">Practice responding to buyer objections and get AI scoring.</div>
          </div>
        </div>
        <div className="ps-body"><RowSkeleton count={5} /></div>
      </>
    );
  }

  return (
    <>
      <div className="ps-top">
        <div>
          <div className="ps-eyebrow">Practice</div>
          <div className="ps-title"><Target size={22} style={{ marginRight: 8, verticalAlign: "-3px" }} />Objection Drill</div>
          <div className="ps-sub">Practice responding to buyer objections and get AI scoring.</div>
        </div>
        {stats.total > 0 && (
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--muted)" }}>Best Score</div>
              <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 22, color: scoreColor(stats.best) }}>{stats.best}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--muted)" }}>Drills</div>
              <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 22 }}>{stats.total}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--muted)" }}>Streak</div>
              <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 22, color: stats.streak >= 3 ? "#B5720F" : "var(--ink)" }}>{stats.streak}🔥</div>
            </div>
          </div>
        )}
      </div>

      <div className="ps-body">
        {/* Script selector */}
        {!selectedScript && !reviewEntry && (
          <>
            {scripts.length === 0 ? (
              <div className="ps-empty">
                <div className="big">No scripts yet</div>
                <p>Generate a script in the Call Studio first, then come back here to practice handling objections.</p>
              </div>
            ) : (
              <>
                <div className="ps-grid" style={{ marginBottom: 24 }}>
                  {scripts.map((s) => (
                    <div key={s.key} className="pcard" onClick={() => pickScenario(s)}>
                      <div className="cat">{s.productName}</div>
                      <div className="nm">{nameOf(METHODS, s.meta.method)} · {nameOf(CALL_TYPES, s.meta.callType)} · {s.meta.duration}m</div>
                      <div className="ln">
                        🗣 {nameOf(LANGUAGES, s.meta.language)} · {s.data?.opening?.slice(0, 80) || ""}…
                      </div>
                      <div className="foot">
                        {s.objections.length > 0 ? (
                          <span>{s.objections.length} objection{s.objections.length > 1 ? "s" : ""} ready</span>
                        ) : (
                          <span>AI-generated scenario</span>
                        )}
                        <span style={{ marginLeft: "auto" }}>Click to practice →</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── History Hub ── */}
            {history.length > 0 && (
              <div style={{ marginTop: 32 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                  Recent sessions
                  <span className="chip" style={{ fontSize: 11 }}>{filteredHistory.length}</span>
                </div>

                {/* Toolbar */}
                <div className="dt-header">
                  <div className="dt-search">
                    <Search size={15} className="dt-search-icon" />
                    <input
                      placeholder="Search sessions by product or buyer line…"
                      value={historyQuery}
                      onChange={(e) => { setHistoryQuery(e.target.value); setHistoryPage(1); }}
                    />
                    {historyQuery && <button className="dt-search-clear" onClick={() => { setHistoryQuery(""); setHistoryPage(1); }}><X size={13} /></button>}
                  </div>
                  <button className={`dt-filter-btn ${historyScoreFilter !== "all" ? "on" : ""}`} onClick={() => setHistoryShowFilters((s) => !s)}>
                    <SlidersHorizontal size={14} /> Filters {historyScoreFilter !== "all" && <span className="count">1</span>}
                  </button>
                  <div className="dt-view-toggle">
                    <button className={historyViewMode === "cards" ? "on" : ""} onClick={() => toggleHistoryView("cards")} title="Cards"><LayoutGrid size={14} /> Cards</button>
                    <button className={historyViewMode === "list" ? "on" : ""} onClick={() => toggleHistoryView("list")} title="List"><List size={14} /> List</button>
                  </div>
                </div>

                {/* Filter panel */}
                {historyShowFilters && (
                  <div className="dt-filter-panel" style={{ marginBottom: 14 }}>
                    <div className="dt-filter-group">
                      <label>Score grade</label>
                      <select
                        className="fsel"
                        value={historyScoreFilter}
                        onChange={(e) => { setHistoryScoreFilter(e.target.value); setHistoryPage(1); }}
                      >
                        <option value="all">All scores</option>
                        <option value="excellent">Excellent (85+)</option>
                        <option value="good">Good (70–84)</option>
                        <option value="fair">Fair (55–69)</option>
                        <option value="needs_work">Needs work (below 55)</option>
                      </select>
                    </div>
                    <div className="dt-filter-actions">
                      <button className="ps-btn ghost sm" onClick={() => { setHistoryScoreFilter("all"); setHistoryPage(1); }}><X size={14} /> Clear</button>
                      <button className="ps-btn pri sm" onClick={() => setHistoryShowFilters(false)}>Done</button>
                    </div>
                  </div>
                )}

                {/* Bulk actions */}
                {historySelectedIds.size > 0 && (
                  <div className="dt-bulk">
                    <span className="dt-bulk-count">{historySelectedIds.size} selected</span>
                    <div className="dt-bulk-actions">
                      <button className="dt-bulk-btn danger" onClick={historyBulkDelete}>
                        <Trash2 size={14} /> Delete selected
                      </button>
                    </div>
                  </div>
                )}

                {/* Empty search state */}
                {filteredHistory.length === 0 && (
                  <div className="ds-empty-state">
                    <div className="icon"><Inbox size={24} /></div>
                    <h3>No sessions match</h3>
                    <p>Try adjusting your search or filters.</p>
                    <div className="actions">
                      <button className="ds-btn-ter" onClick={() => { setHistoryQuery(""); setHistoryScoreFilter("all"); setHistoryPage(1); }}>Clear filters</button>
                    </div>
                  </div>
                )}

                {/* Card view */}
                {historyViewMode === "cards" && filteredHistory.length > 0 && (
                  <div className="epc-grid" style={{ marginBottom: 16 }}>
                    {historyPaginated.map((h) => {
                      const avg = averageScore(h.scores);
                      const g = historyGradeMeta(avg);
                      return (
                        <div key={h.id} className="epc-card" style={{ position: "relative" }}>
                          <div className="epc-top">
                            <span className="chip n" style={{ fontSize: 11 }}>{h.product || "Unknown"}</span>
                            <span className={`ds-status ${g.cls}`}><span className="ds-status-dot" />{g.label}</span>
                          </div>
                          <div className="epc-name" style={{ fontSize: 15 }} title={h.buyerLine}>"{h.buyerLine}"</div>
                          <div className="epc-desc" style={{ WebkitLineClamp: 2, marginTop: 4 }}>{h.response}</div>
                          <div className="epc-meta" style={{ marginTop: "auto", paddingTop: 10 }}>
                            <span className="epc-meta-item"><b style={{ color: g.color }}>{avg}</b> overall</span>
                            <span className="epc-meta-item" style={{ marginLeft: "auto" }}>{fmtHistoryDate(h.createdAt)}</span>
                          </div>
                          <div className="epc-actions">
                            <button className="epc-act-open" onClick={(e) => { e.stopPropagation(); setReviewEntry(h); }}><Eye size={13} /> View</button>
                            <button className="epc-act-del" onClick={(e) => { e.stopPropagation(); historyDelete(h.id); }}><Trash2 size={13} /> Delete</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Table view */}
                {historyViewMode === "list" && filteredHistory.length > 0 && (
                  <div className="dt-table-wrap" style={{ marginBottom: 16 }}>
                    <table className="dt-table">
                      <thead>
                        <tr>
                          <th style={{ width: "40px", padding: "10px 8px" }}>
                            <input
                              type="checkbox"
                              className="ck"
                              checked={historyPaginated.length > 0 && historyPaginated.every((h) => historySelectedIds.has(h.id))}
                              onChange={(e) => historySelectAll(e.target.checked)}
                              style={{ margin: 0 }}
                            />
                          </th>
                          <th style={{ width: "24%" }}>Product</th>
                          <th style={{ width: "38%" }}>Buyer Line</th>
                          <th style={{ width: "14%" }}>Score</th>
                          <th style={{ width: "14%" }}>Date</th>
                          <th style={{ width: "10%" }} />
                        </tr>
                      </thead>
                      <tbody>
                        {historyPaginated.map((h) => {
                          const avg = averageScore(h.scores);
                          const g = historyGradeMeta(avg);
                          const sel = historySelectedIds.has(h.id);
                          return (
                            <tr
                              key={h.id}
                              className={sel ? "sel" : ""}
                              onClick={() => setReviewEntry(h)}
                              style={{ cursor: "pointer" }}
                            >
                              <td style={{ padding: "10px 8px" }} onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  className="ck"
                                  checked={sel}
                                  onChange={() => historyToggleSelect(h.id)}
                                  style={{ margin: 0 }}
                                />
                              </td>
                              <td>
                                <div className="dt-script-name">{h.product || "Unknown"}</div>
                                <div className="dt-script-meta">{wordCount(h.response)} words</div>
                              </td>
                              <td>
                                <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.45, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>"{h.buyerLine}"</div>
                              </td>
                              <td>
                                <span className={`ds-status ${g.cls}`}><span className="ds-status-dot" />{avg}</span>
                              </td>
                              <td style={{ color: "var(--muted)", fontSize: 12.5 }}>{fmtHistoryDate(h.createdAt)}</td>
                              <td onClick={(e) => e.stopPropagation()}>
                                <div className="dt-row-actions">
                                  <button onClick={() => setReviewEntry(h)} title="View"><Eye size={14} /></button>
                                  <button className="dt-row-del" onClick={() => historyDelete(h.id)} title="Delete"><Trash2 size={14} /></button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {filteredHistory.length > historyPageSize && (
                  <div className="ds-pagination">
                    <span className="ds-pagination-info">
                      Showing {(historyPage - 1) * historyPageSize + 1}–{Math.min(historyPage * historyPageSize, filteredHistory.length)} of {filteredHistory.length}
                    </span>
                    <div className="ds-pagination-actions">
                      <button
                        className="ds-btn-ico"
                        onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                        disabled={historyPage <= 1}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="ds-pagination-pages">Page {historyPage} of {historyTotalPages}</span>
                      <button
                        className="ds-btn-ico"
                        onClick={() => setHistoryPage((p) => Math.min(historyTotalPages, p + 1))}
                        disabled={historyPage >= historyTotalPages}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Review past session */}
        {reviewEntry && (
          <div className="ps-card" style={{ maxWidth: 720 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
              <button className="ps-btn ghost sm" onClick={() => setReviewEntry(null)}>
                ← Back
              </button>
              <span className="chip n">{reviewEntry.product || "Unknown"}</span>
              <span className="chip">{new Date(reviewEntry.createdAt).toLocaleDateString()}</span>
            </div>
            <ReviewResult entry={reviewEntry} />
          </div>
        )}

        {/* Practice session */}
        {selectedScript && !reviewEntry && (
          <div className="ps-card" style={{ maxWidth: 720 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
              <button className="ps-btn ghost sm" onClick={() => { setSelectedScript(null); setScenario(null); setResult(null); stopListening(); }}>
                ← Back to scripts
              </button>
              <span className="chip n">{selectedScript.productName}</span>
              {selectedScript.objections.length > 0 && (
                <span className="chip" style={{ background: "#E8F6EF", color: "#1A7F5B" }}>
                  {selectedScript.objections.length} objections
                </span>
              )}
            </div>

            {!scenario && !error && (
              <div className="loading-box">
                <span className="spinner dark" />
                <div className="msg">Preparing scenario…</div>
              </div>
            )}

            {error && (
              <div className="err" style={{ marginBottom: 14 }}>
                {error}
                <div style={{ marginTop: 10 }}>
                  <button className="ps-btn ghost sm" onClick={() => { setError(""); pickScenario(selectedScript); }}>
                    <RotateCcw size={14} /> Retry
                  </button>
                </div>
              </div>
            )}

            {scenario && !result && (
              <>
                <div className="practice-scenario">
                  <div className="practice-label">Buyer says:</div>
                  <div className="practice-buyer">"{scenario.buyerLine}"</div>
                  {scenario.source === "script" && (
                    <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 6 }}>
                      From your script’s objection bank
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <label className="flab">Your response<span className="req">*</span></label>
                    <span style={{ fontSize: 11, fontWeight: 600, color: wcHint ? (wc < 15 ? "#B5720F" : "#B23237") : "var(--faint)" }}>
                      {wc > 0 && <>{wc} words {wcHint && <span>· {wcHint}</span>}</>}
                    </span>
                  </div>
                  <div style={{ position: "relative" }}>
                    <LimitedTextarea
                      ref={textareaRef}
                      className="finp"
                      maxLength={2000}
                      style={{
                        minHeight: 120,
                        resize: "vertical",
                        width: "100%",
                        paddingRight: speechSupported ? 48 : 12,
                      }}
                      placeholder={isListening ? "Listening… speak now" : "Type or dictate what you'd say back to the buyer…"}
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitResponse(); }}
                    />
                    {speechSupported && (
                      <button
                        type="button"
                        onClick={toggleListening}
                        disabled={evaluating}
                        aria-label={isListening ? "Stop listening" : "Start voice input"}
                        title={isListening ? "Stop listening" : "Start voice input"}
                        style={{
                          position: "absolute",
                          right: 10,
                          bottom: 10,
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          border: "none",
                          background: isListening ? "#B23237" : "var(--accent)",
                          color: "#fff",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: ".15s",
                          boxShadow: isListening ? "0 0 0 4px rgba(178,50,55,.25)" : "0 2px 8px rgba(43,76,240,.25)",
                        }}
                      >
                        {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                      </button>
                    )}
                  </div>
                  <div className="fhint">
                    {isListening ? (
                      <span style={{ color: "#B23237", fontWeight: 600 }}>● Listening… speak clearly</span>
                    ) : (
                      <>
                        Cmd/Ctrl + Enter to submit · {speechSupported ? "Click the mic to dictate" : "Type your response"}
                      </>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <button className="ps-btn pri" disabled={!response.trim() || evaluating} onClick={submitResponse}>
                    {evaluating ? <><span className="spinner" /> Evaluating…</> : <>Submit response <ArrowRight size={14} /></>}
                  </button>
                  <button className="ps-btn ghost" disabled={evaluating} onClick={() => pickScenario(selectedScript)}>
                    <RotateCcw size={14} /> New scenario
                  </button>
                </div>
              </>
            )}

            {/* Results */}
            {result && (
              <>
                {/* Score header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "18px 20px",
                    background: grade ? `${grade.color}10` : "#F2F5FA",
                    border: `1.5px solid ${grade?.color || "var(--line)"}`,
                    borderRadius: 12,
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: "50%",
                      background: grade?.color || "var(--accent)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "'Space Grotesk'",
                      fontWeight: 700,
                      fontSize: 22,
                      flexShrink: 0,
                    }}
                  >
                    {averageScore(result.scores)}
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 18, color: grade?.color || "var(--ink)" }}>
                      {grade?.label || "Scored"}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
                      {stats.total > 0 && (
                        <>
                          Drill #{stats.total} · Best: {stats.best}
                          {stats.streak >= 3 && <> · {stats.streak} day streak 🔥</>}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Scenario replay */}
                <div className="practice-scenario" style={{ marginBottom: 14 }}>
                  <div className="practice-label">Buyer said:</div>
                  <div className="practice-buyer">"{result.buyerLine}"</div>
                </div>

                {/* User response */}
                <div style={{ marginBottom: 18 }}>
                  <label className="flab">Your response<span className="req">*</span></label>
                  <div
                    style={{
                      padding: 14,
                      background: "#F6F8FB",
                      borderRadius: 10,
                      fontSize: 14,
                      lineHeight: 1.6,
                      border: "1px solid var(--line-soft)",
                      color: "var(--ink)",
                    }}
                  >
                    {result.response}
                  </div>
                </div>

                {/* Score bars */}
                <div className="practice-scores">
                  {[
                    { label: "Confidence", value: result.scores.confidence, icon: TrendingUp },
                    { label: "Coverage", value: result.scores.coverage, icon: Target },
                    { label: "Tone", value: result.scores.tone, icon: Trophy },
                  ].map((s) => (
                    <div key={s.label} className="practice-score">
                      <div className="ps-label" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <s.icon size={13} />
                        {s.label}
                      </div>
                      <div className="ps-bar-wrap">
                        <div className="ps-bar" style={{ width: `${s.value}%`, background: scoreColor(s.value) }} />
                      </div>
                      <div className="ps-val" style={{ color: scoreColor(s.value) }}>{s.value}</div>
                    </div>
                  ))}
                  <div className="practice-total">
                    <div className="ps-label">Overall</div>
                    <div className="ps-total-val" style={{ color: scoreColor(averageScore(result.scores)) }}>
                      {averageScore(result.scores)}
                    </div>
                  </div>
                </div>

                {/* Feedback cards */}
                {result.strength && (
                  <div
                    style={{
                      background: "#EDF9F2",
                      border: "1.5px solid #B9E1CA",
                      borderRadius: 10,
                      padding: "14px 16px",
                      marginBottom: 12,
                      fontSize: 14,
                      lineHeight: 1.6,
                    }}
                  >
                    <div style={{ fontWeight: 700, color: "#1A7F5B", marginBottom: 5, display: "flex", alignItems: "center", gap: 6 }}>
                      <TrendingUp size={15} /> Strength
                    </div>
                    {result.strength}
                  </div>
                )}

                {result.improvement && (
                  <div
                    style={{
                      background: "#FBF1DE",
                      border: "1.5px solid #F0D9A6",
                      borderRadius: 10,
                      padding: "14px 16px",
                      marginBottom: 12,
                      fontSize: 14,
                      lineHeight: 1.6,
                    }}
                  >
                    <div style={{ fontWeight: 700, color: "#9A5B08", marginBottom: 5, display: "flex", alignItems: "center", gap: 6 }}>
                      <Target size={15} /> Fix next time
                    </div>
                    {result.improvement}
                  </div>
                )}

                {result.recommendedResponse && (
                  <div
                    style={{
                      background: "#EAEEFE",
                      border: "1.5px solid #C4D0F9",
                      borderRadius: 10,
                      padding: "14px 16px",
                      marginBottom: 12,
                      fontSize: 14,
                      lineHeight: 1.6,
                    }}
                  >
                    <div style={{ fontWeight: 700, color: "var(--accent-ink)", marginBottom: 5, display: "flex", alignItems: "center", gap: 6 }}>
                      <ArrowRight size={15} /> Recommended response
                    </div>
                    {result.recommendedResponse}
                  </div>
                )}

                {result.feedback && (
                  <div
                    style={{
                      background: "#F2F5FA",
                      borderRadius: 10,
                      padding: "14px 16px",
                      fontSize: 14,
                      lineHeight: 1.65,
                      color: "var(--muted)",
                    }}
                  >
                    <div style={{ fontWeight: 700, color: "var(--ink)", marginBottom: 5 }}>💬 Coach feedback</div>
                    {result.feedback}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
                  <button
                    className="ps-btn pri"
                    onClick={() => { setResult(null); setResponse(""); pickScenario(selectedScript); }}
                  >
                    <RotateCcw size={14} /> Practice another objection
                  </button>
                  <button
                    className="ps-btn ghost"
                    onClick={() => { setResult(null); setResponse(""); }}
                  >
                    Retry same scenario
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
