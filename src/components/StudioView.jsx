import React, { useState, useEffect, useRef } from "react";
import { METHODS, CALL_TYPES, CALL_METHODS, DURATIONS, LANGUAGES, REGIONS, DELIVERY, PERSONA_TEMPLATES, TONE_COLOR, methodsFor, durationsFor, durationHintFor } from "../data/constants.js";
import { S, slug, scriptKey, generateScript, generateScriptStream } from "../utils/helpers.js";
import { getVoiceContext, getAssignedScripts } from "../api/client.js";
import { CardSkeleton, CockpitSkeleton } from "./shared/Skeletons.jsx";
import Cockpit from "./ScriptCockpit.jsx";

export default function StudioView({ product, preset, teamLanguages = [], staff = [], onBack, canGenerate = true }) {
  // Member read-only mode: show assigned scripts
  const [assignedScripts, setAssignedScripts] = useState([]);
  const [assignedLoading, setAssignedLoading] = useState(false);
  const [selectedAssigned, setSelectedAssigned] = useState(null);

  useEffect(() => {
    if (canGenerate) return;
    setAssignedLoading(true);
    getAssignedScripts()
      .then((scripts) => setAssignedScripts(scripts))
      .catch(() => setAssignedScripts([]))
      .finally(() => setAssignedLoading(false));
  }, [canGenerate]);

  // Member view: list of assigned scripts
  if (!canGenerate) {
    return (
      <>
        <div className="ps-top">
          <div>
            <div className="ps-eyebrow">My Scripts</div>
            <div className="ps-title">Assigned Scripts</div>
            <div className="ps-sub">Scripts that have been assigned to you by your team lead or manager.</div>
          </div>
        </div>
        <div className="ps-body" style={{ maxWidth: 900 }}>
          {assignedLoading ? (
            <div className="ps-card" style={{ padding: 40, textAlign: "center" }}>
              <div className="loading-box"><div className="ring" /><div className="msg">Loading your scripts…</div></div>
            </div>
          ) : assignedScripts.length === 0 ? (
            <div className="ps-empty">
              <div className="big">No scripts assigned yet</div>
              <p>Your team lead or manager will assign scripts to you. Check back soon.</p>
            </div>
          ) : selectedAssigned ? (
            <div>
              <div className="crumb" onClick={() => setSelectedAssigned(null)}>← Back to my scripts</div>
              <Cockpit
                product={selectedAssigned.product || { name: selectedAssigned.productName || "Script", id: selectedAssigned.productId }}
                method={selectedAssigned.methodObj || METHODS[0]}
                callType={selectedAssigned.callTypeObj || CALL_TYPES[0]}
                duration={selectedAssigned.duration || 30}
                meta={selectedAssigned.meta || {}}
                script={selectedAssigned.script || selectedAssigned}
                opts={selectedAssigned.opts || {}}
                onBack={() => setSelectedAssigned(null)}
                onChangeSetup={() => setSelectedAssigned(null)}
                onRegenerate={() => setSelectedAssigned(null)}
                regenerating={false}
                readOnly={true}
              />
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {assignedScripts.map((s, i) => {
                const method = METHODS.find((m) => m.id === (s.method || s.meta?.method)) || METHODS[0];
                const callType = CALL_TYPES.find((c) => c.id === (s.callType || s.meta?.callType)) || CALL_TYPES[0];
                return (
                  <div key={s.id || i} className="ps-card" style={{ cursor: "pointer", transition: "box-shadow 0.15s" }}
                    onClick={() => setSelectedAssigned({
                      ...s,
                      product: { name: s.productName || s.meta?.productName || s.product?.name || "Script", id: s.productId || s.meta?.productId },
                      methodObj: method,
                      callTypeObj: callType,
                      duration: s.duration || s.meta?.duration || 30,
                      meta: {
                        language: LANGUAGES.find((l) => l.id === (s.language || s.meta?.language || "en")),
                        region: REGIONS.find((r) => r.id === (s.region || s.meta?.region || "india")),
                        delivery: DELIVERY.find((d) => d.id === (s.delivery || s.meta?.delivery || "balanced")),
                        simple: s.simple || s.meta?.simple || true,
                        persona: s.persona || s.meta?.persona || "General audience",
                      },
                      script: s.data || s,
                      opts: s.meta || {},
                    })}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{s.productName || s.meta?.productName || "Script"}</div>
                        <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
                          {method.name} · {callType.name} · {s.duration || s.meta?.duration || 30} min
                        </div>
                      </div>
                      <span className="chip n" style={{ background: "var(--accent)", color: "#fff" }}>View</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </>
    );
  }
  const personaList = (product.personas || "").split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
  const presetPersonaListed = preset && (preset.persona === "General audience" || personaList.includes(preset.persona));

  const [method, setMethod] = useState(preset?.method || METHODS[0].id);
  const [callType, setCallType] = useState(preset?.callType || CALL_TYPES[0].id);
  const [duration, setDuration] = useState(() => {
    if (preset?.duration) return preset.duration;
    const initMethod = preset?.method || METHODS[0].id;
    const initCall = preset?.callType || CALL_TYPES[0].id;
    const opts = durationsFor(initCall, initMethod);
    return opts.includes(30) ? 30 : opts[Math.floor(opts.length / 2)];
  });
  const [language, setLanguage] = useState(preset?.language || "en");
  const [region, setRegion] = useState(preset?.region || "india");
  const [delivery, setDelivery] = useState(preset?.delivery || "balanced");
  const [simple, setSimple] = useState(preset ? !!preset.simple : true);
  const [persona, setPersona] = useState(preset ? (presetPersonaListed ? preset.persona : "__custom__") : "General audience");
  const [customPersona, setCustomPersona] = useState(preset && !presetPersonaListed && preset.persona ? preset.persona : "");
  const [personaTemplate, setPersonaTemplate] = useState(null); // P2.4: rich persona template
  const [showPersonaDetail, setShowPersonaDetail] = useState(false);
  // language generation mode: "single" | "team" | "custom"
  const [langMode, setLangMode] = useState(teamLanguages.length > 1 ? "team" : "single");
  const [customLangs, setCustomLangs] = useState(() => [preset?.language || "en"]);
  const [script, setScript] = useState(null);
  const [savedExists, setSavedExists] = useState(false);
  const [loading, setLoading] = useState(false);
  const [genProgress, setGenProgress] = useState(null); // { current, total, langName }
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [streamStage, setStreamStage] = useState(null); // "core" | "objections"
  const [streamStatus, setStreamStatus] = useState("");
  const [streamText, setStreamText] = useState("");
  const [voiceContext, setVoiceContext] = useState("");

  // fetch company voice context once
  useEffect(() => {
    getVoiceContext().then((ctx) => setVoiceContext(ctx || "")).catch(() => setVoiceContext(""));
  }, []);

  const mObj = METHODS.find((m) => m.id === method);
  const cObj = CALL_TYPES.find((c) => c.id === callType);
  const lObj = LANGUAGES.find((l) => l.id === language);
  const resolvedPersona = persona === "__custom__" ? (customPersona.trim() || "General audience") : persona;

  // which languages will actually get generated when the user hits Generate
  const languagesToGenerate = (() => {
    if (langMode === "single") return [language];
    if (langMode === "team") return teamLanguages.length ? [...new Set([language, ...teamLanguages])] : [language];
    return [...new Set([language, ...customLangs])]; // "custom"
  })();

  const opts = { method, callType, duration, language, region, delivery, simple, persona: resolvedPersona, personaDetail: personaTemplate };
  const key = scriptKey(product.id, opts);
  const applicableMethods = methodsFor(callType);

  // when any selection changes, look for a saved script (do NOT generate)
  useEffect(() => {
    let live = true;
    setScript(null); setError(""); setChecking(true);
    (async () => {
      const saved = await S.get(key);
      if (!live) return;
      setSavedExists(!!saved);
      if (saved && !preset?.setupOnly) setScript(saved.data);
      setChecking(false);
    })();
    return () => { live = false; };
  }, [key]);

  // if the chosen call type no longer allows the chosen method, snap to the first that fits
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    if (!(CALL_METHODS[callType] || []).includes(method)) {
      setMethod((CALL_METHODS[callType] || [])[0] || METHODS[0].id);
    }
  }, [callType]);

  // adaptive call-length options for the current call type + method
  const durationOptions = durationsFor(callType, method);
  const durationHint = durationHintFor(callType, method);

  // snap duration when the applicable set changes (skip on first mount so preset survives)
  const firstDurRun = useRef(true);
  useEffect(() => {
    if (firstDurRun.current) { firstDurRun.current = false; return; }
    if (!durationOptions.includes(duration)) {
      // pick the nearest option
      const nearest = durationOptions.reduce((best, d) => Math.abs(d - duration) < Math.abs(best - duration) ? d : best, durationOptions[0]);
      setDuration(nearest);
    }
  }, [callType, method]);

  const runGenerate = async () => {
    setLoading(true); setError(""); setGenProgress(null);
    setStreamStage(null); setStreamStatus(""); setStreamText("");
    const langs = languagesToGenerate;
    try {
      let primaryData = null;
      for (let i = 0; i < langs.length; i++) {
        const lid = langs[i];
        const lname = (LANGUAGES.find((l) => l.id === lid) || {}).name || lid;
        setGenProgress({ current: i + 1, total: langs.length, langName: lname });
        const data = await generateScriptStream(
          { product, method: mObj, callType: cObj, duration, language: lid, region, delivery, simple, persona: resolvedPersona, voiceContext },
          ({ stage, status, text }) => {
            setStreamStage(stage);
            setStreamStatus(status);
            setStreamText(text);
          }
        );
        const langOpts = { ...opts, language: lid };
        const langKey = scriptKey(product.id, langOpts);
        const meta = { productId: product.id, productName: product.name, method, callType, duration, language: lid, region, delivery, simple, persona: resolvedPersona };
        await S.set(langKey, { data, savedAt: Date.now(), meta });
        if (lid === language) {
          // Re-fetch to get the DB id
          const saved = await S.get(langKey);
          primaryData = saved?.data || data;
        }
      }
      // if the primary language wasn't in langs (edge case), keep whatever was last saved
      if (!primaryData) primaryData = await S.get(key).then((r) => r?.data);
      setScript(primaryData); setSavedExists(true);
    } catch (e) {
      setError(e.message || "Something went wrong generating the script. Try again.");
    } finally { setLoading(false); setGenProgress(null); setStreamStage(null); }
  };

  if (script) {
    return <Cockpit product={product} method={mObj} callType={cObj} duration={duration}
      meta={{ language: lObj, region: REGIONS.find((r) => r.id === region), delivery: DELIVERY.find((d) => d.id === delivery), simple, persona: resolvedPersona }}
      script={script} opts={opts}
      onBack={onBack}
      onChangeSetup={() => setScript(null)}
      onRegenerate={runGenerate}
      regenerating={loading} />;
  }

  return (
    <>
      <div className="ps-top">
        <div>
          <div className="crumb" onClick={onBack}>← Products</div>
          <div className="ps-eyebrow">Call Studio · {product.name}</div>
          <div className="ps-title">Build your call</div>
          <div className="ps-sub">Set the method, audience, and language. Each unique combination is generated once, then saved.</div>
        </div>
      </div>
      <div className="ps-body">
        {loading ? (
          <div className="ps-card"><div className="loading-box">
            <div className="ring" />
            <div className="msg">Writing your {cObj.name.toLowerCase()} script…</div>
            <div className="sub">
              {genProgress ? (
                <>Generating language {genProgress.current} of {genProgress.total}: <b style={{ color: "var(--ink)" }}>{genProgress.langName}</b>. Each language is saved as it finishes.</>
              ) : (
                <>Tailoring {mObj.name} for a {(REGIONS.find((r) => r.id === region) || {}).name} audience. This runs once, then it's saved.</>
              )}
            </div>
            {streamStage && (
              <div className="stream-wrap">
                <div className="stream-status"><span className="dot" />{streamStatus}</div>
                <div className="stream-preview">{streamText || "Waiting for first token…"}</div>
              </div>
            )}
          </div></div>
        ) : (
          <div className="studio-wrap">
            <div className="sel-block">
              <div className="sel-head">1 · Call type</div>
              <div className="ct-grid">
                {CALL_TYPES.map((c) => (
                  <div key={c.id} className={`ctcard ${callType === c.id ? "on" : ""}`} onClick={() => setCallType(c.id)}>
                    <div className="ctnm">{c.name}</div>
                    <div className="ctd">{c.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="sel-block">
              <div className="sel-head">2 · Methodology <span className="sel-note">— only methods that fit a {cObj.name.toLowerCase()} call</span></div>
              <div className="method-grid">
                {applicableMethods.map((m) => (
                  <div key={m.id} className={`method ${method === m.id ? "on" : ""}`} onClick={() => setMethod(m.id)}>
                    <div className="mnm">{m.name}<span className="tone-tag" style={{ background: TONE_COLOR[m.tone], color: "#fff" }}>{m.tone}</span></div>
                    <div className="mbl">{m.blurb}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="sel-block">
              <div className="sel-head">3 · Call length <span className="sel-note">— realistic options for {(CALL_TYPES.find((c) => c.id === callType) || {}).name} + {(METHODS.find((m) => m.id === method) || {}).name}</span></div>
              <div className="pill-row">
                {durationOptions.map((d) => (
                  <div key={d} className={`pill ${duration === d ? "on" : ""}`} onClick={() => setDuration(d)}>{d} min</div>
                ))}
              </div>
              <div className="fhint" style={{ marginTop: 9 }}>{durationHint}</div>
            </div>

            <div className="sel-block">
              <div className="sel-head">4 · Audience &amp; primary language</div>
              <div className="two-sel">
                <div>
                  <label className="flab">Primary language <span className="opt">— the one you'll open with</span></label>
                  <select className="fsel" value={language} onChange={(e) => setLanguage(e.target.value)}>
                    {LANGUAGES.map((l) => <option key={l.id} value={l.id}>{l.name}{l.id !== "en" && l.id !== "hinglish" ? ` · ${l.native}` : l.id === "hinglish" ? " · Hindi+English" : ""}</option>)}
                  </select>
                </div>
                <div>
                  <label className="flab">Audience region</label>
                  <select className="fsel" value={region} onChange={(e) => setRegion(e.target.value)}>
                    {REGIONS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginTop: 14 }}>
                <label className="flab">Buyer persona / ICP</label>
                <select className="fsel" value={persona} onChange={(e) => { setPersona(e.target.value); setPersonaTemplate(null); }}>
                  <option value="General audience">General audience</option>
                  {personaList.map((p) => <option key={p} value={p}>{p}</option>)}
                  <option value="__custom__">Custom persona…</option>
                </select>
                {persona === "__custom__" && (
                  <input className="finp" style={{ marginTop: 8 }} placeholder="Describe the buyer, e.g. 'price-sensitive kirana shop owner'" value={customPersona} onChange={(e) => setCustomPersona(e.target.value)} />
                )}
                {personaList.length === 0 && persona !== "__custom__" && <div className="fhint">Tip: add personas on the product so they show up here automatically.</div>}
              </div>

              {/* P2.4: Enhanced persona templates */}
              <div style={{ marginTop: 18 }}>
                <label className="flab">Or pick a detailed persona template</label>
                <div className="persona-grid">
                  {PERSONA_TEMPLATES.map((pt) => (
                    <div
                      key={pt.id}
                      className={`persona-card ${personaTemplate?.id === pt.id ? "on" : ""}`}
                      onClick={() => { setPersonaTemplate(pt); setPersona(pt.label); setShowPersonaDetail(true); }}
                    >
                      <div className="persona-emoji">{pt.emoji}</div>
                      <div className="persona-name">{pt.label}</div>
                      <div className="persona-title">{pt.title}</div>
                    </div>
                  ))}
                </div>
                {personaTemplate && showPersonaDetail && (
                  <div className="persona-detail">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{personaTemplate.emoji} {personaTemplate.label}</div>
                        <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>{personaTemplate.title} · {personaTemplate.industry} · {personaTemplate.companySize}</div>
                      </div>
                      <button className="ps-btn ghost sm" onClick={() => setShowPersonaDetail(false)}>Hide</button>
                    </div>
                    <div className="persona-field"><b>Pain points:</b> {personaTemplate.painPoints}</div>
                    <div className="persona-field"><b>Personality:</b> {personaTemplate.personality}</div>
                    <div className="persona-field"><b>Communication:</b> {personaTemplate.communication}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="sel-block">
              <div className="sel-head">5 · Generate in which languages? <span className="sel-note">— so reps can switch mid-call if the buyer switches</span></div>
              <div className="lang-modes">
                <div className={`lang-mode ${langMode === "single" ? "on" : ""}`} onClick={() => setLangMode("single")}>
                  <div className="lm-h">🗣 Just the primary language</div>
                  <div className="lm-b">Fastest and cheapest. One script in {lObj.name}.</div>
                </div>
                <div className={`lang-mode ${langMode === "team" ? "on" : ""} ${teamLanguages.length === 0 ? "dis" : ""}`} onClick={() => teamLanguages.length && setLangMode("team")}>
                  <div className="lm-h">👥 All team languages {teamLanguages.length > 0 && <span className="chip n" style={{ marginLeft: 6 }}>{teamLanguages.length}</span>}</div>
                  <div className="lm-b">{teamLanguages.length === 0 ? "Add teammates with languages under Team first." : `Generates in every language your team speaks: ${teamLanguages.map((id) => (LANGUAGES.find((l) => l.id === id) || {}).name).join(", ")}.`}</div>
                </div>
                <div className={`lang-mode ${langMode === "custom" ? "on" : ""}`} onClick={() => setLangMode("custom")}>
                  <div className="lm-h">🎛 Pick specific languages</div>
                  <div className="lm-b">Choose exactly which languages to generate right now.</div>
                </div>
              </div>
              {langMode === "custom" && (
                <div className="pill-row" style={{ marginTop: 12 }}>
                  {LANGUAGES.map((l) => {
                    const on = customLangs.includes(l.id) || l.id === language;
                    const primary = l.id === language;
                    return (
                      <div key={l.id}
                        className={`pill ${on ? "on" : ""} ${primary ? "primary" : ""}`}
                        title={primary ? "Primary language — always generated" : ""}
                        onClick={() => {
                          if (primary) return;
                          setCustomLangs((cs) => cs.includes(l.id) ? cs.filter((x) => x !== l.id) : [...cs, l.id]);
                        }}>
                        {primary ? "★ " : ""}{l.name}
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="lang-summary">
                Will generate <b>{languagesToGenerate.length}</b> script{languagesToGenerate.length === 1 ? "" : "s"}:{" "}
                {languagesToGenerate.map((id) => (LANGUAGES.find((l) => l.id === id) || {}).name).filter(Boolean).join(", ")}.
                {languagesToGenerate.length > 1 && <span style={{ color: "var(--faint)" }}> Each is a separate save and takes a few seconds.</span>}
              </div>
            </div>

            <div className="sel-block">
              <div className="sel-head">6 · Delivery style</div>
              <div className="pill-row">
                {DELIVERY.map((d) => (
                  <div key={d.id} className={`pill ${delivery === d.id ? "on" : ""}`} onClick={() => setDelivery(d.id)} title={d.note}>{d.name}</div>
                ))}
                <div className={`pill toggle ${simple ? "on" : ""}`} onClick={() => setSimple((s) => !s)}>
                  {simple ? "✓ " : ""}Simple, everyday language
                </div>
              </div>
              <div className="fhint" style={{ marginTop: 9 }}>{(DELIVERY.find((d) => d.id === delivery) || {}).note}. {simple ? "Plain, easy words — good for warm, natural calls." : "Professional phrasing."}</div>
            </div>

            {error && <div className="err">{error}</div>}

            <div className="genbar">
              <div className="summary">
                <b>{mObj.name}</b> · {cObj.name} · {duration}m · {lObj.name} · {(REGIONS.find((r) => r.id === region) || {}).name}
                {savedExists && <> — <span className="saved-tag">✓ saved script ready</span></>}
              </div>
              {checking ? (
                <button className="ps-btn ghost" disabled><span className="spinner dark" /> Checking…</button>
              ) : savedExists ? (
                <button className="ps-btn pri" onClick={async () => setScript((await S.get(key))?.data)}>Open saved script →</button>
              ) : (
                <button className="ps-btn pri" onClick={runGenerate}>Generate script</button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

