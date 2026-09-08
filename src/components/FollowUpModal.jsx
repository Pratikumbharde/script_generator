import React, { useState, useEffect, useRef } from "react";
import { Mail, Copy, RefreshCw, Save, X, Loader2, ExternalLink, Check } from "lucide-react";
import { getFollowUp, generateFollowUp, saveFollowUp } from "../api/client.js";
import LimitedInput from "./shared/LimitedInput.jsx";
import LimitedTextarea from "./shared/LimitedTextarea.jsx";

/* ============================================================
   FollowUpModal — AI-generated post-call follow-up email.

   Reused from three entry points (Call Analysis, Scheduled Calls,
   Cockpit outcome card). Flow: open → load saved draft; if none,
   generate once with AI → rep edits → Save / Copy / open a
   compose window in Gmail or Outlook. Nothing is ever sent by
   the app — the compose windows are prefilled, that's all.

   Only an explicit Regenerate replaces the saved draft, and only
   after confirmation when the rep has unsaved edits.
   ============================================================ */

const SUBJECT_MAX = 200;
const BODY_MAX = 5000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function FollowUpModal({ scriptId, recipient: recipientProp = null, prospect = null, onClose, onSaved }) {
  const [phase, setPhase] = useState("loading"); // loading | working | ready | error
  const [error, setError] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  // Recipient is an editable field: prefilled from the scheduled call when
  // known, otherwise the rep types it here — which is what unlocks the
  // Gmail/Outlook compose buttons.
  const [recipient, setRecipient] = useState(recipientProp || "");
  const [saved, setSaved] = useState(false);
  const [confirmRegen, setConfirmRegen] = useState(false);

  const emailValid = EMAIL_RE.test(recipient.trim());

  // Last saved/loaded state — the dirty check for the regenerate confirmation.
  const savedRef = useRef({ subject: "", body: "" });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const d = await getFollowUp(scriptId);
        if (!alive) return;
        if (d.recipient && !recipientProp) setRecipient((r) => r || d.recipient);
        if (d.subject && d.body) {
          setSubject(d.subject);
          setBody(d.body);
          savedRef.current = { subject: d.subject, body: d.body };
          setPhase("ready");
        } else {
          // No saved draft — the button promised a draft, so generate one.
          await doGenerate();
        }
      } catch (e) {
        if (!alive) return;
        setError(e.message || "Could not load the follow-up draft.");
        setPhase("error");
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptId]);

  async function doGenerate() {
    setPhase("working");
    setError("");
    try {
      const d = await generateFollowUp(scriptId, {
        prospect_email: recipientProp || recipient.trim() || undefined,
        prospect_name: prospect?.name || undefined,
        prospect_company: prospect?.company || undefined,
      });
      setSubject(d.subject);
      setBody(d.body);
      if (d.recipient && !recipient.trim()) setRecipient(d.recipient);
      savedRef.current = { subject: d.subject, body: d.body };
      setPhase("ready");
    } catch (e) {
      setError(e.message || "Generation failed. Please try again.");
      setPhase("error");
    }
  }

  const dirty = subject !== savedRef.current.subject || body !== savedRef.current.body;

  const handleRegenerateClick = () => {
    if (dirty) setConfirmRegen(true);
    else doGenerate();
  };

  const handleSave = async () => {
    setError("");
    try {
      const d = await saveFollowUp(scriptId, { subject, body });
      savedRef.current = { subject: d.subject, body: d.body };
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      if (onSaved) onSaved(d);
    } catch (e) {
      setError(e.message || "Save failed. Please try again.");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${subject}\n\n${body}`);
      setSaved(false);
      setError("");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { setError("Could not copy — please select the text manually."); }
  };

  const [copied, setCopied] = useState(false);

  const openCompose = (provider) => {
    if (!emailValid) return;
    const to = `to=${encodeURIComponent(recipient.trim())}`;
    const bd = `body=${encodeURIComponent(body)}`;
    // Gmail's compose param for the subject is `su`; Outlook's is `subject`.
    const url = provider === "gmail"
      ? `https://mail.google.com/mail/?view=cm&fs=1&${to}&su=${encodeURIComponent(subject)}&${bd}`
      : `https://outlook.office.com/mail/deeplink/compose?${to}&subject=${encodeURIComponent(subject)}&${bd}`;
    window.open(url, "_blank", "noopener");
  };

  const busy = phase === "loading" || phase === "working";

  return (
    <div className="overlay" onClick={() => !busy && onClose()}>
      <div className="modal" style={{ maxWidth: 640, width: "100%" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 18 }}>
            <Mail size={18} style={{ marginRight: 8, verticalAlign: "-3px" }} />Follow-up email
          </div>
          <button className="ps-btn ghost sm" onClick={onClose} disabled={busy} title="Close">
            <X size={14} />
          </button>
        </div>

        {busy && (
          <div className="loading-box" style={{ padding: 28 }}>
            <Loader2 size={28} className="ca-spin" style={{ color: "var(--accent)" }} />
            <div className="msg" style={{ fontSize: 14, marginTop: 10 }}>
              {phase === "loading" ? "Loading draft…" : "AI is writing your follow-up email…"}
            </div>
            <div className="fhint" style={{ marginTop: 4 }}>This may take 15–30 seconds.</div>
          </div>
        )}

        {!busy && (
          <>
            <div className="frow" style={{ marginBottom: 12 }}>
              <label className="flab">To (prospect email)</label>
              <LimitedInput
                className="finp"
                maxLength={300}
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="prospect@company.com"
                type="email"
                style={recipient && !emailValid ? { borderColor: "#B23237" } : {}}
              />
              {recipient && !emailValid && (
                <div style={{ color: "#B23237", fontSize: 12, marginTop: 4 }}>Enter a valid email address.</div>
              )}
            </div>

            {error && <div className="err" style={{ marginBottom: 10 }}>{error}</div>}

            <div className="frow" style={{ marginBottom: 12 }}>
              <label className="flab">Subject</label>
              <LimitedInput
                className="finp"
                maxLength={SUBJECT_MAX}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject…"
              />
            </div>
            <div className="frow" style={{ marginBottom: 4 }}>
              <label className="flab">Email body</label>
              <LimitedTextarea
                className="finp"
                maxLength={BODY_MAX}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Email body…"
                style={{ minHeight: 240, resize: "vertical", width: "100%", fontSize: 14, lineHeight: 1.6 }}
              />
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end", marginTop: 16 }}>
              <button className="ps-btn ghost" onClick={onClose} disabled={busy}>Close</button>
              <button className="ps-btn ghost" onClick={handleCopy} disabled={!subject.trim() || !body.trim()}>
                {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
              </button>
              <button className="ps-btn ghost" onClick={handleRegenerateClick} title="Generate a fresh AI draft">
                <RefreshCw size={14} /> Regenerate
              </button>
              <button className="ps-btn pri" onClick={handleSave} disabled={!subject.trim() || !body.trim()}>
                {saved ? <><Check size={14} /> Saved</> : <><Save size={14} /> Save Draft</>}
              </button>
              <button
                className="ps-btn ghost"
                onClick={() => openCompose("outlook")}
                disabled={!emailValid}
                title={emailValid ? "Open an Outlook compose window" : "Enter the prospect's email above first"}
              >
                <ExternalLink size={14} /> Outlook
              </button>
              <button
                className="ps-btn pri"
                onClick={() => openCompose("gmail")}
                disabled={!emailValid}
                title={emailValid ? "Open a Gmail compose window" : "Enter the prospect's email above first"}
              >
                <ExternalLink size={14} /> Gmail
              </button>
            </div>
            <div className="fhint" style={{ marginTop: 10 }}>
              {!emailValid
                ? <>Enter the prospect's email in the <b>To</b> field above to unlock Gmail / Outlook — meanwhile Save and Copy work.</>
                : <>Gmail / Outlook only open a prefilled compose window — nothing is sent until you press send there.</>}
            </div>
          </>
        )}

        {/* Regenerate confirmation — only shown when the draft has unsaved edits */}
        {confirmRegen && (
          <div className="overlay" onClick={() => setConfirmRegen(false)}>
            <div className="modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 17, marginBottom: 8 }}>Regenerate email?</div>
              <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.55, marginBottom: 18 }}>
                Your current edits will be replaced.
              </p>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button className="ps-btn ghost" onClick={() => setConfirmRegen(false)}>Cancel</button>
                <button
                  className="ps-btn pri"
                  onClick={() => { setConfirmRegen(false); doGenerate(); }}
                >
                  <RefreshCw size={14} /> Regenerate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}