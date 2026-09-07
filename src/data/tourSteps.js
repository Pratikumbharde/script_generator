/* ============================================================
   Tour steps — one entry per page, in the order a new user
   should discover the app. The engine (TourGuide.jsx) walks a
   rep through: add product → generate script → run the call →
   learn from outcomes.

   Step fields:
   - id: unique key
   - group: chapter label shown above the title
   - view: sidebar view to navigate to (undefined = stay/centered)
   - selector: DOM element to spotlight (omit = centered modal)
   - require: 'canGenerate' (hide from members) | 'admin' (admin role only)
   ============================================================ */

export const TOUR_STEPS = [
  /* ---------- welcome ---------- */
  {
    id: "welcome",
    title: "Welcome to Pitch Studio 👋",
    body: "Pitch Studio is a live-call cockpit for sales teams. Add your product once, generate an AI script for any call type, run the call from a guided cockpit, and learn from every outcome. This 2-minute tour walks you through every page — you can skip anytime.",
    centered: true,
  },

  /* ---------- SELL — the core loop ---------- */
  {
    id: "products",
    group: "Sell · the core loop",
    view: "products",
    selector: ".ps-top",
    require: "canGenerate",
    title: "1 · Products — add it once",
    body: "Every product you sell lives here. Fill in the pains, proof points and pricing a single time — every script, battle card and insight below draws from this.",
  },
  {
    id: "studio",
    group: "Sell · the core loop",
    view: "studio",
    selector: ".ps-top",
    require: "canGenerate",
    title: "2 · Call Studio — generate a script",
    body: "The heart of the app. Pick a product, then a methodology (SPIN, MEDDIC, Challenger…), call type, duration, language and tone. AI writes a time-segmented script with objection handling in seconds.",
  },
  {
    id: "scripts",
    group: "Sell · the core loop",
    view: "scripts",
    selector: ".ps-top",
    title: "3 · Scripts — your library",
    body: "Every script ever generated is saved here — they never regenerate on their own. Filter, compare, sync translations, and click one to open the live-call cockpit.",
  },

  /* ---------- PREPARE ---------- */
  {
    id: "training",
    group: "Prepare",
    view: "training",
    selector: ".ps-top",
    title: "Training",
    body: "Deep-dives on every methodology and call type, plus side-by-side comparison tables to help each rep pick the approach that fits their deal.",
  },
  {
    id: "practice",
    group: "Prepare",
    view: "practice",
    selector: ".ps-top",
    title: "Practice",
    body: "Reps rehearse answering real buyer objections and get AI scoring on their responses — safe reps before they're live with a buyer.",
  },
  {
    id: "roleplay",
    group: "Prepare",
    view: "roleplay",
    selector: ".ps-top",
    title: "Role-play",
    body: "A live AI buyer simulator. Choose a persona (skeptical owner, procurement, gatekeeper…) and run a realistic conversation with instant coaching.",
  },
  {
    id: "components",
    group: "Prepare",
    view: "components",
    selector: ".ps-top",
    title: "Components",
    body: "A shared library of reusable pitch snippets and talk tracks — drop proven openings, value lines and closes into any script.",
  },
  {
    id: "battle",
    group: "Prepare",
    view: "battle",
    selector: ".ps-top",
    title: "Battle Cards",
    body: "Quick-reference competitor intel and counter-messaging, ready on a second screen when a buyer mentions the competition.",
  },

  /* ---------- INTELLIGENCE ---------- */
  {
    id: "analytics",
    group: "Intelligence",
    view: "analytics",
    selector: ".ps-top",
    title: "Analytics",
    body: "Understand what's happening across all sales conversations — outcomes, trends and win rates at a glance.",
  },
  {
    id: "coaching",
    group: "Intelligence",
    view: "coaching",
    selector: ".ps-top",
    title: "Coaching",
    body: "Personalized AI feedback pulled from each rep's calls, role-plays and practice sessions — managers coach from evidence, not gut feel.",
  },
  {
    id: "competitor",
    group: "Intelligence",
    view: "competitor",
    selector: ".ps-top",
    title: "Competitors",
    body: "Competitive intelligence gathered from your team's real calls — who's coming up in deals and how to counter them.",
  },
  {
    id: "dealscore",
    group: "Intelligence",
    view: "dealscore",
    selector: ".ps-top",
    title: "Deal Scores",
    body: "AI grades every open deal on quality and likelihood to close, with a factor-by-factor breakdown of what's missing.",
  },
  {
    id: "heatmap",
    group: "Intelligence",
    view: "heatmap",
    selector: ".ps-top",
    title: "Conversation Intelligence",
    body: "Discovers which phrases and approaches actually correlate with wins and losses — your best lines, surfaced by data.",
  },
  {
    id: "analysis",
    group: "Intelligence",
    view: "analysis",
    selector: ".ps-top",
    title: "Call Analysis",
    body: "Upload a recording, log call details, or record live — and get AI feedback on script adherence, pacing and delivery.",
  },

  /* ---------- OPTIMIZE ---------- */
  {
    id: "refinement",
    group: "Optimize",
    view: "refinement",
    selector: ".ps-top",
    title: "Script Refinement",
    body: "Pick a goal and focus areas — AI rewrites the weak sections of a script and saves the new version alongside the old one.",
  },
  {
    id: "auto_opt",
    group: "Optimize",
    view: "auto_opt",
    selector: ".ps-top",
    title: "AI Optimization",
    body: "Continuous AI scanning of call outcomes, surfacing high-impact improvements and applying them automatically.",
  },
  {
    id: "selfimprove",
    group: "Optimize",
    view: "selfimprove",
    selector: ".ps-top",
    title: "Self-Improvement",
    body: "Your scripts learn from every call outcome — patterns that win get reinforced, patterns that stall get flagged.",
  },
  {
    id: "abtesting",
    group: "Optimize",
    view: "abtesting",
    selector: ".ps-top",
    title: "A/B Tests",
    body: "Create two variants of a script, run them against real calls, and auto-promote whichever wins.",
  },
  {
    id: "voice",
    group: "Optimize",
    view: "voice",
    selector: ".ps-top",
    title: "Voice DNA",
    body: "Captures each rep's natural speaking style, so every AI suggestion sounds like them — not like a robot.",
  },

  /* ---------- TEAM ---------- */
  {
    id: "team",
    group: "Team",
    view: "team",
    selector: ".ps-top",
    require: "canGenerate",
    title: "Team",
    body: "Manage your team members, their roles and languages — and assign which scripts each person uses.",
  },
  {
    id: "leaderboard",
    group: "Team",
    view: "leaderboard",
    selector: ".ps-top",
    require: "canGenerate",
    title: "Leaderboard",
    body: "Friendly competition: reps ranked by wins, call quality and activity across the workspace.",
  },
  {
    id: "schedule",
    group: "Team",
    view: "schedule",
    selector: ".ps-top",
    require: "canGenerate",
    title: "Scheduled Calls",
    body: "Plan upcoming calls, link each one to a script, and track outcomes after they happen.",
  },
  {
    id: "permissions",
    group: "Team",
    view: "permissions",
    selector: ".ps-top",
    require: "admin",
    title: "Permissions",
    body: "Fine-grained access control — decide who can view, edit or generate, per feature.",
  },

  /* ---------- ADMIN ---------- */
  {
    id: "export",
    group: "Admin",
    view: "export",
    selector: ".ps-top",
    require: "canGenerate",
    title: "Export",
    body: "Download your workspace data — scripts, products, calls — for backup or to feed your CRM.",
  },
  {
    id: "automation",
    group: "Admin",
    view: "automation",
    selector: ".ps-top",
    require: "canGenerate",
    title: "Automation Rules",
    body: "Zapier-style triggers: when something happens (a call completes, a deal goes cold), fire a webhook, email or Slack message.",
  },

  /* ---------- SETTINGS ---------- */
  {
    id: "settings",
    group: "Settings",
    view: "settings",
    selector: ".ps-top",
    title: "Settings",
    body: "Configure your AI provider (Ollama, Claude, DeepSeek, OpenAI), theme, notifications and workspace name — all in one place.",
  },

  /* ---------- done ---------- */
  {
    id: "done",
    title: "You're all set 🎯",
    body: "The typical flow: Products → Call Studio → run the live cockpit → track outcomes here. Everything you saw keeps learning from every call. Press Help (bottom of the sidebar) to replay this tour anytime.",
    centered: true,
  },
];