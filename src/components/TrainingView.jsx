import React, { useState } from "react";
import { BookOpen } from "lucide-react";
import { METHODS, CALL_TYPES, METHOD_TRAINING, CALLTYPE_TRAINING, COMPARISONS, TONE_COLOR } from "../data/constants.js";

/* ---------- Training ---------- */
export default function TrainingView() {
  const [tab, setTab] = useState("methods"); // methods | calltypes | guides
  const [openMethod, setOpenMethod] = useState(null);
  const [openCallType, setOpenCallType] = useState(null);
  const [openGuide, setOpenGuide] = useState("overview");

  return (
    <>
      <div className="ps-top">
        <div>
          <div className="ps-eyebrow">🎓 Training</div>
          <div className="ps-title"><BookOpen size={22} style={{ marginRight: 8, verticalAlign: "-3px" }} />Learn the craft, not just the tool</div>
          <div className="ps-sub">Deep-dives on every methodology and call type, plus comparison tables to pick the right approach for the customer in front of you.</div>
        </div>
      </div>
      <div className="ps-body">
        <div className="tr-tabs">
          <div className={`tr-tab ${tab === "methods" ? "on" : ""}`} onClick={() => { setTab("methods"); setOpenMethod(null); }}>📚 Methodologies</div>
          <div className={`tr-tab ${tab === "calltypes" ? "on" : ""}`} onClick={() => { setTab("calltypes"); setOpenCallType(null); }}>📞 Call types</div>
          <div className={`tr-tab ${tab === "guides" ? "on" : ""}`} onClick={() => setTab("guides")}>📊 Comparison guides</div>
        </div>

        {tab === "methods" && !openMethod && (
          <>
            <p className="tr-intro">Every method below is a different theory of how buyers actually decide. Pick one to see the logic, why it converts, and where deals die.</p>
            <div className="tr-grid">
              {METHODS.map((m) => {
                const t = METHOD_TRAINING[m.id];
                if (!t) return null;
                return (
                  <div key={m.id} className="tr-card" onClick={() => setOpenMethod(m.id)}>
                    <div className="tr-card-top">
                      <span className="tr-emoji">{t.emoji}</span>
                      <span className="tone-tag" style={{ background: TONE_COLOR[m.tone], color: "#fff" }}>{m.tone}</span>
                    </div>
                    <div className="tr-card-name">{m.name}</div>
                    <div className="tr-card-idea">{t.coreIdea}</div>
                    <div className="tr-card-foot">Read the deep-dive →</div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === "methods" && openMethod && <MethodDetail id={openMethod} onBack={() => setOpenMethod(null)} />}

        {tab === "calltypes" && !openCallType && (
          <>
            <p className="tr-intro">A call type is the <b>role</b> a conversation plays in the deal. Same rep, same product — the shape of the call changes.</p>
            <div className="tr-grid">
              {CALL_TYPES.map((c) => {
                const t = CALLTYPE_TRAINING[c.id];
                if (!t) return null;
                return (
                  <div key={c.id} className="tr-card" onClick={() => setOpenCallType(c.id)}>
                    <div className="tr-card-top">
                      <span className="tr-emoji">{t.emoji}</span>
                      <span className="stage-tag">{t.stage} stage</span>
                    </div>
                    <div className="tr-card-name">{c.name}</div>
                    <div className="tr-card-idea">{t.goal}</div>
                    <div className="tr-card-foot">⏱ Typical length: {t.typicalLength} · read more →</div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === "calltypes" && openCallType && <CallTypeDetail id={openCallType} onBack={() => setOpenCallType(null)} />}

        {tab === "guides" && (
          <>
            <div className="guide-tabs">
              {[
                { id: "overview", label: "🗺️ Methods at a glance" },
                { id: "b2c", label: "🏢 B2B vs B2C vs D2C" },
                { id: "segments", label: "📈 Customer segments" },
                { id: "matrix", label: "🎯 Call type × method" },
                { id: "personas", label: "👥 Persona picker" },
                { id: "qualifiers", label: "✅ Qualification frameworks" },
              ].map((g) => (
                <div key={g.id} className={`gtab ${openGuide === g.id ? "on" : ""}`} onClick={() => setOpenGuide(g.id)}>{g.label}</div>
              ))}
            </div>
            <div className="guide-body">
              {openGuide === "overview" && <MethodOverviewTable />}
              {openGuide === "b2c" && <B2CTable />}
              {openGuide === "segments" && <SegmentsTable />}
              {openGuide === "matrix" && <MatrixTable />}
              {openGuide === "personas" && <PersonasTable />}
              {openGuide === "qualifiers" && <QualifiersTable />}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function MethodDetail({ id, onBack }) {
  const m = METHODS.find((x) => x.id === id);
  const t = METHOD_TRAINING[id];
  return (
    <div className="tr-detail">
      <div className="crumb" onClick={onBack}>← All methodologies</div>
      <div className="tr-hero">
        <div className="tr-hero-emoji">{t.emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="tr-hero-name">{m.name}</div>
          <div className="tr-hero-origin">{t.origin}</div>
          <div className="tr-hero-tags">
            <span className="tone-tag" style={{ background: TONE_COLOR[m.tone], color: "#fff" }}>{m.tone} tone</span>
          </div>
        </div>
      </div>

      <div className="tr-block">
        <div className="tr-h">💡 Core idea</div>
        <p className="tr-lead">{t.coreIdea}</p>
      </div>

      <div className="tr-block">
        <div className="tr-h">⚙️ The logic</div>
        <p>{t.logic}</p>
      </div>

      <div className="tr-two">
        <div className="tr-side good">
          <div className="tr-side-h">✅ Why it converts</div>
          <ul>{t.whyItConverts.map((x, i) => <li key={i}>{x}</li>)}</ul>
        </div>
        <div className="tr-side bad">
          <div className="tr-side-h">❌ Why it fails</div>
          <ul>{t.whyItFails.map((x, i) => <li key={i}>{x}</li>)}</ul>
        </div>
      </div>

      <div className="tr-block warn">
        <div className="tr-h">⚠️ Where reps lose the deal</div>
        <ul>{t.whereRepsLose.map((x, i) => <li key={i}>{x}</li>)}</ul>
      </div>

      <div className="tr-two">
        <div className="tr-side">
          <div className="tr-side-h">🎯 Best for</div>
          <p style={{ margin: 0 }}>{t.bestFor}</p>
        </div>
        <div className="tr-side">
          <div className="tr-side-h">🚫 Poor fit for</div>
          <p style={{ margin: 0 }}>{t.poorFor}</p>
        </div>
      </div>

      <div className="tr-signature">
        <div className="tr-h" style={{ color: "#fff" }}>🎤 Signature question</div>
        <p style={{ fontSize: 18, fontFamily: "'Space Grotesk'", margin: 0 }}>{t.signatureQuestion}</p>
      </div>
    </div>
  );
}

function CallTypeDetail({ id, onBack }) {
  const c = CALL_TYPES.find((x) => x.id === id);
  const t = CALLTYPE_TRAINING[id];
  return (
    <div className="tr-detail">
      <div className="crumb" onClick={onBack}>← All call types</div>
      <div className="tr-hero">
        <div className="tr-hero-emoji">{t.emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="tr-hero-name">{c.name}</div>
          <div className="tr-hero-origin">{t.stage} stage · Typical length {t.typicalLength}</div>
        </div>
      </div>

      <div className="tr-block">
        <div className="tr-h">🎯 The goal of this call</div>
        <p className="tr-lead">{t.goal}</p>
      </div>

      <div className="tr-block">
        <div className="tr-h">🗓️ When to use it</div>
        <p>{t.whenToUse}</p>
      </div>

      <div className="tr-block">
        <div className="tr-h">🎬 How to run it</div>
        <ol className="tr-ol">{t.howToRun.map((x, i) => <li key={i}>{x}</li>)}</ol>
      </div>

      <div className="tr-two">
        <div className="tr-side good">
          <div className="tr-side-h">🟢 Good signals</div>
          <ul>{t.goodSignals.map((x, i) => <li key={i}>{x}</li>)}</ul>
        </div>
        <div className="tr-side bad">
          <div className="tr-side-h">🔴 Bad signals</div>
          <ul>{t.badSignals.map((x, i) => <li key={i}>{x}</li>)}</ul>
        </div>
      </div>

      <div className="tr-block warn">
        <div className="tr-h">⚠️ Common mistakes</div>
        <ul>{t.mistakes.map((x, i) => <li key={i}>{x}</li>)}</ul>
      </div>
    </div>
  );
}

function MethodOverviewTable() {
  return (
    <div className="tbl-wrap">
      <div className="tbl-title">🗺️ All 15 methodologies at a glance</div>
      <div className="tbl-sub">Sorted by tone. Read across for what defines each method and where it belongs.</div>
      <div className="tbl-scroll">
        <table className="ptbl">
          <thead><tr><th>Method</th><th>Tone</th><th>Best for</th><th>Signature move</th></tr></thead>
          <tbody>
            {METHODS.slice().sort((a, b) => a.tone.localeCompare(b.tone) || a.name.localeCompare(b.name)).map((m) => {
              const t = METHOD_TRAINING[m.id];
              if (!t) return null;
              return (
                <tr key={m.id}>
                  <td><b>{t.emoji} {m.name}</b></td>
                  <td><span className="tone-tag" style={{ background: TONE_COLOR[m.tone], color: "#fff" }}>{m.tone}</span></td>
                  <td>{t.bestFor}</td>
                  <td className="q">{t.signatureQuestion}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function B2CTable() {
  return (
    <div className="tbl-wrap">
      <div className="tbl-title">🏢 B2B vs 🛍️ B2C vs 📦 D2C</div>
      <div className="tbl-sub">The buyer's world is different. So is the sale.</div>
      <div className="tbl-scroll">
        <table className="ptbl">
          <thead><tr><th></th><th>🏢 B2B</th><th>🛍️ B2C</th><th>📦 D2C</th></tr></thead>
          <tbody>
            {COMPARISONS.b2c.map((r, i) => (
              <tr key={i}><td><b>{r.row}</b></td><td>{r.b2b}</td><td>{r.b2c}</td><td>{r.d2c}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SegmentsTable() {
  return (
    <div className="tbl-wrap">
      <div className="tbl-title">📈 SMB vs Mid-market vs Enterprise vs Consumer</div>
      <div className="tbl-sub">Same product can need four different sales motions across these segments.</div>
      <div className="tbl-scroll">
        <table className="ptbl">
          <thead><tr><th></th><th>🏪 SMB</th><th>🏬 Mid-market</th><th>🏢 Enterprise</th><th>👤 Consumer</th></tr></thead>
          <tbody>
            {COMPARISONS.segments.map((r, i) => (
              <tr key={i}><td><b>{r.row}</b></td><td>{r.smb}</td><td>{r.mid}</td><td>{r.ent}</td><td>{r.cons}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MatrixTable() {
  const rows = ["Discovery", "Qualification", "Demo", "Closing", "Follow-up", "Cold Outreach"];
  return (
    <div className="tbl-wrap">
      <div className="tbl-title">🎯 Which method fits which call type?</div>
      <div className="tbl-sub">A green dot means the method is a natural fit for that call type. Empty means it doesn't belong there.</div>
      <div className="tbl-scroll">
        <table className="ptbl matrix">
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Method \ Call</th>
              {rows.map((r) => <th key={r}>{r}</th>)}
            </tr>
          </thead>
          <tbody>
            {METHODS.map((m) => (
              <tr key={m.id}>
                <td><b>{METHOD_TRAINING[m.id].emoji} {m.name}</b></td>
                {rows.map((r) => (
                  <td key={r} style={{ textAlign: "center" }}>
                    {COMPARISONS.matrix[r][m.id] ? <span className="mx-yes">●</span> : <span className="mx-no">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PersonasTable() {
  return (
    <div className="tbl-wrap">
      <div className="tbl-title">👥 Persona → recommended method</div>
      <div className="tbl-sub">A cheat sheet for matching the person in front of you to the approach that respects how they buy.</div>
      <div className="tbl-scroll">
        <table className="ptbl">
          <thead><tr><th style={{ minWidth: 240 }}>Persona</th><th style={{ minWidth: 180 }}>Try this</th><th>Why</th></tr></thead>
          <tbody>
            {COMPARISONS.personas.map((r, i) => (
              <tr key={i}><td><b>{r.persona}</b></td><td><span className="chip n">{r.method}</span></td><td>{r.why}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function QualifiersTable() {
  return (
    <div className="tbl-wrap">
      <div className="tbl-title">✅ Qualification frameworks compared</div>
      <div className="tbl-sub">Not full selling methods — these tell you if a deal is worth pursuing at all.</div>
      <div className="tbl-scroll">
        <table className="ptbl">
          <thead><tr><th>Framework</th><th>Stands for</th><th>Strength</th><th>Weakness</th><th>Best for</th></tr></thead>
          <tbody>
            {COMPARISONS.qualifiers.map((r, i) => (
              <tr key={i}><td><b>{r.framework}</b></td><td>{r.full}</td><td>{r.strength}</td><td>{r.weakness}</td><td>{r.bestFor}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

