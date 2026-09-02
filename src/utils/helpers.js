import {
  getSettings, updateSettings,
  listProducts, createProduct,
  listStaff, createStaff,
  listScripts, createScript, updateScript,
} from '../api/client.js'
import {
  METHODS, CALL_TYPES, LANGUAGES, REGIONS, DELIVERY,
} from '../data/constants.js'

export const S = {
  async get(key) {
    if (key === "psettings:company") {
      const s = await getSettings();
      return { name: s.company_name || "" };
    }
    if (key.startsWith("pscript:")) {
      const scripts = await listScripts();
      const rec = scripts.find((s) => (s.key || scriptKey(s.meta.productId, s.meta)) === key);
      if (rec) return {
        id: rec.id,
        data: { ...rec.data, id: rec.id },
        savedAt: rec.savedAt || rec.saved_at || 0,
        meta: rec.meta,
        outcome: rec.outcome || 'pending',
        notes: rec.notes || '',
        usedAt: rec.used_at || null,
      };
    }
    return null;
  },
  async set(key, val) {
    if (key === "psettings:company") {
      await updateSettings(val.name);
      return true;
    }
    if (key.startsWith("pproduct:")) {
      await createProduct(val);
      return true;
    }
    if (key.startsWith("pstaff:")) {
      await createStaff({ name: val.name, role: val.role, languages: val.languages || [] });
      return true;
    }
    if (key.startsWith("pscript:")) {
      const { data, savedAt, meta } = val;
      await createScript({
        product_id: meta.productId,
        method: meta.method,
        call_type: meta.callType,
        duration: meta.duration,
        language: meta.language,
        region: meta.region,
        delivery: meta.delivery,
        simple: meta.simple,
        persona: meta.persona,
        opening: data.opening,
        tone_level: data.toneLevel,
        tone_guidance: data.toneGuidance,
        segments: data.segments,
        objections: data.objections,
        saved_at: savedAt || Date.now(),
      });
      return true;
    }
    return false;
  },
  async del(key) {
    if (key.startsWith("pproduct:")) {
      const id = key.replace("pproduct:", "");
      await deleteProduct(id);
      return;
    }
    if (key.startsWith("pstaff:")) {
      const id = key.replace("pstaff:", "");
      await deleteStaff(id);
      return;
    }
    if (key.startsWith("pscript:")) {
      const scripts = await listScripts();
      const rec = scripts.find((s) => (s.key || scriptKey(s.meta.productId, s.meta)) === key);
      if (rec) await deleteScript(rec.id);
      return;
    }
  },
  async list(prefix) {
    if (prefix === "pproduct:") return listProducts();
    if (prefix === "pstaff:") return listStaff();
    return [];
  },
  async listKeys(prefix) {
    if (prefix === "pscript:") {
      const scripts = await listScripts();
      return scripts.map((s) => s.key || scriptKey(s.meta.productId, s.meta));
    }
    return [];
  },
};

export const slug = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const scriptKey = (pid, o) =>
  `pscript:${pid}:${o.method}:${o.callType}:${o.duration}:${o.language}:${o.region}:${o.delivery}:${o.simple ? "s" : "p"}:${slug(o.persona) || "general"}`;

export function safeParseJSON(raw) {
  let s = String(raw || "").replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = s.indexOf("{");
  if (start > 0) s = s.slice(start);
  if (start === -1) throw new Error("No JSON found in response.");
  try { return JSON.parse(s); } catch (_) { /* fall through to repair */ }

  const safeEnds = [];
  let inStr = false, esc = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === "}" || ch === "]") safeEnds.push(i);
  }
  for (let e = safeEnds.length - 1; e >= 0; e--) {
    const candidate = s.slice(0, safeEnds[e] + 1);
    const closed = closeOpenStructures(candidate);
    if (closed) { try { return JSON.parse(closed); } catch (_) {} }
  }
  throw new Error("Could not parse the generated script.");
}

export function closeOpenStructures(str) {
  const stack = [];
  let inStr = false, esc = false;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === "{" || ch === "[") stack.push(ch);
    else if (ch === "}" || ch === "]") stack.pop();
  }
  if (inStr) return null;
  let out = str.replace(/,\s*$/, "");
  for (let i = stack.length - 1; i >= 0; i--) out += stack[i] === "{" ? "}" : "]";
  return out;
}

export const nameOf = (arr, id) => (arr.find((x) => x.id === id) || {}).name || id;

export async function updateScriptMeta(key, { outcome, notes, usedAt }) {
  const scripts = await listScripts();
  const rec = scripts.find((s) => (s.key || scriptKey(s.meta.productId, s.meta)) === key);
  if (!rec) return null;
  const updates = {};
  if (outcome !== undefined) updates.outcome = outcome;
  if (notes !== undefined) updates.notes = notes;
  if (usedAt !== undefined) updates.used_at = usedAt;
  return await updateScript(rec.id, updates);
}

export function parseScriptKey(k) {
  const parts = k.replace("pscript:", "").split(":");
  const pid = parts[0];
  const [method, callType, duration, language, region, delivery, simpleFlag, personaSlug] = parts.slice(1);
  return { productId: pid, method, callType, duration: Number(duration), language, region, delivery, simple: simpleFlag === "s", persona: personaSlug?.replace(/-/g, " ") || "general" };
}

function getAuthHeader() {
  const token = localStorage.getItem("ps_token") || "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function callModel(system, prompt) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      stream: false,
      think: false,
      options: { num_ctx: 16384, num_predict: 16384 },
    }),
  });
  if (!res.ok) throw new Error(`Generation service returned ${res.status}. Try again in a moment.`);
  const data = await res.json();
  return data.message?.content || data.response || "";
}

export async function callModelStream(system, prompt, onChunk) {
  const res = await fetch("/api/chat/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      stream: true,
      think: false,
      options: { num_ctx: 16384, num_predict: 16384 },
    }),
  });
  if (!res.ok) {
    let detail = "";
    try {
      const errBody = await res.json();
      detail = errBody.error || "";
    } catch (_) {}
    const status = res.status;
    if (status === 404) {
      throw new Error(`Generation service returned 404 — the configured AI model may not be available, or the endpoint is not reachable. Check your AI provider settings in Admin > Settings.`);
    }
    throw new Error(`Generation service returned ${status}${detail ? ": " + detail : ""}. Try again in a moment.`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop(); // keep incomplete line

    for (const line of lines) {
      if (!line.trim()) continue;
      // Handle SSE format (data: {...}) and raw NDJSON
      const jsonLine = line.replace(/^data:\s*/, "").trim();
      if (jsonLine === "[DONE]") continue;
      try {
        const data = JSON.parse(jsonLine);
        if (data.done) continue;
        const chunk = data.message?.content || data.response || "";
        if (chunk) {
          fullText += chunk;
          onChunk(fullText, chunk);
        }
      } catch (_) {
        // ignore incomplete JSON lines
      }
    }
  }

  return fullText;
}

export function formatVoiceDNA(profile) {
  if (!profile) return "";
  // If it's a plain string (legacy raw text), use it directly but cap it
  if (typeof profile === "string") {
    return profile.trim()
      ? `\nCOMPANY VOICE CONTEXT (match this tone, vocabulary, and phrasing):\n${profile.slice(0, 3000)}\n`
      : "";
  }
  // Structured Voice DNA profile — format it for the prompt
  const lines = ["\nCOMPANY VOICE DNA:"];
  if (profile.tone) lines.push(`- Tone: ${profile.tone}`);
  if (profile.formality) lines.push(`- Formality: ${profile.formality}`);
  if (profile.communication_style) lines.push(`- Communication style: ${profile.communication_style}`);
  if (profile.sentence_style) lines.push(`- Sentence style: ${profile.sentence_style}`);
  if (profile.preferred_vocabulary) lines.push(`- Preferred vocabulary: ${profile.preferred_vocabulary}`);
  if (profile.avoid_vocabulary) lines.push(`- Avoid vocabulary: ${profile.avoid_vocabulary}`);
  if (profile.messaging_patterns) lines.push(`- Messaging patterns: ${profile.messaging_patterns}`);
  if (profile.brand_terminology) lines.push(`- Brand terminology: ${profile.brand_terminology}`);
  if (profile.guidelines) lines.push(`- Guidelines: ${profile.guidelines}`);
  lines.push("Follow this company voice naturally. Do not copy source material verbatim.\n");
  return lines.length > 2 ? lines.join("\n") : "";
}

export async function generateScriptStream(opts, onProgress) {
  const { product, method, callType, duration, voiceContext, learnedContext } = opts;
  const segHint = duration <= 15 ? "3-4" : duration <= 30 ? "4-5" : "5-6";
  const style = styleBlock(opts);

  const voiceLine = formatVoiceDNA(voiceContext);

  const learnedLine = learnedContext
    ? `\nLEARNED PATTERNS (based on ${learnedContext.sampleSize || ''} real calls):\n${learnedContext.insights?.map(i => `- ${i}`).join('\n') || ''}\n${learnedContext.adjustments ? `Optimal duration: ${learnedContext.adjustments.optimalDuration || 'N/A'} min. Recommended persona: ${learnedContext.adjustments.recommendedPersona || 'N/A'}. Key objections: ${learnedContext.adjustments.keyObjections?.join(', ') || 'N/A'}.` : ''}\nApply these patterns to make the script more effective.\n`
    : "";

  const corePrompt = `Write the core of a live call script for a sales rep.

${productBlock(product)}

CALL SETUP
Methodology: ${method.name} (${method.tone} tone) — ${method.blurb}
Call type: ${callType.name}
Total length: ${duration} minutes

${style}${voiceLine}

The opening, questions, and flow must genuinely reflect how a ${method.name} practitioner runs a ${callType.name.toLowerCase()} call for this buyer. Use the real product details — no placeholders. Keep spoken lines short and easy to say.${learnedLine}

Return ONLY minified JSON of this exact shape (all text in the chosen language, except "do" notes which may stay short):
{"opening":"exact first line, word for word","toneLevel":"Consultative|Assertive|Aggressive|Methodical","toneGuidance":"1-2 sentences on when to push vs pull","segments":[{"label":"short phase name","start":0,"end":5,"goal":"one-sentence objective (coaching, not spoken)","say":["exact words to speak"],"ask":["exact question to speak"],"do":["silent coaching note — what to listen for or do"]}]}

Give ${segHint} segments whose start/end cover 0 to ${duration} with no gaps or overlaps. Each segment: 2-3 "say", 2-3 "ask", and 1-2 "do" items, each under 22 words. Output ONLY the JSON.`;

  const objPrompt = `List the most likely objections for this sales call and how to answer them.

${productBlock(product)}

Methodology: ${method.name} (${method.tone} tone). Call type: ${callType.name}.
${style}${voiceLine}

The "objection" is what the buyer says (in the chosen language). The "response" is exactly what the rep says back, in the chosen language and delivery style.

Return ONLY minified JSON of this exact shape:
{"objections":[{"objection":"what the buyer says","response":"exact words the rep says back, under 45 words"}]}

Give exactly 6 objections realistic for this buyer and region. Output ONLY the JSON.`;

  onProgress({ stage: "core", status: "Analyzing product & methodology…", text: "" });

  let coreText = "";
  let streamFailed = false;
  try {
    coreText = await callModelStream(SYS, corePrompt, (full, chunk) => {
      onProgress({ stage: "core", status: "Writing call segments…", text: full });
    });
  } catch (err) {
    // Streaming not available — fall back to non-streaming silently
    streamFailed = true;
    onProgress({ stage: "core", status: "Writing call segments… (fallback mode)", text: "" });
    coreText = await callModel(SYS, corePrompt);
  }

  onProgress({ stage: "objections", status: "Preparing objection responses…", text: coreText });

  let objText = "";
  try {
    if (streamFailed) {
      objText = await callModel(SYS, objPrompt);
    } else {
      objText = await callModelStream(SYS, objPrompt, (full, chunk) => {
        onProgress({ stage: "objections", status: "Preparing objection responses…", text: coreText });
      });
    }
  } catch (err) {
    // Fallback for objections too
    try { objText = await callModel(SYS, objPrompt); } catch (_) { objText = ""; }
  }

  const core = safeParseJSON(coreText);
  if (!core.segments || !Array.isArray(core.segments) || core.segments.length === 0) {
    throw new Error("The script came back incomplete. Please try generating again.");
  }
  let objections = [];
  try { objections = safeParseJSON(objText).objections || []; } catch (_) { objections = []; }

  return {
    opening: core.opening || "",
    toneLevel: core.toneLevel || method.tone,
    toneGuidance: core.toneGuidance || "",
    segments: core.segments,
    objections,
  };
}

export function productBlock(p) {
  return `PRODUCT
Name: ${p.name}
Category: ${p.category || "n/a"}
One-liner: ${p.oneLiner || "n/a"}
What it does: ${p.description || "n/a"}
Ideal customer: ${p.idealCustomer || "n/a"}
Key pains it solves: ${p.painPoints || "n/a"}
Differentiators: ${p.differentiators || "n/a"}
Pricing model: ${p.priceModel || "n/a"}
Proof points: ${p.proofPoints || "n/a"}
Main competitors: ${p.competitors || "n/a"}`;
}

export const SYS = `You are an elite sales coach who writes precise, ready-to-read call scripts. You know every major sales methodology cold and adapt tone, pacing, and question style to each one. You output ONLY valid minified JSON — no markdown, no code fences, no commentary. Keep every line tight so the whole JSON fits comfortably in your response.`;

export function styleBlock({ language, region, delivery, simple, persona, personaDetail }) {
  const lang = LANGUAGES.find((l) => l.id === language) || LANGUAGES[0];
  const reg = REGIONS.find((r) => r.id === region) || REGIONS[0];
  const del = DELIVERY.find((d) => d.id === delivery) || DELIVERY[1];
  const langLine =
    lang.id === "en" ? "Write everything the rep says in natural English."
    : lang.id === "hinglish" ? "Write everything the rep says in Hinglish — natural spoken Hindi-English mix as used on real Indian sales calls, written in Latin script (e.g. 'Sir, main aapka 2 minute le sakta hoon?'). Keep it conversational, not formal."
    : `Write everything the rep says in ${lang.name} (${lang.native}), in that language's native script. Use natural, spoken, everyday ${lang.name} — how a real salesperson actually talks, not textbook language.`;

  let personaLine;
  if (personaDetail && personaDetail.label) {
    const pd = personaDetail;
    personaLine = `Buyer persona: ${pd.label} (${pd.title}).\n` +
      `  - Industry: ${pd.industry}\n` +
      `  - Company size: ${pd.companySize}\n` +
      `  - Pain points: ${pd.painPoints}\n` +
      `  - Personality: ${pd.personality}\n` +
      `  - Communication style: ${pd.communication}\n` +
      `  Tailor every question, example, and transition specifically to this buyer.`;
  } else if (persona && persona !== "General audience") {
    personaLine = `Buyer persona / ICP for THIS call: ${persona}. Tailor the questions, examples, pace, and pressure specifically to this buyer.`;
  } else {
    personaLine = "Buyer: a general prospect for this product.";
  }

  return `LOCALISATION & TONE
- ${langLine}
- Audience region: ${reg.name}. Fit the culture, formality, greetings, and examples to this region. Use local currency and realistic local references. For India especially, respect relationship-building and avoid an aggressive Western hard-sell unless the delivery style says otherwise.
- Delivery style: ${del.name} — ${del.note}. Blend this with the methodology; the delivery style wins on how hard to push.
- ${simple ? "Use SIMPLE, everyday language. Short sentences. Plain words. Nothing that sounds corporate, complex, or translated." : "Professional but clear language."}
- ${personaLine}
- IMPORTANT: "say" and "ask" items are spoken WORD-FOR-WORD by the rep, in the chosen language. "do" items are silent coaching notes for the rep (what to listen for or do) and are NEVER read aloud — keep those concise.`;
}

export async function generateScript(opts) {
  const { product, method, callType, duration, voiceContext, learnedContext } = opts;
  const segHint = duration <= 15 ? "3-4" : duration <= 30 ? "4-5" : "5-6";
  const style = styleBlock(opts);

  const voiceLine = formatVoiceDNA(voiceContext);

  const learnedLine = learnedContext
    ? `\nLEARNED PATTERNS (based on ${learnedContext.sampleSize || ''} real calls):\n${learnedContext.insights?.map(i => `- ${i}`).join('\n') || ''}\n${learnedContext.adjustments ? `Optimal duration: ${learnedContext.adjustments.optimalDuration || 'N/A'} min. Recommended persona: ${learnedContext.adjustments.recommendedPersona || 'N/A'}. Key objections: ${learnedContext.adjustments.keyObjections?.join(', ') || 'N/A'}.` : ''}\nApply these patterns to make the script more effective.\n`
    : "";

  const corePrompt = `Write the core of a live call script for a sales rep.

${productBlock(product)}

CALL SETUP
Methodology: ${method.name} (${method.tone} tone) — ${method.blurb}
Call type: ${callType.name}
Total length: ${duration} minutes

${style}${voiceLine}

The opening, questions, and flow must genuinely reflect how a ${method.name} practitioner runs a ${callType.name.toLowerCase()} call for this buyer. Use the real product details — no placeholders. Keep spoken lines short and easy to say.${learnedLine}

Return ONLY minified JSON of this exact shape (all text in the chosen language, except "do" notes which may stay short):
{"opening":"exact first line, word for word","toneLevel":"Consultative|Assertive|Aggressive|Methodical","toneGuidance":"1-2 sentences on when to push vs pull","segments":[{"label":"short phase name","start":0,"end":5,"goal":"one-sentence objective (coaching, not spoken)","say":["exact words to speak"],"ask":["exact question to speak"],"do":["silent coaching note — what to listen for or do"]}]}

Give ${segHint} segments whose start/end cover 0 to ${duration} with no gaps or overlaps. Each segment: 2-3 "say", 2-3 "ask", and 1-2 "do" items, each under 22 words. Output ONLY the JSON.`;

  const objPrompt = `List the most likely objections for this sales call and how to answer them.

${productBlock(product)}

Methodology: ${method.name} (${method.tone} tone). Call type: ${callType.name}.
${style}${voiceLine}

The "objection" is what the buyer says (in the chosen language). The "response" is exactly what the rep says back, in the chosen language and delivery style.

Return ONLY minified JSON of this exact shape:
{"objections":[{"objection":"what the buyer says","response":"exact words the rep says back, under 45 words"}]}

Give exactly 6 objections realistic for this buyer and region. Output ONLY the JSON.`;

  const [coreText, objText] = await Promise.all([
    callModel(SYS, corePrompt),
    callModel(SYS, objPrompt).catch(() => ""),
  ]);

  const core = safeParseJSON(coreText);
  if (!core.segments || !Array.isArray(core.segments) || core.segments.length === 0) {
    throw new Error("The script came back incomplete. Please try generating again.");
  }
  let objections = [];
  try { objections = safeParseJSON(objText).objections || []; } catch (_) { objections = []; }

  return {
    opening: core.opening || "",
    toneLevel: core.toneLevel || method.tone,
    toneGuidance: core.toneGuidance || "",
    segments: core.segments,
    objections,
  };
}

/* ---------- P4: AI Sales Copilot helpers ---------- */
export function matchObjection(input, objections, threshold = 0.3) {
  const clean = (s) => s.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
  const inputWords = new Set(clean(input).split(" "));
  if (inputWords.size === 0) return [];

  const scored = objections.map((o) => {
    const objWords = new Set(clean(o.objection || "").split(" "));
    const intersection = [...inputWords].filter((w) => objWords.has(w) && w.length > 2);
    const union = new Set([...inputWords, ...objWords]);
    const score = union.size > 0 ? intersection.length / union.size : 0;
    return { ...o, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.filter((o) => o.score >= threshold);
}

export function parseCompetitors(competitorsText) {
  if (!competitorsText) return [];
  return competitorsText.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
}

export function parseDifferentiators(diffText) {
  if (!diffText) return [];
  return diffText.split(/[,\n]/).map((s) => s.trim()).filter(Boolean).map((s) => {
    const parts = s.split(":");
    if (parts.length >= 2) return { title: parts[0].trim(), body: parts.slice(1).join(":").trim() };
    return { title: s, body: "" };
  });
}

export function normalizeSegments(segs, duration) {
  if (!Array.isArray(segs) || segs.length === 0) {
    return [{ label: "Call", start: 0, end: duration, goal: "", say: [], ask: [], do: [] }];
  }
  const n = segs.length;
  return segs.map((s, i) => {
    let start = Number(s.start), end = Number(s.end);
    if (!Number.isFinite(start)) start = Math.round((i / n) * duration);
    if (!Number.isFinite(end)) end = Math.round(((i + 1) / n) * duration);
    if (i === 0) start = 0;
    if (i === n - 1) end = duration;
    if (end <= start) end = start + Math.max(1, Math.round(duration / n));
    return { label: s.label || `Phase ${i + 1}`, start, end, goal: s.goal || "", say: s.say || [], ask: s.ask || [], do: s.do || [] };
  });
}
