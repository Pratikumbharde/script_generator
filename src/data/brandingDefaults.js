/* ============================================================
   Default branding + landing-page copy.

   Single source of truth for every fallback: when the admin has
   not overridden a value in Settings > Branding / Landing Page,
   the app renders exactly the original hardcoded content.

   `hero_title` supports **highlight** markers — the wrapped span
   renders as the accent-gradient <em> in the hero heading.
   ============================================================ */

export const DEFAULT_BRANDING = {
  site_name: 'Pitch Studio',
  site_tagline: 'The live-call cockpit for sales teams',
  logo_data: null,
  favicon_data: null,
  meta_description: 'AI sales script generator for high-performing teams',
  meta_keywords: 'sales scripts, sales enablement, AI sales coach, call scripts',
}

export const DEFAULT_LANDING = {
  eyebrow: 'AI-powered sales enablement',
  hero_title: 'Walk into every sales call with the **perfect script** — already in your pocket.',
  hero_subtitle: 'A live-call cockpit for sales teams. Enter your product once, pick a methodology, and AI writes a time-segmented call script with objection handling — so every rep pitches like your best rep.',
  hero_note: 'Free to start · No credit card · Your scripts stay saved — never regenerated',
  flow: [
    { title: '1 · Describe your product once', body: "What it does, who it's for, pain points, proof — entered a single time." },
    { title: '2 · Pick methodology + call type', body: 'SPIN, MEDDIC, Challenger… for cold calls, demos, discovery, negotiation and more.' },
    { title: '3 · Run the live call', body: 'A time-segmented cockpit with "say this" lines, coaching notes and objection answers.' },
  ],
  what: {
    kicker: 'What is Pitch Studio?',
    title: 'Not another script library. A cockpit you run the call from.',
    body: 'Most teams keep pitch docs nobody reads. Pitch Studio turns your product knowledge into a live, minute-by-minute playbook: each segment of your call shows exactly what to say out loud, what to keep to yourself, and how to handle whatever the buyer throws at you — timed to your call length.',
    checklist: [
      'Scripts are saved forever and only change when you say so',
      'Every line split into "say aloud" vs. "coaching — for you only"',
      'One-click translations for the languages your team speaks',
      'Post-call outcome tracking feeds win-rate analytics',
    ],
  },
  how: {
    kicker: 'How it works',
    title: 'From product page to call-ready in three steps',
    lead: 'Setup takes minutes. After that, generating a new script for any call type takes seconds.',
    steps: [
      { title: 'Add your product', body: "Name, category, one-liner, ideal customer, pain points, differentiators, pricing and proof points — a two-minute form that powers every script you'll ever generate." },
      { title: 'Configure the call', body: 'Choose a sales methodology, call type and duration. Pick tone — soft, balanced or hard — plus language, region and delivery style.' },
      { title: 'Run the call live', body: 'Open the cockpit, hit "Start call", and work through timed phases with say-aloud lines, private coaching and instant objection handling.' },
    ],
  },
  features: {
    kicker: 'Everything around the call',
    title: 'Built for the whole sales motion, not just the pitch',
    items: [
      { title: '15+ sales methodologies', body: 'SPIN, MEDDIC, Challenger, Sandler, BANT, Gap and more — the AI adapts tone and structure to the method you pick.' },
      { title: 'Objection handling', body: "Search any objection and get a reframe in your method's style — never argue, always redirect." },
      { title: 'Live call timer', body: 'Segments mapped to your call length with a running clock, so you always know where you are in the pitch.' },
      { title: '10 languages, one script', body: 'Generate side-by-side translations — English, Hindi, Hinglish, Marathi, Tamil and more — for every teammate.' },
      { title: 'Analytics & win rates', body: 'Track outcomes per script, spot which methods close, and see which phrases actually land.' },
      { title: 'Team workspace', body: 'Roles and permissions, shared scripts, coaching feedback and leaderboards that keep the whole team sharp.' },
    ],
  },
  who: {
    kicker: "Who it's for",
    title: 'One workspace for reps, managers and founders',
    lead: 'SDRs walk into cold calls prepared. Account executives run discovery and demos from a cockpit instead of sticky notes. Sales managers coach from real data — not gut feel. And founders can finally hand their pitch to a new hire without it falling apart on call three.',
    cards: [
      { title: 'Your data stays yours', body: 'Each company gets a private workspace — products, scripts and team data are scoped to you.' },
      { title: 'Works on any device', body: 'Installable as an app (PWA) — keep the cockpit open on a second screen during live calls.' },
      { title: 'Gets smarter with use', body: 'Conversation Intelligence surfaces your best-performing phrases so scripts keep improving.' },
    ],
  },
  cta: {
    title: 'Ready to pitch like your best rep — every call?',
    body: 'Create your workspace in under a minute. Your first script is a few clicks away.',
  },
  footer_tagline: 'The live-call cockpit for sales teams — script it, say it, close it.',
}

/* Merge stored branding/landing over the defaults so partial saves
   (and old rows missing newer fields) always render complete content. */
export function mergeBranding(saved) {
  return { ...DEFAULT_BRANDING, ...(saved || {}) }
}

export function mergeLanding(saved) {
  const s = saved || {}
  return {
    ...DEFAULT_LANDING,
    ...s,
    flow: (s.flow?.length ? s.flow : DEFAULT_LANDING.flow).map((f, i) => ({ ...DEFAULT_LANDING.flow[i], ...f })),
    what: { ...DEFAULT_LANDING.what, ...s.what, checklist: (s.what?.checklist?.length ? s.what.checklist : DEFAULT_LANDING.what.checklist) },
    how: {
      ...DEFAULT_LANDING.how,
      ...s.how,
      steps: (s.how?.steps?.length ? s.how.steps : DEFAULT_LANDING.how.steps).map((x, i) => ({ ...DEFAULT_LANDING.how.steps[i], ...x })),
    },
    features: {
      ...DEFAULT_LANDING.features,
      ...s.features,
      items: (s.features?.items?.length ? s.features.items : DEFAULT_LANDING.features.items).map((x, i) => ({ ...DEFAULT_LANDING.features.items[i], ...x })),
    },
    who: {
      ...DEFAULT_LANDING.who,
      ...s.who,
      cards: (s.who?.cards?.length ? s.who.cards : DEFAULT_LANDING.who.cards).map((x, i) => ({ ...DEFAULT_LANDING.who.cards[i], ...x })),
    },
    cta: { ...DEFAULT_LANDING.cta, ...s.cta },
  }
}