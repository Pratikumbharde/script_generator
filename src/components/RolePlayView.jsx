import React, { useState, useEffect, useRef } from "react";
import { Theater } from "lucide-react";
import LimitedTextarea from "./shared/LimitedTextarea.jsx";
import { callModel, nameOf } from "../utils/helpers.js";
import {
  METHODS, CALL_TYPES, LANGUAGES, BUYER_PERSONAS,
  DIFFICULTY_LEVELS, RP_SCORE_DIMENSIONS
} from "../data/constants.js";

/* ============================================================
   AI Role-play Simulator (P9)
   Full sales-training experience:
   Setup → Scenario → Briefing → Chat → Scorecard
   ============================================================ */

export default function RolePlayView({ products }) {
  /* ── Steps ── */
  const [step, setStep] = useState("setup"); // setup | scenario | briefing | active | ended

  /* ── Setup fields ── */
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [buyerPersonaId, setBuyerPersonaId] = useState("");
  const [buyerProfile, setBuyerProfile] = useState("");
  const [method, setMethod] = useState("consultative");
  const [callType, setCallType] = useState("discovery");
  const [difficulty, setDifficulty] = useState("realistic");
  const [language, setLanguage] = useState("en");
  const [scenarioText, setScenarioText] = useState("");

  /* ── Session state ── */
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [turnCount, setTurnCount] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const [liveScores, setLiveScores] = useState(null);
  const [finalScore, setFinalScore] = useState(null);
  const [weaknessDim, setWeaknessDim] = useState(null);
  const [speakingId, setSpeakingId] = useState(null);

  const bottomRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  /* ── Helpers ── */
  const selectedPersona = BUYER_PERSONAS.find((p) => p.id === buyerPersonaId);
  const langName = (id) => LANGUAGES.find((l) => l.id === id)?.name || id;

  const diffMeta = DIFFICULTY_LEVELS.find((d) => d.id === difficulty) || DIFFICULTY_LEVELS[1];

  const scoreColor = (s) => s >= 80 ? "#1A7F5B" : s >= 60 ? "#B5720F" : "#B23237";
  const scoreGrade = (s) => s >= 85 ? "Excellent" : s >= 70 ? "Good" : s >= 55 ? "Fair" : "Needs work";
  const avgScore = (scores) => {
    if (!scores) return 0;
    const vals = Object.values(scores).filter((v) => typeof v === "number");
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  };
  const weakestDim = (scores) => {
    if (!scores) return null;
    const entries = Object.entries(scores).filter(([, v]) => typeof v === "number");
    if (!entries.length) return null;
    return entries.reduce((a, b) => (a[1] < b[1] ? a : b))[0];
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── Generate scenario ── */
  const generateScenario = async () => {
    if (!selectedProduct) return;
    setLoading(true);
    setError("");
    try {
      const SYS = `You are a sales-scenario generator. Write a concise, realistic sales scenario (3-5 sentences) based on the inputs. Include: the buyer's context, their likely mood, and the rep's objective. Keep it vivid and specific.`;
      const prompt = `Product: ${selectedProduct.name}
Description: ${selectedProduct.description || selectedProduct.one_liner || ""}
Method: ${nameOf(METHODS, method)}
Call type: ${nameOf(CALL_TYPES, callType)}
Buyer persona: ${selectedPersona?.label || "General"}
Buyer profile: ${buyerProfile || selectedPersona?.defaultProfile || ""}
Difficulty: ${diffMeta.label}
Language: ${langName(language)}

Generate the scenario. Write it as a short narrative paragraph.`;
      const text = await callModel(SYS, prompt);
      setScenarioText(typeof text === "string" ? text : "");
      setStep("briefing");
    } catch (e) {
      setError("Failed to generate scenario: " + (e.message || "try again"));
    } finally {
      setLoading(false);
    }
  };

  /* ── Start chat ── */
  const startChat = async () => {
    if (!selectedProduct) return;
    setStep("active");
    setMessages([]);
    setTurnCount(0);
    setFinalScore(null);
    setLiveScores(null);
    setError("");
    setSuggestions([]);

    setLoading(true);
    try {
      const diffDesc = diffMeta.desc;
      const SYS = `You are a realistic buyer in a B2B sales call. ${selectedPersona?.label || "A typical prospect"}. Difficulty: ${diffMeta.label}. ${diffDesc} Respond in character. Keep responses to 1-3 sentences.`;
      const prompt = `Product: ${selectedProduct.name}. Description: ${selectedProduct.description || ""}. Method: ${method}. Call type: ${callType}. Persona: ${selectedPersona?.label || "General"}. Profile: ${buyerProfile || selectedPersona?.defaultProfile || ""}. Language: ${langName(language)}.

Scenario: ${scenarioText}

You are the buyer. Start the conversation. Either ask a challenging question, express a concern, or ask for more information. Be specific to the product.`;
      const text = await callModel(SYS, prompt);
      const reply = typeof text === "string" ? text.trim().slice(0, 500) : "";
      setMessages([{ role: "buyer", text: reply, timestamp: Date.now() }]);
      setTurnCount(1);
    } catch (e) {
      setError("Failed to start: " + (e.message || "try again"));
      setStep("briefing");
    } finally {
      setLoading(false);
    }
  };

  /* ── Send message ── */
  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    const userText = text.trim();
    setMessages((prev) => [...prev, { role: "rep", text: userText, timestamp: Date.now() }]);
    setInput("");
    setLoading(true);
    setSuggestions([]);

    try {
      const conversation = messages.map((m) => `${m.role === "buyer" ? "Buyer" : "Rep"}: ${m.text}`).join("\n");
      const diffDesc = diffMeta.desc;
      const SYS = `You are a realistic buyer in a B2B sales call. ${selectedPersona?.label || "A typical prospect"}. Difficulty: ${diffMeta.label}. ${diffDesc} Respond naturally. Keep it to 1-3 sentences.`;
      const prompt = `Product: ${selectedProduct.name}. Description: ${selectedProduct.description || ""}. Method: ${method}. Call type: ${callType}. Persona: ${selectedPersona?.label || "General"}. Profile: ${buyerProfile || selectedPersona?.defaultProfile || ""}. Language: ${langName(language)}.

Conversation so far:
${conversation}
Rep: ${userText}

You are the buyer. Respond naturally.`;
      const text = await callModel(SYS, prompt);
      const reply = typeof text === "string" ? text.trim().slice(0, 500) : "";
      setMessages((prev) => [...prev, { role: "buyer", text: reply, timestamp: Date.now() }]);
      setTurnCount((t) => t + 1);

      /* Live scoring (background) */
      scoreLive(userText, reply, conversation);
      /* Suggestions */
      generateSuggestions(userText, reply, conversation);
    } catch (e) {
      setError("AI response failed: " + (e.message || "try again"));
    } finally {
      setLoading(false);
    }
  };

  const scoreLive = async (userText, buyerReply, conversation) => {
    try {
      const SYS = `You are an elite sales coach. Score the rep's LAST response on these 7 dimensions (0-100 each). Return ONLY a JSON object with keys: discovery, questionQuality, listening, objectionHandling, valueProposition, rapport, closing. Be strict.`;
      const prompt = `Product: ${selectedProduct.name}. Method: ${method}. Call type: ${callType}.

Conversation:
${conversation}
Rep: ${userText}
Buyer: ${buyerReply}

Score the rep's last response only. Return ONLY JSON.`;
      const text = await callModel(SYS, prompt);
      const raw = typeof text === "string" ? text : "";
      let parsed = {};
      try {
        const clean = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
        const jsonStart = clean.indexOf("{");
        const jsonEnd = clean.lastIndexOf("}");
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          parsed = JSON.parse(clean.slice(jsonStart, jsonEnd + 1));
        }
      } catch (_) { /* noop */ }
      const next = {};
      RP_SCORE_DIMENSIONS.forEach((d) => {
        next[d.key] = Math.min(100, Math.max(0, Number(parsed[d.key]) || 50));
      });
      setLiveScores(next);
    } catch (_) { /* silent fail for live scoring */ }
  };

  const generateSuggestions = async (userText, buyerReply, conversation) => {
    try {
      const SYS = `You are a sales coach. Suggest 2 short, natural ways the rep could respond next. Each 1 sentence. Return ONLY a JSON array of strings.`;
      const prompt = `Product: ${selectedProduct.name}. Persona: ${selectedPersona?.label || "General"}.

Conversation:
${conversation}
Rep: ${userText}
Buyer: ${buyerReply}

Suggest 2 natural next responses. Return ["suggestion 1", "suggestion 2"]`;
      const text = await callModel(SYS, prompt);
      const raw = typeof text === "string" ? text : "";
      let parsed = [];
      try {
        const clean = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
        const jsonStart = clean.indexOf("[");
        const jsonEnd = clean.lastIndexOf("]");
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          parsed = JSON.parse(clean.slice(jsonStart, jsonEnd + 1));
        }
      } catch (_) { /* noop */ }
      if (Array.isArray(parsed)) setSuggestions(parsed.slice(0, 2));
    } catch (_) { setSuggestions([]); }
  };

  /* ── End & evaluate ── */
  const endRolePlay = async () => {
    setLoading(true);
    try {
      const conversation = messages.map((m) => `${m.role === "buyer" ? "Buyer" : "Rep"}: ${m.text}`).join("\n");
      const SYS = `You are an elite sales coach evaluating a full sales conversation. Score on 7 dimensions (0-100 each) and provide detailed feedback.
Return ONLY JSON:
{"discovery":0-100,"questionQuality":0-100,"listening":0-100,"objectionHandling":0-100,"valueProposition":0-100,"rapport":0-100,"closing":0-100,"feedback":"2-3 sentences","strengths":["strength 1","strength 2"],"weaknesses":["weakness 1","weakness 2"],"coach":"1 paragraph of specific coaching advice"}`;
      const prompt = `Product: ${selectedProduct.name}. Method: ${method}. Call type: ${callType}. Persona: ${selectedPersona?.label || "General"}. Difficulty: ${diffMeta.label}.

Full conversation:
${conversation}

Evaluate.`;
      const text = await callModel(SYS, prompt);
      const raw = typeof text === "string" ? text : "";
      let parsed = {};
      try {
        const clean = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
        const jsonStart = clean.indexOf("{");
        const jsonEnd = clean.lastIndexOf("}");
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          parsed = JSON.parse(clean.slice(jsonStart, jsonEnd + 1));
        }
      } catch (_) {
        parsed = { feedback: raw.slice(0, 500), strengths: [], weaknesses: [], coach: "" };
      }

      const scores = {};
      RP_SCORE_DIMENSIONS.forEach((d) => {
        scores[d.key] = Math.min(100, Math.max(0, Number(parsed[d.key]) || 50));
      });

      const weak = weakestDim(scores);
      setWeaknessDim(weak);
      setFinalScore({
        ...scores,
        feedback: parsed.feedback || "",
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
        coach: parsed.coach || "",
      });
      setStep("ended");
    } catch (e) {
      setError("Evaluation failed: " + (e.message || "try again"));
    } finally {
      setLoading(false);
    }
  };

  /* ── Speech ── */
  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { console.warn("Speech recognition not supported in this browser"); return; }
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = language === "en" ? "en-US" : "en-US";
    rec.onresult = (e) => {
      const transcript = Array.from(e.results).map((r) => r[0].transcript).join(" ");
      setInput(transcript);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    recognitionRef.current = rec;
    try { rec.start(); setIsListening(true); } catch (_) {}
  };
  const stopListening = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  /* ── Text to Speech ── */
  const speakText = (text, id) => {
    if (!window.speechSynthesis) return;
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const langMap = { en: "en-US", es: "es-ES", fr: "fr-FR", de: "de-DE", it: "it-IT", pt: "pt-BR", nl: "nl-NL", pl: "pl-PL", ru: "ru-RU", zh: "zh-CN", ja: "ja-JP", ko: "ko-KR", ar: "ar-SA", hi: "hi-IN", tr: "tr-TR", sv: "sv-SE", da: "da-DK", fi: "fi-FI", no: "nb-NO", he: "he-IL", th: "th-TH", id: "id-ID", vi: "vi-VN", ms: "ms-MY", uk: "uk-UA", cs: "cs-CZ", el: "el-GR", ro: "ro-RO", hu: "hu-HU" };
    utter.lang = langMap[language] || language || "en-US";
    utter.rate = 1;
    utter.pitch = 1;
    utter.onend = () => setSpeakingId(null);
    utter.onerror = () => setSpeakingId(null);
    window.speechSynthesis.speak(utter);
    setSpeakingId(id);
  };

  /* ── Product context helpers ── */
  const productContext = (p) => {
    if (!p) return null;
    return {
      icp: p.ideal_customer || "Not specified",
      pain: p.pain_points || "Not specified",
      value: p.one_liner || p.description || "Not specified",
      objections: p.objections?.length ? p.objections : [],
    };
  };

  /* ── Render ── */
  return (
    <div>
      <div className="ps-top">
        <div>
          <div className="ps-eyebrow">Practice</div>
          <div className="ps-title"><Theater size={22} style={{ marginRight: 8, verticalAlign: "-3px" }} />Role-play</div>
          <div className="ps-sub">Practice real sales conversations with an AI buyer and get scored on how you sell.</div>
        </div>
      </div>

      <div className="ps-body">
        {/* ===== SETUP ===== */}
        {step === "setup" && (
          <div className="rp-setup-grid">
            {/* Left column */}
            <div>
              {/* Product */}
              <div className="frow">
                <label className="flab">Product<span className="req">*</span></label>
                <select
                  className="fsel"
                  value={selectedProduct?.id || ""}
                  onChange={(e) => {
                    const p = products.find((x) => String(x.id) === e.target.value);
                    setSelectedProduct(p || null);
                  }}
                >
                  <option value="">Select a product…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {selectedProduct && (
                  <div className="rp-context-card">
                    <div className="rp-context-h">Product Context</div>
                    {(() => {
                      const ctx = productContext(selectedProduct);
                      return (
                        <>
                          <div className="rp-context-row">
                            <span className="rp-context-label">ICP</span>
                            <span className="rp-context-value">{ctx.icp}</span>
                          </div>
                          <div className="rp-context-row">
                            <span className="rp-context-label">Pain points</span>
                            <span className="rp-context-value">{ctx.pain}</span>
                          </div>
                          <div className="rp-context-row">
                            <span className="rp-context-label">Value prop</span>
                            <span className="rp-context-value">{ctx.value}</span>
                          </div>
                          {ctx.objections.length > 0 && (
                            <div className="rp-context-row">
                              <span className="rp-context-label">Objections</span>
                              <span className="rp-context-value">{ctx.objections.join("; ")}</span>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Call Type */}
              <div className="frow">
                <label className="flab">Call Type<span className="req">*</span></label>
                <select className="fsel" value={callType} onChange={(e) => setCallType(e.target.value)}>
                  {CALL_TYPES.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <div className="fhint">{CALL_TYPES.find((c) => c.id === callType)?.desc}</div>
              </div>

              {/* Method */}
              <div className="frow">
                <label className="flab">Sales Method<span className="req">*</span></label>
                <select className="fsel" value={method} onChange={(e) => setMethod(e.target.value)}>
                  {METHODS.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <div className="fhint">{METHODS.find((m) => m.id === method)?.blurb}</div>
              </div>
            </div>

            {/* Right column */}
            <div>
              {/* Buyer Persona */}
              <div className="frow">
                <label className="flab">Buyer Persona</label>
                <div className="rp-persona-grid">
                  {BUYER_PERSONAS.map((p) => (
                    <div
                      key={p.id}
                      className={`rp-persona-card ${buyerPersonaId === p.id ? "on" : ""}`}
                      onClick={() => {
                        setBuyerPersonaId(p.id);
                        if (p.id !== "custom") setBuyerProfile(p.defaultProfile);
                      }}
                    >
                      <div className="label">{p.label}</div>
                    </div>
                  ))}
                </div>
                {buyerPersonaId && (
                  <div style={{ marginTop: 10 }}>
                    <label className="flab" style={{ fontSize: 12 }}>Buyer Profile</label>
                    <LimitedTextarea
                      className="ftext"
                      style={{ minHeight: 80, fontSize: 13 }}
                      placeholder="Describe the buyer's situation, pain points, and attitude..."
                      value={buyerProfile}
                      onChange={(e) => setBuyerProfile(e.target.value)}
                      maxLength={2000}
                    />
                    <div className="fhint">The AI will behave according to this profile.</div>
                  </div>
                )}
              </div>

              {/* Difficulty */}
              <div className="frow">
                <label className="flab">Difficulty<span className="req">*</span></label>
                <div className="rp-diff-grid">
                  {DIFFICULTY_LEVELS.map((d) => (
                    <div
                      key={d.id}
                      className={`rp-diff-card ${difficulty === d.id ? "on" : ""}`}
                      onClick={() => setDifficulty(d.id)}
                    >
                      <div className="emoji">{d.emoji}</div>
                      <div className="label">{d.label}</div>
                      <div className="hint">{d.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div className="frow">
                <label className="flab">Language<span className="req">*</span></label>
                <select className="fsel" value={language} onChange={(e) => setLanguage(e.target.value)}>
                  {LANGUAGES.map((l) => (
                    <option key={l.id} value={l.id}>{l.name} {l.native ? `— ${l.native}` : ""}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* CTA spans full width */}
            <div style={{ gridColumn: "1 / -1" }}>
              <button className="ps-btn pri" disabled={!selectedProduct || loading} onClick={generateScenario} style={{ width: "100%", justifyContent: "center", padding: "12px 20px" }}>
                {loading ? <><span className="spinner" /> Generating scenario…</> : <><span style={{ fontSize: 18 }}>🎭</span> Start Role-play</>}
              </button>
              {error && step === "setup" && <div className="err" style={{ marginTop: 12 }}>{error}</div>}
            </div>
          </div>
        )}

        {/* ===== SCENARIO (inline transition, skip to briefing) ===== */}
        {step === "scenario" && (
          <div className="loading-box">
            <span className="spinner dark" />
            <div className="msg">Preparing scenario…</div>
          </div>
        )}

        {/* ===== BRIEFING ===== */}
        {step === "briefing" && (
          <div className="rp-briefing">
            <div className="rp-briefing-h">Pre-call Briefing</div>
            <div className="rp-briefing-sub">Review your role, the buyer, and your objective before the conversation starts.</div>

            <div className="rp-briefing-grid">
              <div className="rp-briefing-item">
                <div className="lbl">Your Role</div>
                <div className="val">Sales Executive</div>
              </div>
              <div className="rp-briefing-item">
                <div className="lbl">Buyer</div>
                <div className="val">{selectedPersona?.label || "General prospect"}</div>
              </div>
              <div className="rp-briefing-item">
                <div className="lbl">Objective</div>
                <div className="val">{callType === "cold" ? "Earn a next meeting" : callType === "closing" ? "Secure commitment" : callType === "renewal" ? "Secure renewal / upsell" : "Move the deal forward"}</div>
              </div>
              <div className="rp-briefing-item">
                <div className="lbl">Buyer Mood</div>
                <div className="val">{diffMeta.label} — {diffMeta.desc}</div>
              </div>
              <div className="rp-briefing-item">
                <div className="lbl">Method</div>
                <div className="val">{nameOf(METHODS, method)}</div>
              </div>
              <div className="rp-briefing-item">
                <div className="lbl">Difficulty</div>
                <div className="val">{diffMeta.emoji} {diffMeta.label}</div>
              </div>
            </div>

            {scenarioText && (
              <div className="rp-scenario" style={{ marginBottom: 24 }}>
                <div className="rp-scenario-label">Scenario</div>
                {scenarioText}
              </div>
            )}

            <div className="rp-briefing-scores">
              {RP_SCORE_DIMENSIONS.map((d) => (
                <span key={d.key} className="rp-briefing-score-chip">{d.label}</span>
              ))}
            </div>

            <div className="rp-briefing-cta">
              <button className="ps-btn pri" disabled={loading} onClick={startChat} style={{ padding: "12px 28px" }}>
                {loading ? <><span className="spinner" /> Starting…</> : <><span style={{ fontSize: 18 }}>💬</span> Start Conversation</>}
              </button>
              <button className="ps-btn ghost" style={{ marginLeft: 10 }} onClick={() => setStep("setup")}>← Change setup</button>
            </div>
            {error && step === "briefing" && <div className="err" style={{ marginTop: 12 }}>{error}</div>}
          </div>
        )}

        {/* ===== ACTIVE CHAT ===== */}
        {(step === "active" || step === "ended") && (
          <div className="rp-active-wrap">
            {error && (step === "active" || step === "ended") && <div className="err" style={{ marginBottom: 12 }}>{error}</div>}
            {/* Chat area */}
            <div className="rp-chat-area">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
                <button className="ps-btn ghost sm" onClick={() => { setStep("setup"); setMessages([]); setTurnCount(0); }}>← New session</button>
                <span className="chip n">{selectedProduct?.name}</span>
                {selectedPersona && <span className="chip">👤 {selectedPersona.label}</span>}
                <span className="chip">{nameOf(METHODS, method)} · {nameOf(CALL_TYPES, callType)}</span>
                <div className="rp-turns" style={{ marginLeft: "auto" }}>{turnCount} turn{turnCount !== 1 ? "s" : ""}</div>
              </div>

              {step === "active" && (
                <>
                  <div className="rp-chat">
                    {messages.map((m, i) => (
                      <div key={i} className={`rp-bubble ${m.role}`}>
                        <div className={`rp-avatar ${m.role}`}>{m.role === "buyer" ? "🧑" : "🎤"}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className={`rp-msg ${m.role}`}>{m.text}</div>
                          <div className="rp-meta">
                            {m.role === "buyer" ? "AI Buyer" : "You"} · {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            {m.role === "buyer" && (
                              <button
                                className="rp-tts-btn"
                                onClick={() => speakText(m.text, i)}
                                title={speakingId === i ? "Stop" : "Listen"}
                              >
                                {speakingId === i ? "⏹" : "🔊"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {loading && (
                      <div className="rp-bubble buyer">
                        <div className="rp-avatar buyer">🧑</div>
                        <div className="rp-msg buyer" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span className="spinner dark" style={{ width: 14, height: 14 }} />
                          <span style={{ fontSize: 13, color: "var(--faint)" }}>Buyer is thinking…</span>
                        </div>
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </div>

                  {suggestions.length > 0 && !loading && (
                    <div style={{ marginTop: 10 }}>
                      <div className="fhint" style={{ marginBottom: 6 }}>💡 Stuck? Try one of these:</div>
                      {suggestions.map((s, i) => (
                        <div key={i} className="rp-suggestion" onClick={() => sendMessage(s)}>
                          {s}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="rp-input-wrap">
                    <textarea
                      className="rp-input"
                      placeholder="Type your response…"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) sendMessage(input); }}
                    />
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <button className="rp-send" disabled={!input.trim() || loading} onClick={() => sendMessage(input)}>Send</button>
                      <button className="ps-btn ghost sm" onClick={isListening ? stopListening : startListening}>
                        {isListening ? "⏹" : "🎤"}
                      </button>
                    </div>
                  </div>
                  <div className="fhint">Cmd/Ctrl + Enter to send · Minimum 3 turns recommended before ending.</div>

                  <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                    <button className="ps-btn pri" disabled={turnCount < 2 || loading} onClick={endRolePlay}>
                      {loading ? "Evaluating…" : "✓ End & Score"}
                    </button>
                  </div>
                </>
              )}

              {/* Ended scorecard */}
              {step === "ended" && finalScore && (
                <div className="rp-end">
                  {/* Overall score header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 24 }}>
                    <div
                      className="rp-score-circle"
                      style={{ background: scoreColor(avgScore(finalScore)) }}
                    >
                      {avgScore(finalScore)}
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 22, color: scoreColor(avgScore(finalScore)) }}>
                        {scoreGrade(avgScore(finalScore))}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
                        {turnCount} turns · {selectedPersona?.label || "General"}
                      </div>
                    </div>
                  </div>

                  {/* Dimension bars */}
                  <div className="practice-scores" style={{ marginBottom: 22 }}>
                    {RP_SCORE_DIMENSIONS.map((d) => (
                      <div key={d.key} className="practice-score">
                        <div className="ps-label">{d.label}</div>
                        <div className="ps-bar-wrap">
                          <div className="ps-bar" style={{ width: `${finalScore[d.key]}%`, background: scoreColor(finalScore[d.key]) }} />
                        </div>
                        <div className="ps-val" style={{ color: scoreColor(finalScore[d.key]) }}>{finalScore[d.key]}</div>
                      </div>
                    ))}
                  </div>

                  {/* Strengths */}
                  {finalScore.strengths.length > 0 && (
                    <div className="rp-coach-card rp-coach-good">
                      <div className="rp-coach-h" style={{ color: "#1A7F5B" }}>✓ What you did well</div>
                      <div className="rp-coach-body">
                        <ul>
                          {finalScore.strengths.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Weaknesses */}
                  {finalScore.weaknesses.length > 0 && (
                    <div className="rp-coach-card rp-coach-bad">
                      <div className="rp-coach-h" style={{ color: "#B23237" }}>✕ What hurt the deal</div>
                      <div className="rp-coach-body">
                        <ul>
                          {finalScore.weaknesses.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* AI Coach */}
                  {finalScore.coach && (
                    <div className="rp-coach-card rp-coach-insight">
                      <div className="rp-coach-h" style={{ color: "var(--accent-ink)" }}>🎓 AI Coach</div>
                      <div className="rp-coach-body">{finalScore.coach}</div>
                    </div>
                  )}

                  {finalScore.feedback && (
                    <div style={{ background: "#F2F5FA", borderRadius: 10, padding: "14px 16px", fontSize: 14, lineHeight: 1.65, color: "var(--muted)", marginBottom: 14 }}>
                      <b style={{ color: "var(--ink)" }}>Summary:</b> {finalScore.feedback}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button className="ps-btn pri" onClick={() => { setStep("active"); setMessages([]); setTurnCount(0); setFinalScore(null); startChat(); }}>
                      🎭 Try Again
                    </button>
                    {weaknessDim && (
                      <button className="ps-btn subtle" onClick={() => { setStep("setup"); }}>
                        → Practice {RP_SCORE_DIMENSIONS.find((d) => d.key === weaknessDim)?.label || weaknessDim}
                      </button>
                    )}
                    <button className="ps-btn ghost" onClick={() => setStep("setup")}>Change setup</button>
                  </div>
                </div>
              )}

              {error && <div className="err" style={{ marginTop: 12 }}>{error}</div>}
            </div>

            {/* Live score panel (only during active) */}
            {step === "active" && (
              <div className="rp-live-panel">
                <div className="rp-live-panel-h">📊 Live Score</div>
                {liveScores ? (
                  RP_SCORE_DIMENSIONS.map((d) => (
                    <div key={d.key} className="rp-live-score-row rp-live-dim">
                      <div className="rp-live-score-label">{d.label}</div>
                      <div className="rp-live-score-bar">
                        <div className="rp-live-score-bar-inner" style={{ width: `${liveScores[d.key]}%`, background: scoreColor(liveScores[d.key]) }} />
                      </div>
                      <div className="rp-live-score-val">{liveScores[d.key]}</div>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: 12, color: "var(--faint)", textAlign: "center", padding: "20px 0" }}>Scores update after each turn…</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
