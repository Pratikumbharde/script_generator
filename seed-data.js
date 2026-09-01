import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const db = new Database(path.join(__dirname, 'database.sqlite'))

const USER_ID = 4
const WS_ID = 4

// ─── Products ───
const products = [
  {
    name: 'PitchPro CRM',
    category: 'SaaS',
    one_liner: 'The CRM that closes deals faster',
    description: 'PitchPro is an AI-powered CRM designed for high-velocity sales teams. It automates follow-ups, scores leads in real time, and gives reps call-by-call coaching so they spend less time on admin and more time selling.',
    ideal_customer: 'B2B SaaS companies with 10–200 sales reps who are outgrowing spreadsheets or basic CRMs and need pipeline visibility plus AI coaching.',
    pain_points: 'Reps spend 60% of time on admin instead of selling\nPipeline forecasting is unreliable\nManagers have no visibility into call quality\nFollow-ups fall through the cracks',
    differentiators: 'AI-powered call coaching built into the CRM\nReal-time lead scoring with 92% accuracy\nOne-click follow-up sequences\nWorks in English and Hinglish out of the box',
    price_model: '₹2,500/rep/month, 14-day free trial, annual discount available',
    proof_points: '3x faster pipeline velocity for FinServ Corp\n40% higher win rate at TechBridge Solutions\n92% forecast accuracy across 200+ teams',
    competitors: 'Salesforce, HubSpot, Freshsales, Zoho CRM, Pipedrive',
    visibility: 'workspace',
  },
  {
    name: 'SecureVault',
    category: 'Cybersecurity',
    one_liner: 'Enterprise-grade security that your team actually uses',
    description: 'SecureVault is a zero-trust access management platform that combines SSO, MFA, and privileged access management in one simple interface. Deploy in 30 minutes, not 30 days.',
    ideal_customer: 'Mid-market companies (200–2000 employees) in regulated industries — fintech, healthcare, B2B SaaS — who need compliance-ready access control without enterprise complexity.',
    pain_points: 'IT team drowning in password reset tickets\nFailed audit due to shared credentials\nNo visibility into who accessed what and when\nCurrent MFA solution has low adoption',
    differentiators: 'Deploy in 30 minutes, not 30 days\nZero-trust by default — no VPN needed\n95%+ user adoption in first month (industry avg is 40%)\nBuilt-in compliance reporting for SOC 2, HIPAA, GDPR',
    price_model: '₹800/user/month, free for up to 10 users, volume discounts above 100',
    proof_points: '97% adoption in 30 days at MedCorp\nPassed SOC 2 Type II audit in 2 weeks\nZero security incidents across 500+ customers',
    competitors: 'Okta, Duo Security, OneLogin, CyberArk, Auth0',
    visibility: 'workspace',
  },
  {
    name: 'DataFlow Analytics',
    category: 'Business Intelligence',
    one_liner: 'From raw data to board-ready dashboards in 5 minutes',
    description: 'DataFlow connects to 50+ data sources, auto-detects anomalies, and creates executive dashboards without SQL or Python. Built for ops leaders who need answers, not another tool to learn.',
    ideal_customer: 'Operations and growth leaders at mid-market companies who spend hours in spreadsheets and still can\'t get a real-time view of their business.',
    pain_points: 'Reports take days to build and are outdated by the time they reach leadership\nThree different teams have three different numbers for the same metric\nAnalyst team is overwhelmed with ad-hoc requests\nNo real-time visibility into churn, revenue, or pipeline',
    differentiators: 'Auto-detects anomalies and sends alerts before you ask\nNatural language queries — no SQL needed\n50+ native connectors (Stripe, HubSpot, Salesforce, PostgreSQL)\nBoard-ready dashboards auto-generated from your data',
    price_model: '₹15,000/month for up to 5 seats, ₹3,000/additional seat, 21-day free trial',
    proof_points: 'Reduced reporting time by 80% at GrowthStack\nCaught a ₹12L billing error in first week at RetailPro\n4.8/5 on G2 with 200+ reviews',
    competitors: 'Tableau, Looker, Metabase, Power BI, Mixpanel',
    visibility: 'workspace',
  },
]

// ─── Staff ───
const staff = [
  { name: 'Priya Sharma', role: 'Senior Account Executive', languages: ['en', 'hi'] },
  { name: 'Ravi Patil', role: 'SDR Team Lead', languages: ['en', 'hi', 'mr'] },
  { name: 'Ananya Desai', role: 'Enterprise Sales Manager', languages: ['en'] },
  { name: 'Karthik Menon', role: 'Inside Sales Rep', languages: ['en', 'hi', 'ta'] },
  { name: 'Neha Gupta', role: 'Sales Development Rep', languages: ['en', 'hi'] },
]

// ─── Scripts (pre-generated) ───
const scripts = [
  {
    product_idx: 0, // PitchPro CRM
    method: 'spin',
    call_type: 'discovery',
    duration: 30,
    language: 'en',
    region: 'india',
    delivery: 'phone',
    simple: 0,
    persona: 'general',
    opening: "Hi [Name], this is [Your Name] from PitchPro. I know you weren't expecting my call — do you have 30 seconds and I'll tell you why I reached out, then you can decide if we should keep talking?",
    tone_level: 'Consultative',
    tone_guidance: 'Lead with genuine curiosity. Ask before you tell. The buyer should feel heard, not sold to.',
    segments: [
      { label: 'Opening & Situation', start: 0, end: 8, goal: 'Build rapport and understand their current setup', say: ["Hi [Name], thanks for picking up — I know you're busy.", "I help sales teams like yours close more deals with less admin — that probably sounds familiar.", "Before I share anything, can I ask — what does your team's current CRM setup look like?"], ask: ["What CRM are you using today?", "How many reps are on the team?"], do: ["Listen for frustration signals — that's your opening", "Note the current tool, you'll use it later"] },
      { label: 'Problem Discovery', start: 8, end: 16, goal: 'Surface specific pain around pipeline visibility and follow-ups', say: ["That makes sense — a lot of teams we work with had the same setup.", "When you say the pipeline is hard to track, what exactly does that look like on a busy week?"], ask: ["How often do follow-ups fall through the cracks?", "What happens when a deal stalls — can you see why?", "How much time does your team spend on data entry vs actual selling?"], do: ["Quantify the pain — get a number if possible", "Listen for emotional language ('frustrating', 'impossible') — that's real pain"] },
      { label: 'Implication', start: 16, end: 24, goal: 'Make the cost of inaction feel real', say: ["So if your team is spending 60% of time on admin, that's basically paying 10 reps but only getting 4 reps' worth of selling.", "If a ₹50L deal slips because no one followed up, what does that do to your quarter?"], ask: ["What's the impact on your forecast when deals go quiet?", "Have you ever lost a deal that you felt was winnable?"], do: ["Connect the pain to revenue — make it tangible", "Don't rush this — the implication is where the urgency builds"] },
      { label: 'Need-Payoff & Close', start: 24, end: 30, goal: 'Let the buyer articulate the value and commit to next step', say: ["If you had a system that handled the follow-ups automatically and gave you real-time pipeline visibility — how would that change your week?", "I think it makes sense for us to do a 15-minute demo — I'll show you exactly how your team would use it. How does Thursday at 2pm look?"], ask: ["If we solved just the follow-up problem, what would that be worth to you?", "Would a 15-minute demo be worth your time?"], do: ["Shut up after the ask — let them think", "Propose a specific time, not 'sometime next week'"] },
    ],
    objections: [
      { objection: "We already use Salesforce and it works fine.", response: "Totally fair — Salesforce is powerful. What we hear from teams that switch is that they were spending more time configuring it than selling from it. Would a 15-minute look be worth it, just to compare?" },
      { objection: "I don't have budget for another tool right now.", response: "I hear you — budget is real. The teams that work with us typically see the ROI in month one because reps sell more and spend less time on admin. If I could show you how a team like yours got 3x pipeline velocity, would a trial be worth exploring?" },
      { objection: "I need to talk to my manager first.", response: "Absolutely — that's the right move. What would help you make the case? I can send you a one-page impact summary that shows the numbers. And would a quick 10-minute call with your manager on the line work?" },
      { objection: "We tried something like this before and it didn't work.", response: "I appreciate the honesty. Can I ask — what specifically didn't work? Was it the tool itself, or the rollout? Because what makes this different is we handle setup in 30 minutes and our adoption rate is 95%." },
      { objection: "Send me an email and I'll look at it later.", response: "Happy to — but honestly, the email will get buried. Can I grab just 10 minutes on your calendar this week? If it's not useful, we part as friends. What does your Thursday look like?" },
      { objection: "We're a small team, we don't need a CRM.", response: "That's actually exactly when a CRM matters most — before the team scales. The teams we work with that started early had a much smoother growth curve. Would a quick look be worth 10 minutes, even just to know what's out there?" },
    ],
  },
  {
    product_idx: 1, // SecureVault
    method: 'challenger',
    call_type: 'cold',
    duration: 5,
    language: 'en',
    region: 'india',
    delivery: 'phone',
    simple: 1,
    persona: 'general',
    opening: "[Name], most security teams I talk to have 40% MFA adoption and they think that's normal. It's not — and it's costing you more than you think.",
    tone_level: 'Assertive',
    tone_guidance: 'Lead with a provocative insight. Challenge the status quo. Take control of the conversation early.',
    segments: [
      { label: 'Hook', start: 0, end: 2, goal: 'Earn attention with a surprising insight', say: ["[Name], this is [Your Name] from SecureVault. Quick question — what percentage of your team actually uses MFA today?"], ask: ["If I told you that number is probably closer to 40% than 90%, would that surprise you?"], do: ["Pause and let them answer — the number is the hook"] },
      { label: 'Reframe', start: 2, end: 4, goal: 'Reframe the problem from IT inconvenience to business risk', say: ["Here's what we see — 40% adoption means 60% of your accounts are one phishing email away from a breach.", "And the reason adoption is low isn't your team — it's the tool. If it takes 5 steps to log in, people skip it."], ask: ["What would a breach cost you — not just money, but customer trust?"], do: ["Make the cost of inaction tangible", "Don't sell yet — let them feel the gap"] },
      { label: 'Close', start: 4, end: 5, goal: 'Propose a specific next step', say: ["We get 95% adoption in 30 days because we make it invisible — one tap, no friction. Can I show you in 10 minutes on Thursday?"], ask: ["Would a 10-minute look be worth your time?"], do: ["Propose a specific time", "Don't ask if — ask when"] },
    ],
    objections: [
      { objection: "We already have Okta.", response: "Okta is solid for enterprise. What we find is that adoption drops when the experience isn't seamless. If your team is still sharing passwords, the tool isn't the issue — it's the experience. Want to see the difference?" },
      { objection: "Security isn't a priority right now.", response: "I understand — it never is until something happens. The teams that call us after a breach always say they wish they'd taken 10 minutes sooner. I'm not asking you to buy anything — just 10 minutes. Thursday at 11?" },
      { objection: "We're too small for this.", response: "Actually, that's exactly when it matters. A breach costs a small company proportionally more than a big one. And our free tier covers up to 10 users — no cost, no risk. Worth a try?" },
    ],
  },
  {
    product_idx: 2, // DataFlow Analytics
    method: 'consultative',
    call_type: 'demo',
    duration: 30,
    language: 'en',
    region: 'us',
    delivery: 'balanced',
    simple: 0,
    persona: 'general',
    opening: "[Name], thanks for making the time today. Before I show you anything, I want to make sure I show you the right thing — can I ask a couple of quick questions about what you're dealing with?",
    tone_level: 'Consultative',
    tone_guidance: 'Diagnose thoroughly before prescribing. The demo should feel like it was built for their specific problems.',
    segments: [
      { label: 'Recap Pain', start: 0, end: 5, goal: 'Confirm what you heard in discovery and get agreement', say: ["Based on our last conversation, your team spends about 3 days building reports that are outdated by Friday.", "And three different teams have three different numbers for MRR — is that still the case?"], ask: ["Is there anything that's changed since we last spoke?", "Are there other stakeholders joining today who should be heard from?"], do: ["Get explicit agreement on the pain before showing anything"] },
      { label: 'Demo — Core Workflow', start: 5, end: 15, goal: 'Show the product solving their exact pain', say: ["Let me show you how DataFlow handles that MRR question — one query, natural language, live result.", "Notice how it flagged that 12% drop in trial conversions — that's an anomaly it caught automatically."], ask: ["Does this look like how your team would use it?", "What would you want to see next?"], do: ["Show outcomes, not clicks", "Pause every 3-4 minutes for reactions"] },
      { label: 'Demo — Collaboration & Alerts', start: 15, end: 22, goal: 'Show team features and proactive intelligence', say: ["Now here's where it gets powerful for your team — everyone sees the same number, updated in real time.", "And you can set alerts so you're notified before a metric drops, not after."], ask: ["How does your team currently handle dashboard requests?", "Who else on the team would benefit from this?"], do: ["Connect each feature back to their stated pain"] },
      { label: 'Value Summary & Close', start: 22, end: 30, goal: 'Summarize value, handle final concerns, get commitment', say: ["So to recap — you'd go from 3 days of manual reporting to real-time dashboards that update themselves.", "Your team all sees the same MRR number, and anomalies are caught before they become problems."], ask: ["What questions do you have before we talk about next steps?", "Would a 14-day trial make sense to see this with your own data?"], do: ["Confirm the specific next step and date"] },
    ],
    objections: [
      { objection: "We already have Tableau.", response: "Tableau is powerful for analysts. What we hear from ops leaders is that it takes a trained analyst 2 days to build a dashboard their team actually uses. DataFlow does it in 5 minutes with no SQL. Want to see the difference?" },
      { objection: "We can build this ourselves.", response: "You absolutely could — and some teams do. The question is time. The average in-house BI project takes 4 months and one dedicated engineer. DataFlow is live in a day. What's 4 months of no visibility costing you?" },
      { objection: "The price seems high for our team size.", response: "I hear you. Let me put it this way — if it saves each of your 5 analysts just 5 hours a week, that's 100 hours a month. What's an hour of analyst time worth to you? For most teams, it pays for itself in week one." },
      { objection: "We need to integrate with [specific tool] first.", response: "Good news — we have a native connector for that, and it takes about 2 minutes to set up. Which tools are you using? I can show you the integration live." },
      { objection: "I need to get buy-in from the CTO.", response: "Totally understand. What would help make the case? I can prepare a one-pager with ROI calculations specific to your team size, and we can do a joint 15-minute call with your CTO. Does next Tuesday work?" },
      { objection: "We're not ready to switch tools right now.", response: "No pressure at all. Can I send you a one-page comparison showing what switching would look like — timeline, migration, the works? That way you have it when you are ready." },
    ],
  },
]

// ─── Seed ───
console.log('Seeding data for admin@pitchstudio.io (user_id=4, workspace_id=4)...\n')

// Insert products
const productIds = []
for (const p of products) {
  const result = db.prepare(`
    INSERT INTO products (user_id, workspace_id, visibility, name, category, one_liner, description, ideal_customer, pain_points, differentiators, price_model, proof_points, competitors)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(USER_ID, WS_ID, p.visibility, p.name, p.category, p.one_liner, p.description, p.ideal_customer, p.pain_points, p.differentiators, p.price_model, p.proof_points, p.competitors)
  productIds.push(Number(result.lastInsertRowid))
  console.log(`✓ Product: ${p.name} (id=${result.lastInsertRowid})`)
}

// Insert staff
for (const s of staff) {
  const result = db.prepare(`
    INSERT INTO staff (user_id, name, role, languages)
    VALUES (?, ?, ?, ?)
  `).run(USER_ID, s.name, s.role, JSON.stringify(s.languages))
  console.log(`✓ Staff: ${s.name} — ${s.role}`)
}

// Insert scripts
for (const s of scripts) {
  const productId = productIds[s.product_idx]
  const result = db.prepare(`
    INSERT INTO scripts (user_id, workspace_id, visibility, product_id, method, call_type, duration, language, region, delivery, simple, persona, opening, tone_level, tone_guidance, segments_json, objections_json, saved_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, product_id, method, call_type, duration, language, region, delivery, simple, persona)
    DO UPDATE SET opening=excluded.opening, tone_level=excluded.tone_level, tone_guidance=excluded.tone_guidance, segments_json=excluded.segments_json, objections_json=excluded.objections_json, saved_at=excluded.saved_at
  `).run(
    USER_ID, WS_ID, 'workspace', productId,
    s.method, s.call_type, s.duration, s.language, s.region, s.delivery,
    s.simple ? 1 : 0, s.persona, s.opening, s.tone_level, s.tone_guidance,
    JSON.stringify(s.segments), JSON.stringify(s.objections),
    Date.now()
  )
  console.log(`✓ Script: ${s.method} ${s.call_type} ${s.duration}min → product_id=${productId}`)
}

// Add some outcome data to first script
const firstScriptId = db.prepare('SELECT id FROM scripts WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(USER_ID)?.id
if (firstScriptId) {
  db.prepare('UPDATE scripts SET outcome = ?, used_at = ? WHERE id = ?').run('won', Date.now() - 86400000 * 3, firstScriptId)
  console.log(`✓ Marked script ${firstScriptId} as "won"`)
}

// Add a "lost" outcome on another script
const secondScript = db.prepare('SELECT id FROM scripts WHERE user_id = ? AND id != ? ORDER BY id DESC LIMIT 1').get(USER_ID, firstScriptId)
if (secondScript) {
  db.prepare('UPDATE scripts SET outcome = ?, used_at = ? WHERE id = ?').run('lost', Date.now() - 86400000, secondScript.id)
  console.log(`✓ Marked script ${secondScript.id} as "lost"`)
}

// Add a pending script
const thirdScript = db.prepare('SELECT id FROM scripts WHERE user_id = ? AND outcome IS NULL ORDER BY id ASC LIMIT 1').get(USER_ID)
if (thirdScript) {
  db.prepare('UPDATE scripts SET used_at = ? WHERE id = ?').run(Date.now() - 3600000, thirdScript.id)
  console.log(`✓ Marked script ${thirdScript.id} as "pending" (used but no outcome)`)
}

// Add some prompt feedback
const feedbackData = [
  { method: 'spin', call_type: 'discovery', outcome: 'won', rating: 4, variant: 'default', notes: 'Strong opening, buyer was engaged throughout' },
  { method: 'challenger', call_type: 'cold', outcome: 'lost', rating: 2, variant: 'default', notes: 'Buyer hung up after reframe — too aggressive for this market' },
  { method: 'consultative', call_type: 'demo', outcome: 'won', rating: 5, variant: 'default', notes: 'Diagnosis was spot on, buyer felt heard' },
]
for (const f of feedbackData) {
  db.prepare(`
    INSERT INTO prompt_feedback (user_id, product_id, method, call_type, variant, outcome, rating, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(USER_ID, productIds[0] || 1, f.method, f.call_type, f.variant, f.outcome, f.rating, f.notes)
  console.log(`✓ Feedback: ${f.method} ${f.call_type} → ${f.outcome} (${f.rating}/5)`)
}

// Add a component
db.prepare(`
  INSERT INTO components (user_id, workspace_id, name, type, content, tags, method)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(USER_ID, WS_ID, 'SPIN Situation Opener', 'opening', 'Hi [Name], this is [Your Name] from [Company]. I help sales teams close more deals with less admin. Before I share anything — can I ask what your current setup looks like?', 'spin, discovery, opener', 'spin')
console.log('✓ Component: SPIN Situation Opener')

// Add a voice doc
db.prepare(`
  INSERT INTO voice_docs (user_id, name, type, content, tags)
  VALUES (?, ?, ?, ?, ?)
`).run(USER_ID, 'PitchPro Brand Voice', 'brand_guide', 'We are direct but never aggressive. We lead with data, not hype. We say "your team" not "users". We are warm but efficient — like a good coach, not a motivational speaker. Avoid jargon. Use short sentences. Always end with a specific next step.', 'brand, tone, voice')
console.log('✓ Voice Doc: PitchPro Brand Voice')

// Add a scheduled call
db.prepare(`
  INSERT INTO scheduled_calls (user_id, product_id, prospect_name, prospect_company, prospect_email, method, call_type, duration, scheduled_at, timezone, notes, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(USER_ID, productIds[0], 'Meera Joshi', 'FinServ Corp', 'meera@finservcorp.com', 'spin', 'discovery', 30, Date.now() + 86400000, 'Asia/Kolkata', 'Follow-up from SDR intro call. She expressed interest in pipeline visibility.', 'scheduled')
console.log('✓ Scheduled Call: Meera Joshi at FinServ Corp')

db.close()

console.log('\n✅ Done! Login with admin@pitchstudio.io / Admin@123')