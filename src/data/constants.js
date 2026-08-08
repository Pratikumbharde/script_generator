export const METHODS = [
  { id: "spin", name: "SPIN Selling", tone: "Consultative", blurb: "Question-led. Situation → Problem → Implication → Need-payoff. Let the buyer surface their own pain." },
  { id: "consultative", name: "Consultative / Solution", tone: "Consultative", blurb: "Collaborative and needs-first. Diagnose thoroughly before you prescribe anything." },
  { id: "challenger", name: "Challenger Sale", tone: "Assertive", blurb: "Teach, tailor, take control. Reframe their thinking and lead with a sharp insight." },
  { id: "sandler", name: "Sandler", tone: "Assertive", blurb: "Up-front contracts, pull not push. No free consulting — qualify hard, disqualify fast." },
  { id: "meddic", name: "MEDDIC", tone: "Methodical", blurb: "Metrics, Economic buyer, Decision criteria & process, Pain, Champion. Qualification-heavy." },
  { id: "value", name: "Value Selling", tone: "Methodical", blurb: "Anchor every point to quantified business value and a credible ROI story." },
  { id: "straightline", name: "Straight Line", tone: "Aggressive", blurb: "Tonality-driven, high-control. Keep momentum on a straight line toward the close." },
  { id: "neat", name: "NEAT Selling", tone: "Consultative", blurb: "Core Needs, Economic impact, Access to authority, compelling Timeline." },
  { id: "gap", name: "Gap Selling", tone: "Methodical", blurb: "Map the gap between their current state and desired future state; sell the change, not the product." },
  { id: "snap", name: "SNAP Selling", tone: "Assertive", blurb: "For busy, frazzled buyers: keep it Simple, be iNvaluable, Align to goals, raise Priorities." },
  { id: "conceptual", name: "Conceptual Selling", tone: "Consultative", blurb: "Miller Heiman. Sell the buyer's concept of a solution; get, give, then get commitment." },
  { id: "rain", name: "RAIN Selling", tone: "Consultative", blurb: "Rapport, Aspirations & Afflictions, Impact, New reality. Relationship plus insight." },
  { id: "inbound", name: "Inbound Selling", tone: "Consultative", blurb: "For buyers who came to you. Guide, don't push; add value at each step of their journey." },
  { id: "relationship", name: "Relationship Selling", tone: "Consultative", blurb: "Trust and rapport first. Low pressure, long game — the relationship carries the sale." },
  { id: "bant", name: "BANT Qualification", tone: "Methodical", blurb: "Budget, Authority, Need, Timeline. A fast checklist to gauge how ready a deal really is." },
  { id: "transactional", name: "Direct / Transactional", tone: "Assertive", blurb: "Short, direct, feature-benefit-close. Best when the buyer already knows what they want and just needs the right terms." },
  { id: "custom", name: "Custom / Freestyle", tone: "Consultative", blurb: "No rigid methodology — you define the approach. Useful for testing your own style against realistic buyers." },
];
export const CALL_TYPES = [
  { id: "cold", name: "Cold Call", desc: "A first, unexpected contact. The goal is earning 30 seconds and a next meeting — not selling on the spot." },
  { id: "discovery", name: "Discovery", desc: "The first real conversation. You diagnose the buyer's situation, goals, and pain before pitching anything." },
  { id: "demo", name: "Demo", desc: "You show the product solving the exact pains you uncovered. Used after discovery, once you know what matters." },
  { id: "followup", name: "Follow-up", desc: "You re-engage after a gap — a demo, a proposal, or a lead that went quiet." },
  { id: "negotiation", name: "Negotiation", desc: "Price and terms negotiation. Counter-offers, concessions, contract details. The buyer is close but wants a better deal." },
  { id: "objection", name: "Objection Handling", desc: "Focused objection drill. The buyer pushes back on a specific concern. Your job is to reframe, not argue." },
  { id: "closing", name: "Closing", desc: "You ask for the decision and handle final objections on price, terms, and timing. Time to commit." },
  { id: "renewal", name: "Renewal / Upsell", desc: "An existing customer who might expand or churn. You defend the relationship and find growth opportunities." },
];
// All supported durations, in minutes. Adaptive per call type + method (see durationsFor).
export const DURATIONS = [3, 5, 10, 15, 20, 30, 45, 60, 90];
export const TONE_COLOR = { Consultative: "var(--consultative)", Assertive: "var(--assertive)", Aggressive: "var(--aggressive)", Methodical: "var(--methodical)" };

// Which methodologies realistically fit each call type.
export const CALL_METHODS = {
  discovery: ["spin", "consultative", "challenger", "sandler", "meddic", "value", "neat", "gap", "snap", "conceptual", "rain", "inbound", "relationship"],
  qualification: ["bant", "meddic", "sandler", "neat", "snap", "gap", "consultative"],
  demo: ["value", "challenger", "consultative", "conceptual", "rain", "spin", "gap", "inbound", "snap", "relationship", "sandler"],
  closing: ["straightline", "challenger", "sandler", "value", "gap", "consultative", "conceptual", "meddic", "relationship"],
  followup: ["spin", "consultative", "challenger", "sandler", "value", "neat", "gap", "snap", "conceptual", "rain", "inbound", "relationship"],
  cold: ["snap", "challenger", "sandler", "straightline"],
  negotiation: ["straightline", "challenger", "sandler", "value", "gap", "consultative", "transactional", "custom"],
  objection: ["challenger", "sandler", "snap", "consultative", "value", "gap", "spin", "custom"],
  renewal: ["consultative", "relationship", "value", "rain", "neat", "conceptual", "gap", "custom"],
};
export const methodsFor = (callTypeId) => METHODS.filter((m) => (CALL_METHODS[callTypeId] || []).includes(m.id));

// Realistic call lengths per call type. Baseline set; methods can narrow further.
export const CALLTYPE_DURATIONS = {
  cold: [3, 5, 10],
  discovery: [20, 30, 45, 60],
  demo: [20, 30, 45, 60],
  followup: [10, 15, 20, 30],
  negotiation: [15, 20, 30, 45],
  objection: [5, 10, 15],
  closing: [15, 20, 30, 45],
  renewal: [15, 20, 30],
};
// Optional method-specific durations. Overrides the call-type set when present.
export const METHOD_DURATIONS = {
  // MEDDIC and Conceptual really need time — no short versions.
  meddic: { discovery: [30, 45, 60, 90], demo: [30, 45, 60, 90], closing: [30, 45, 60], followup: [15, 20, 30] },
  conceptual: { discovery: [30, 45, 60, 90], demo: [30, 45, 60], closing: [30, 45, 60] },
  // Value selling needs room for ROI framing.
  value: { discovery: [30, 45, 60], demo: [30, 45, 60], closing: [20, 30, 45] },
  // SNAP is built for busy buyers — always short.
  snap: { discovery: [10, 15, 20], qualification: [5, 10, 15], demo: [15, 20, 30], followup: [5, 10, 15], cold: [3, 5] },
  // Straight Line is high-momentum and phone-first — no marathons.
  straightline: { closing: [10, 15, 20, 30], cold: [3, 5] },
  // Sandler: crisp qualification, upfront contract.
  sandler: { qualification: [10, 15, 20], cold: [5, 10] },
  // BANT: it's a fast qualification checklist.
  bant: { qualification: [5, 10, 15] },
  // Challenger and Gap can go a bit longer on discovery to set up the insight/gap.
  challenger: { discovery: [30, 45, 60], demo: [30, 45, 60] },
  gap: { discovery: [30, 45, 60], demo: [30, 45, 60] },
  // Relationship-first calls in India / MENA often run longer to build rapport.
  relationship: { discovery: [30, 45, 60], followup: [15, 20, 30] },
  rain: { discovery: [30, 45, 60] },
  // Inbound is guided-buyer-paced; usually shorter than pure outbound discovery.
  inbound: { discovery: [15, 20, 30, 45], demo: [20, 30, 45] },
};

// Best-of-both: start with call-type baseline, override if the method has an opinion.
export function durationsFor(callTypeId, methodId) {
  const methodOverride = METHOD_DURATIONS[methodId]?.[callTypeId];
  const base = CALLTYPE_DURATIONS[callTypeId] || DURATIONS;
  return methodOverride || base;
}
// Human-readable rationale shown next to the length picker.
export function durationHintFor(callTypeId, methodId) {
  const method = METHODS.find((m) => m.id === methodId);
  const cType = CALL_TYPES.find((c) => c.id === callTypeId);
  const overridden = !!METHOD_DURATIONS[methodId]?.[callTypeId];
  if (callTypeId === "cold") return `Cold calls live or die in the first few seconds. Keep it short.`;
  if (overridden) return `${method?.name} shapes how long a ${cType?.name.toLowerCase()} call should run — these are the realistic options.`;
  return `Typical lengths for a ${cType?.name.toLowerCase()} call.`;
}

/* ---------- training knowledge base ---------- */
export const METHOD_TRAINING = {
  spin: {
    emoji: "🎯", origin: "Neil Rackham, 1988",
    coreIdea: "The buyer talks their way into wanting to change. The rep just asks the right question at the right time.",
    logic: "SPIN is a question sequence: Situation → Problem → Implication → Need-payoff. You start by understanding their world (Situation), uncover what's not working (Problem), make them feel the cost of not fixing it (Implication), and only then invite them to describe the value of solving it (Need-payoff). The buyer sells themselves; you're the guide.",
    whyItConverts: [
      "The buyer voices their own pain — resistance drops when the words are theirs, not yours.",
      "Implication questions turn a small annoyance into a business cost worth paying to fix.",
      "By the time you pitch, the buyer has already agreed the problem is real and painful.",
    ],
    whyItFails: [
      "Rep jumps to solution before enough Implication questions — buyer feels the problem isn't yet worth spending on.",
      "Too many Situation questions in a row — feels like an interrogation, buyer disengages.",
      "Used on small, transactional deals where the buyer just wants a price, not a therapy session.",
    ],
    whereRepsLose: [
      "Reading questions instead of really listening to the answer.",
      "Skipping Implication because it feels uncomfortable to press on pain.",
      "Not preparing three or four sharp Implication questions before the call.",
    ],
    bestFor: "Complex, considered B2B purchases where the buyer needs to justify the buy internally.",
    poorFor: "Impulse buys, low-ticket B2C, or callers who literally just want a quote.",
    signatureQuestion: "\"What impact is that having on the rest of the team / on your growth targets?\" (Implication)",
  },
  consultative: {
    emoji: "🩺", origin: "Popularised in the 1970s; refined by Mack Hanan.",
    coreIdea: "Behave more like a doctor than a salesperson: diagnose first, prescribe last.",
    logic: "The rep does deep discovery, understands the buyer's environment, then recommends a fit — even if the honest recommendation is 'we're not right for you'. Trust is the asset; the sale is a byproduct.",
    whyItConverts: [
      "Buyers reward reps who tell them the truth, including uncomfortable truths.",
      "The recommendation lands because it's built on their words, not a generic pitch.",
      "Longer selling cycle, but higher win rate and larger deal sizes.",
    ],
    whyItFails: [
      "Rep confuses 'consultative' with 'passive' and never actually asks for the deal.",
      "Buyer needs to move fast; rep is still diagnosing while a competitor is closing.",
      "Rep lacks the domain knowledge to actually advise, so the 'consulting' rings hollow.",
    ],
    whereRepsLose: [
      "Free consulting: giving the answer without a commitment first.",
      "Not qualifying budget/authority early — six weeks of diagnosis with someone who can't sign.",
      "Fear of making a firm recommendation at the end.",
    ],
    bestFor: "Complex solutions, long-term partnerships, professional services, high-consideration B2B.",
    poorFor: "Transactional sales, price-driven RFPs where relationship weight is low.",
    signatureQuestion: "\"Walk me through how it works today, from start to finish.\"",
  },
  challenger: {
    emoji: "⚡", origin: "Matthew Dixon & Brent Adamson, CEB, 2011",
    coreIdea: "Don't ask what the buyer wants — teach them something they didn't know, then reframe the purchase around that insight.",
    logic: "The Challenger sequence is Teach → Tailor → Take Control. You lead with a provocative insight about their business, tailor it to their situation, then take control of the pricing/timeline conversation without flinching. It works because most buyers are stuck in outdated assumptions.",
    whyItConverts: [
      "Buyers pay for insight, not information — being taught something new creates urgency.",
      "Reframing the problem changes the buying criteria to ones you win on.",
      "'Taking control' on price/terms signals confidence and prevents last-minute discount spirals.",
    ],
    whyItFails: [
      "Rep confuses 'challenge' with 'confront' — comes off arrogant.",
      "The 'insight' is generic marketing content the buyer has already heard.",
      "Used with a buyer who already knows the space better than the rep — insight falls flat.",
    ],
    whereRepsLose: [
      "Not researching enough to have a truly fresh insight.",
      "Backing down at the take-control moment when the buyer pushes back on price.",
      "Skipping the tailor step — insight is real but not relevant to this buyer.",
    ],
    bestFor: "Complex B2B, mature markets, buyers who think they already know what they need.",
    poorFor: "Simple sales, price-sensitive SMB, buyers who genuinely just want service delivered.",
    signatureQuestion: "\"Most companies in your space assume X. Our data suggests the opposite. Want me to show you?\"",
  },
  sandler: {
    emoji: "🤝", origin: "David Sandler, 1967",
    coreIdea: "Reverse the usual power dynamic. Don't chase — qualify hard, disqualify fast, and get the buyer to sell you on why they deserve your time.",
    logic: "Sandler uses 'up-front contracts' (mutual agreement on what happens in this call and next), pain-focused questioning, and constant qualification. If budget, decision process, or pain isn't clear — the deal doesn't advance. Nothing is free.",
    whyItConverts: [
      "Deals that make it through are already qualified, so close rates on the ones that survive are high.",
      "Up-front contracts eliminate 'let me think about it' — you agreed on the next step at the start.",
      "Reversal ('so it sounds like this isn't a priority?') gets buyers off the fence.",
    ],
    whyItFails: [
      "Executed clumsily, it feels manipulative or cold.",
      "Kills warm inbound leads who wanted a friendlier experience.",
      "Rep uses 'disqualification' as an excuse to disqualify any tough conversation.",
    ],
    whereRepsLose: [
      "Not actually enforcing the up-front contract mid-call.",
      "Fear of asking about budget or process directly.",
      "Chasing 'maybe' deals that should have been disqualified two calls ago.",
    ],
    bestFor: "High-volume sales orgs, mid-market B2B, teams drowning in unqualified pipeline.",
    poorFor: "Consultative enterprise deals where relationship is everything; small warm consumer sales.",
    signatureQuestion: "\"If we don't fix this by Q3, what happens?\"",
  },
  meddic: {
    emoji: "📊", origin: "Dick Dunkel, PTC, 1990s",
    coreIdea: "Deals close when six boxes are checked. Miss one and it will slip — no matter how much the champion likes you.",
    logic: "MEDDIC is Metrics, Economic buyer, Decision criteria, Decision process, Identify pain, Champion. It's a qualification/checklist framework laid over whatever selling motion you run. The forecast improves because you stop lying to yourself about deals that aren't real.",
    whyItConverts: [
      "Forces you to actually meet the economic buyer, not just the champion.",
      "Metrics make ROI concrete and defensible in the buyer's own internal review.",
      "Decision-process mapping prevents legal/security surprises in the final week.",
    ],
    whyItFails: [
      "Treated as a CRM checklist, not a selling discipline — reps fake the fields.",
      "Overkill for small, fast deals.",
      "Champion is warm but no economic buyer conversation ever happens — deal dies at signing.",
    ],
    whereRepsLose: [
      "Skipping the economic-buyer conversation because the champion says 'don't worry, I'll handle it'.",
      "Metrics that are vague ('save time') instead of quantified.",
      "Not confirming decision criteria in writing.",
    ],
    bestFor: "Complex enterprise B2B, technical products, deals with legal/security review.",
    poorFor: "SMB self-serve sales, one-call closes, consumer products.",
    signatureQuestion: "\"Who else needs to sign off, and what does their approval process look like?\"",
  },
  value: {
    emoji: "💰", origin: "Codified across the 1990s–2000s; heavy in enterprise SaaS.",
    coreIdea: "Every claim, every feature, every objection is answered with a business number the buyer's CFO would accept.",
    logic: "You quantify current-state cost, projected-future-state benefit, and the delta. You build an ROI story the champion can defend internally. Price is a fraction of proven value, not a line item.",
    whyItConverts: [
      "Champion has ammunition to defend the purchase to finance.",
      "Reframes 'expensive' into 'X% ROI in Y months'.",
      "Buyers who can quantify are also easier to expand later.",
    ],
    whyItFails: [
      "Numbers are made up or unverifiable — CFO tears them apart.",
      "Value case is generic industry stats, not built on the buyer's own data.",
      "Emotional buyers who don't respond to spreadsheets get bored.",
    ],
    whereRepsLose: [
      "Not gathering baseline numbers early in discovery.",
      "Presenting an ROI model without the champion pre-vetting it.",
      "Using vendor-provided ROI templates without customising them.",
    ],
    bestFor: "Enterprise SaaS, transformation projects, CFO-approved purchases.",
    poorFor: "Emotional/lifestyle purchases, deals below the CFO's radar.",
    signatureQuestion: "\"What's this costing you today — in rupees, hours, or lost revenue?\"",
  },
  straightline: {
    emoji: "🚀", origin: "Jordan Belfort, 1990s (used and misused).",
    coreIdea: "Keep the buyer on a straight line from open to close using tonality, certainty, and momentum. Every detour is closed off.",
    logic: "Three tens: rep certainty, product certainty, company certainty. Objections are looped back into the line ('I hear you — and let me ask you this…') without breaking momentum. Heavy on voice tonality and pacing.",
    whyItConverts: [
      "Buyer certainty is contagious — a certain rep creates a certain buyer.",
      "Momentum prevents 'let me think about it' by never stopping.",
      "Objection loops keep the close on the table without confrontation.",
    ],
    whyItFails: [
      "Sounds like a boiler room; sophisticated B2B buyers walk instantly.",
      "Doesn't work over email or async channels — it's a voice technique.",
      "Regulatory scrutiny and reputational risk when misused.",
    ],
    whereRepsLose: [
      "Reading a script instead of using tonality — flat delivery kills the technique.",
      "Applying it to complex deals that need diagnosis.",
      "Not calibrating pressure to the buyer's actual buying stage.",
    ],
    bestFor: "Short-cycle, phone-heavy, emotional or aspirational buys with a clear next step.",
    poorFor: "Enterprise B2B, consultative sales, any deal that needs research.",
    signatureQuestion: "\"Does that make sense so far? Good — let me tell you how we get you started this week.\"",
  },
  neat: {
    emoji: "🧩", origin: "The Harris Consulting Group & Sales Hacker.",
    coreIdea: "A modern replacement for BANT that puts real business needs and buyer impact ahead of budget-check-listing.",
    logic: "N — core Needs. E — Economic impact. A — Access to authority. T — compelling Timeline. Less rigid than MEDDIC, less shallow than BANT.",
    whyItConverts: [
      "Focuses on business impact, which resonates across levels.",
      "Access-to-authority ensures the deal doesn't die at the last step.",
      "Timeline forces both sides to commit to a plan.",
    ],
    whyItFails: [
      "Rep interprets 'need' too shallowly and misses the deeper business problem.",
      "'Access' is confirmed as promised but never actually granted.",
      "Timeline drifts because no consequences of missing it are agreed.",
    ],
    whereRepsLose: [
      "Not tying the need to a measurable business outcome.",
      "Accepting a champion's word on access instead of getting a calendar invite.",
      "Setting timelines the buyer doesn't own.",
    ],
    bestFor: "Modern B2B, mid-market SaaS, teams moving away from BANT.",
    poorFor: "Fully transactional sales; consumer.",
    signatureQuestion: "\"If you had this in place today, what would change for you next quarter?\"",
  },
  gap: {
    emoji: "🕳️", origin: "Keenan, 'Gap Selling', 2018.",
    coreIdea: "Sell the change, not the product. Map the buyer's current state and desired future state; the gap between is what you're really selling.",
    logic: "Deep problem-focused discovery. You quantify current state (facts, feelings, business impact), quantify desired future state, then position your product only as the bridge. Product features are almost irrelevant until the gap is real.",
    whyItConverts: [
      "Buyers commit because they see the cost of staying the same.",
      "Discovery is so thorough that the pitch practically writes itself.",
      "Ties directly to measurable business outcomes.",
    ],
    whyItFails: [
      "Rep rushes discovery to get to demo.",
      "'Current state' is described only in feelings, not facts and impact.",
      "Applied to buyers who don't actually have a problem yet.",
    ],
    whereRepsLose: [
      "Pitching product features before the gap is quantified.",
      "Not writing down the current-state facts to play back to the buyer.",
      "Skipping business impact and staying at 'this is annoying' level.",
    ],
    bestFor: "Complex B2B where change management is real; SaaS with meaningful implementation.",
    poorFor: "Impulse or transactional buys.",
    signatureQuestion: "\"What does 'good' look like a year from now — and what stops you getting there today?\"",
  },
  snap: {
    emoji: "⚡", origin: "Jill Konrath, 'SNAP Selling', 2010.",
    coreIdea: "Buyers are drowning. Keep it Simple, be iNvaluable, Align with their goals, raise Priorities.",
    logic: "Every interaction is optimised for a busy, distracted buyer. Short emails, short calls, immediate relevance. You earn micro-decisions along the way instead of pitching for a big commitment.",
    whyItConverts: [
      "Respects the buyer's time — they actually take the call.",
      "Micro-yeses compound into a bigger yes.",
      "Aligning to *their* priorities means you're never fighting for attention.",
    ],
    whyItFails: [
      "Too shallow for genuinely complex, high-stakes purchases.",
      "'Being invaluable' collapses into 'sending too much content'.",
      "Rep never asks for a real commitment.",
    ],
    whereRepsLose: [
      "Confusing short with vague — brevity without substance.",
      "Not knowing the buyer's #1 priority before the call.",
      "Failing to escalate the ask as trust builds.",
    ],
    bestFor: "Busy mid-market buyers, cold outreach, high-volume SDR motions.",
    poorFor: "Complex, multi-stakeholder enterprise transformations.",
    signatureQuestion: "\"What's the one thing on your plate this quarter that, if it slips, causes you the most pain?\"",
  },
  conceptual: {
    emoji: "🧠", origin: "Miller Heiman, 1987.",
    coreIdea: "Sell the buyer's concept of the solution, not your product. People buy the picture they have in their head.",
    logic: "Five categories of questions: confirmation, new information, attitude, commitment, and basic issue. You get, then give, then get commitment. The goal is to align on how the buyer conceptualises success.",
    whyItConverts: [
      "Aligns the sale to the buyer's mental model, so the pitch feels obvious to them.",
      "Reduces 'not what we expected' surprises late in the cycle.",
      "Great for consensus deals where different stakeholders have different concepts.",
    ],
    whyItFails: [
      "Framework-heavy; new reps struggle to apply live.",
      "Slow — buyers with short attention lose interest.",
      "Concept alignment without hard commitments still slips.",
    ],
    whereRepsLose: [
      "Confirming their own concept, not the buyer's.",
      "Not asking commitment questions at each stage.",
      "Skipping attitude questions and missing hidden concerns.",
    ],
    bestFor: "Multi-stakeholder enterprise; complex professional services.",
    poorFor: "Fast, transactional sales.",
    signatureQuestion: "\"When you picture this problem being solved a year from now, what does that look like?\"",
  },
  rain: {
    emoji: "☔", origin: "RAIN Group.",
    coreIdea: "Trusted advisor selling with structure: Rapport, Aspirations & Afflictions, Impact, New reality.",
    logic: "Balance relationship and insight. You build genuine rapport, uncover both what they want (aspirations) and what hurts (afflictions), quantify the impact of either, then paint the 'new reality' with your solution in it.",
    whyItConverts: [
      "Balances head and heart — aspirations plus afflictions covers both motivators.",
      "The 'new reality' narrative is memorable and easy to repeat internally.",
      "Rapport-first works especially well in relationship-driven markets.",
    ],
    whyItFails: [
      "Rapport slips into small talk with no progress.",
      "Aspirations without afflictions creates a nice conversation, no urgency.",
      "New reality lacks specifics, so it feels aspirational and unbought.",
    ],
    whereRepsLose: [
      "Spending too long in rapport before moving to substance.",
      "Only asking about afflictions (pain) and skipping aspirations.",
      "'New reality' is generic instead of tailored.",
    ],
    bestFor: "Professional services, consulting, relationship-heavy markets including India and the Middle East.",
    poorFor: "Fully transactional sales.",
    signatureQuestion: "\"A year from now, if this is working — what does life look like for you and your team?\"",
  },
  inbound: {
    emoji: "🧲", origin: "HubSpot, 2010s.",
    coreIdea: "For buyers who came to you: guide their journey, add value at each step, and let them buy at their own pace — but on your terms.",
    logic: "Four phases: Identify, Connect, Explore, Advise. The rep meets the buyer where they are in their research journey and adds context and insight rather than pushing. It only works alongside a real content/marketing engine.",
    whyItConverts: [
      "Inbound leads convert 3–5× better than outbound — they've already opted in.",
      "Buyer feels helped, not sold to; trust is high from turn one.",
      "Scales with content, not just headcount.",
    ],
    whyItFails: [
      "Rep is too passive and the deal stalls in 'exploring' forever.",
      "Applied to cold outbound leads who haven't opted in — feels weak.",
      "No qualifying, so pipeline fills with tyre-kickers.",
    ],
    whereRepsLose: [
      "Not qualifying an inbound lead just because they're inbound.",
      "Answering questions instead of also asking them.",
      "Failing to prescribe a next step.",
    ],
    bestFor: "SaaS with strong content marketing; PLG motions; self-serve-plus-sales models.",
    poorFor: "Pure outbound; markets where the buyer doesn't research online.",
    signatureQuestion: "\"What made you sign up / download / reach out today?\"",
  },
  relationship: {
    emoji: "🌱", origin: "The oldest 'method' — codified across the 20th century.",
    coreIdea: "The relationship carries the sale. Trust, familiarity, and long-term patience beat any framework.",
    logic: "Consistent touch, real interest, generous help without immediate ask. Deals close when the buyer is ready — but when a deal opens up, they think of you first, and you often skip the RFP.",
    whyItConverts: [
      "Higher win rates on deals that materialise; often no competitive process.",
      "Existing relationship shortens the trust-building phase to zero.",
      "Deep familiarity means the pitch is always relevant.",
    ],
    whyItFails: [
      "Long lead time — no fit for a rep needing this quarter's number.",
      "'Relationship' becomes an excuse for not asking for the business.",
      "Works only in markets where relationships are actually decision inputs.",
    ],
    whereRepsLose: [
      "Never converting warmth into a real proposal.",
      "Not tracking touches or knowing when to escalate.",
      "Assuming the relationship transfers when the buyer changes jobs (it sometimes doesn't).",
    ],
    bestFor: "India/Middle East/Japan markets; regulated industries; distributor networks; family businesses.",
    poorFor: "Short-cycle transactional SaaS.",
    signatureQuestion: "\"What's changed for you since we last spoke?\"",
  },
  bant: {
    emoji: "✅", origin: "IBM, 1960s.",
    coreIdea: "A fast 4-point checklist to decide if a lead is worth pursuing: Budget, Authority, Need, Timeline.",
    logic: "Not a full selling method — a qualification tool used inside another method (often on early calls, especially by SDRs). If all four are absent, disqualify. If two or three are present, keep working.",
    whyItConverts: [
      "Fast, universally understood, easy to train.",
      "Prevents wasted cycles on unfundable or timeline-less deals.",
      "Sets a clean handoff between SDR and AE.",
    ],
    whyItFails: [
      "Modern buyers often don't have formal budget until late in the process.",
      "Rep hangs up on leads that could have been developed.",
      "Over-emphasises budget/authority; under-weights business impact.",
    ],
    whereRepsLose: [
      "Rigidly disqualifying a real problem because 'no budget yet'.",
      "Trusting a 'yes I'm the decision maker' claim without probing.",
      "Not re-qualifying later in the cycle as things change.",
    ],
    bestFor: "SDR/BDR qualification, high-volume outbound, quick fit checks.",
    poorFor: "Complex enterprise where budget forms during the process, not before.",
    signatureQuestion: "\"How do purchases like this typically get funded and approved at your company?\"",
  },
};

export const CALLTYPE_TRAINING = {
  discovery: {
    emoji: "🔍", stage: "Early", typicalLength: "30–45 min",
    goal: "Understand the buyer's world so deeply that when you pitch, it lands specifically on their situation.",
    whenToUse: "The first substantive call after a lead has qualified in — inbound demo request, outbound accepted meeting, referral. Also when re-engaging a stalled deal to reset context.",
    howToRun: [
      "Set expectations in the first two minutes: what you'll cover, how long, and what a good next step looks like.",
      "Ask far more than you tell. A 70/30 buyer-talks/rep-talks ratio is the target.",
      "Layer questions from broad ('walk me through your process today') to specific ('what happens when X fails').",
      "Quantify pain — hours lost, revenue affected, people impacted.",
      "Close with a clear, specific next step and a calendar hold.",
    ],
    goodSignals: ["Buyer volunteers pain unprompted", "They ask 'how do you handle X'", "They introduce another stakeholder", "They give a rough timeline"],
    badSignals: ["Short one-word answers", "Only technical questions, no business context", "Won't commit to a next step", "Won't share basic facts about their setup"],
    mistakes: [
      "Pitching in the first ten minutes.",
      "Reading questions off a list without follow-up.",
      "Not writing down exact phrasing to play back later.",
      "Ending without a concrete calendar-held next step.",
    ],
  },
  qualification: {
    emoji: "✅", stage: "Early", typicalLength: "15–20 min",
    goal: "Confirm the deal is real enough to invest a full demo and sales cycle in — or disqualify quickly.",
    whenToUse: "Right after discovery (or sometimes combined), before you commit AE / solutions-engineer time. Also as a re-qualification checkpoint mid-cycle when something feels off.",
    howToRun: [
      "Confirm the business problem — is it real, urgent, and prioritised?",
      "Map decision process: who signs, who influences, how funding works, what steps happen before signature.",
      "Get a rough timeline and what's driving it.",
      "Explicitly discuss budget range or funding source.",
      "State honestly if it's not a fit — a fast 'no' is a gift.",
    ],
    goodSignals: ["Buyer knows their own process", "Timeline is driven by a real event (fiscal year, launch, regulation)", "Budget is either allocated or has a clear source"],
    badSignals: ["'Just exploring'", "Can't name other stakeholders", "No sense of when they'd decide", "Dodges budget questions repeatedly"],
    mistakes: [
      "Believing the champion's 'I'm the decision-maker' at face value.",
      "Accepting vague timelines ('sometime next year').",
      "Skipping this because 'they seem interested'.",
    ],
  },
  demo: {
    emoji: "🖥️", stage: "Middle", typicalLength: "30–45 min",
    goal: "Show the product solving the exact problems you uncovered — nothing more, nothing less.",
    whenToUse: "After discovery and qualification confirm real pain and real fit. Never before you know what they care about.",
    howToRun: [
      "Recap the pains you heard in their own words. Get agreement before showing anything.",
      "Tell them what you'll show and in what order — three moments, not twenty features.",
      "Demo the outcome, not the click path. Start from the win, then show how it's achieved.",
      "Pause every 3–4 minutes to check reaction and let them ask questions.",
      "End with a clear next step and confirmed attendees for the follow-up.",
    ],
    goodSignals: ["'Can you show me how X works for us?'", "Buyer starts imagining their data in the tool", "Buyer invites others into the room / call", "Asks about pricing or implementation"],
    badSignals: ["Silent throughout", "Only asks feature questions unconnected to their pain", "Skims through — no follow-ups", "Won't commit to who joins the next call"],
    mistakes: [
      "The 'feature dump' demo covering everything the product does.",
      "Showing the product before recapping the pain.",
      "Presenting alone — leaving pricing and next steps for 'later'.",
      "Not tailoring the demo data to their industry.",
    ],
  },
  closing: {
    emoji: "🏁", stage: "Late", typicalLength: "20–30 min",
    goal: "Get a decision. Handle final objections on price, terms, and timing without discounting reflexively.",
    whenToUse: "When the buyer has seen enough to decide — full evaluation done, stakeholders aligned, proposal reviewed. Not a moment before.",
    howToRun: [
      "Recap the agreed pain, the agreed solution, and the agreed impact.",
      "Present the proposal and the specific decision needed.",
      "Silence after asking. Do not fill it.",
      "Handle objections without immediately discounting — trade concessions instead.",
      "Confirm signature process, dates, and who owns each step in writing.",
    ],
    goodSignals: ["Buyer negotiates terms rather than fit", "Legal or procurement is looped in", "'When can we start?'", "They ask about onboarding"],
    badSignals: ["'Let me think about it' with no specifics", "New stakeholders appearing at the last moment", "Budget suddenly 'under review'", "Silence after proposal sent"],
    mistakes: [
      "Discounting to move the deal instead of finding the real blocker.",
      "Skipping the recap of value and going straight to price.",
      "Not confirming legal and procurement steps upstream.",
      "Chasing without a clear next commitment.",
    ],
  },
  followup: {
    emoji: "📞", stage: "Any", typicalLength: "10–20 min",
    goal: "Move the deal — or a paused deal — one concrete step forward.",
    whenToUse: "After a demo, a proposal, or a period of silence. Also when re-engaging cold pipeline. Every follow-up needs a fresh angle, not just 'checking in'.",
    howToRun: [
      "Open with a specific reason to be talking now — new data, an insight, a change on their side.",
      "Confirm what's happened since the last touch (both sides).",
      "Surface the current blocker openly and ask the buyer to name it.",
      "Propose the specific next step and put a date on it before the call ends.",
    ],
    goodSignals: ["Buyer took your call at all", "They share what's changed internally", "They commit to a next step"],
    badSignals: ["Vague 'still interested' with no specifics", "Repeatedly reschedules", "'Let's revisit next quarter' without a trigger"],
    mistakes: [
      "The 'just checking in' email — provides no value and gets ignored.",
      "Chasing a deal that should have been formally paused or lost.",
      "Not proposing a specific next step and date.",
    ],
  },
  cold: {
    emoji: "🥶", stage: "Very early", typicalLength: "2–5 min live; 30–60 sec voicemail",
    goal: "Earn the next meeting. That's it. Do not try to sell.",
    whenToUse: "First outbound contact to a target who hasn't opted in. Usually paired with a specific research trigger (new role, funding, hire, product launch).",
    howToRun: [
      "Introduce yourself in one sentence with a permission ask ('Do you have 30 seconds and I'll tell you why I called, then you can hang up?').",
      "Lead with a research-based reason for calling THEM specifically today.",
      "State a one-sentence value hypothesis — a hunch, not a claim.",
      "Ask ONE question, then propose a specific short meeting.",
      "Handle the standard 'not interested' with a curious clarifying question, not a rebuttal.",
    ],
    goodSignals: ["They engage with the reason for calling", "They correct your hypothesis (that's engagement)", "They accept a short next meeting"],
    badSignals: ["Immediate hang-up", "'Send an email' with no address given", "Curt one-word answers throughout"],
    mistakes: [
      "Trying to demo or close on the cold call.",
      "Reading a script without listening.",
      "Not having a permission ask up front.",
      "No specific meeting proposal at the end.",
    ],
  },
};

export const COMPARISONS = {
  b2c: [
    { row: "Cycle length", b2b: "Weeks to many months", b2c: "Minutes to days", d2c: "Seconds to hours" },
    { row: "Stakeholders", b2b: "3–10 people", b2c: "1–2 (buyer, sometimes partner)", d2c: "1 person" },
    { row: "Emotion vs logic", b2b: "Logic dominant, emotion decides", b2c: "Emotion dominant, logic justifies", d2c: "Emotion first, often impulse" },
    { row: "Best methods", b2b: "SPIN · Consultative · MEDDIC · Gap · Value · Challenger", b2c: "SNAP · Straight Line · Relationship · Consultative", d2c: "Straight Line · Relationship (loyalty)" },
    { row: "Discovery depth", b2b: "Deep, multi-call", b2c: "Light, in-call", d2c: "Micro — 1–2 questions" },
    { row: "Objection style", b2b: "Committee, technical, procurement", b2c: "Price, spouse, timing", d2c: "Price, urgency, shipping" },
    { row: "Where to build trust", b2b: "Case studies, ROI, references", b2c: "Reviews, guarantees, warmth", d2c: "Reviews, brand, return policy" },
  ],
  segments: [
    { row: "Deal size", smb: "Low", mid: "Mid", ent: "High", cons: "Very low, high volume" },
    { row: "Cycle length", smb: "1–4 weeks", mid: "1–3 months", ent: "3–12+ months", cons: "Same day" },
    { row: "Stakeholders", smb: "1–2", mid: "3–6", ent: "6–20+", cons: "1" },
    { row: "Buyer motivation", smb: "Time, cost, simplicity", mid: "ROI, growth, team leverage", ent: "Strategic transformation, risk", cons: "Personal outcome / feeling" },
    { row: "Best methods", smb: "SNAP · Sandler · Consultative", mid: "SPIN · Gap · Challenger · NEAT · MEDDIC", ent: "MEDDIC · Value · Challenger · Conceptual · RAIN", cons: "Straight Line · Relationship" },
    { row: "Killer mistake", smb: "Over-engineering the sale", mid: "Under-mapping the process", ent: "Missing the economic buyer", cons: "Being pushy on the wrong impulse" },
  ],
  matrix: (() => {
    const cells = { Discovery: {}, Qualification: {}, Demo: {}, Closing: {}, "Follow-up": {}, "Cold Outreach": {} };
    METHODS.forEach((m) => {
      cells.Discovery[m.id] = CALL_METHODS.discovery.includes(m.id);
      cells.Qualification[m.id] = CALL_METHODS.qualification.includes(m.id);
      cells.Demo[m.id] = CALL_METHODS.demo.includes(m.id);
      cells.Closing[m.id] = CALL_METHODS.closing.includes(m.id);
      cells["Follow-up"][m.id] = CALL_METHODS.followup.includes(m.id);
      cells["Cold Outreach"][m.id] = CALL_METHODS.cold.includes(m.id);
    });
    return cells;
  })(),
  personas: [
    { persona: "🏪 Price-sensitive SMB owner (e.g. kirana, small shop)", method: "SNAP · Relationship", why: "Low patience for frameworks. Wants a fast, warm, respectful pitch grounded in their day-to-day." },
    { persona: "🩺 Busy clinic owner / independent professional", method: "SNAP · Consultative", why: "Zero tolerance for wasted time. Short, valuable, and respectful of their expertise wins." },
    { persona: "💼 Mid-market ops or growth lead", method: "SPIN · Gap · NEAT", why: "Wants a structured diagnosis and a clear ROI they can defend upstairs." },
    { persona: "🏢 Enterprise economic buyer (VP / C-suite)", method: "MEDDIC · Value · Challenger", why: "Cares about strategic impact, defensible metrics, and provocative insight — not features." },
    { persona: "🛠️ Technical decision-maker (CTO / Head of Eng)", method: "Consultative · Conceptual · Challenger", why: "Respects rigour and truth. Will punish sales fluff; rewards technical honesty and reframes." },
    { persona: "🌱 First-time buyer / new market", method: "Consultative · RAIN · Relationship", why: "Needs education and trust before decision. Patient, warm framing outperforms pressure." },
    { persona: "🔁 Warm inbound lead", method: "Inbound · SNAP", why: "Already researching. Guide them; don't push. Escalate to Consultative if the fit is complex." },
    { persona: "❄️ Cold prospect (no prior contact)", method: "SNAP · Challenger · Sandler", why: "Have to earn attention fast with insight, relevance, and permission." },
    { persona: "🇮🇳 Indian / Middle East relationship-first buyer", method: "Relationship · RAIN · Consultative", why: "Rapport and trust are decision inputs, not soft skills. Hard-sell backfires quickly." },
    { persona: "🛒 D2C impulse consumer", method: "Straight Line · Relationship (for repeat)", why: "Decision is emotional and fast. Confidence and clear next action drive conversion." },
  ],
  qualifiers: [
    { framework: "BANT", full: "Budget · Authority · Need · Timeline", strength: "Fast, simple, universally understood", weakness: "Modern buyers often lack formal budget early; too rigid", bestFor: "SDR qualification, high-volume outbound" },
    { framework: "MEDDIC", full: "Metrics · Economic buyer · Decision criteria · Decision process · Identify pain · Champion", strength: "Rigorous, great forecast accuracy, catches process gaps", weakness: "Heavy overhead; overkill for small deals", bestFor: "Complex enterprise B2B" },
    { framework: "NEAT", full: "Needs · Economic impact · Access to authority · Timeline", strength: "Modern balance of business impact and process", weakness: "Less prescriptive than MEDDIC", bestFor: "Mid-market SaaS, teams moving off BANT" },
    { framework: "GPCT", full: "Goals · Plans · Challenges · Timeline", strength: "Buyer-outcome-first, feels natural in conversation", weakness: "Weak on budget/authority", bestFor: "Inbound-heavy motions (HubSpot-style)" },
    { framework: "CHAMP", full: "Challenges · Authority · Money · Prioritization", strength: "Leads with pain rather than budget", weakness: "Similar to BANT if not applied well", bestFor: "Consultative teams that dislike BANT's opener" },
  ],
};

export const PERSONA_TEMPLATES = [
  {
    id: "cautious_cfo",
    label: "Cautious CFO",
    emoji: "💰",
    title: "Chief Financial Officer / Finance Head",
    industry: "Any",
    companySize: "200+ employees",
    painPoints: "Budget overruns, unclear ROI, vendor lock-in, implementation risk",
    personality: "Analytical, skeptical, detail-oriented, risk-averse",
    communication: "Prefers data, case studies, and financial framing. Dislikes hype and vague promises. Wants to see the numbers."
  },
  {
    id: "visionary_founder",
    label: "Visionary Founder",
    emoji: "🚀",
    title: "Founder / CEO / Entrepreneur",
    industry: "Startups, SaaS, tech",
    companySize: "10–200 employees",
    painPoints: "Speed to market, scaling challenges, talent retention, competitive pressure",
    personality: "Ambitious, impatient, pattern-seeking, big-picture thinker",
    communication: "Wants to hear the vision and strategic advantage first. Details come later. Responds to bold claims and social proof from other founders."
  },
  {
    id: "pragmatic_ops",
    label: "Pragmatic Ops Manager",
    emoji: "⚙️",
    title: "Operations / Growth / COO",
    industry: "Any",
    companySize: "50–500 employees",
    painPoints: "Process inefficiency, team bandwidth, integration complexity, change management",
    personality: "Practical, results-focused, skeptical of theory, wants proof of execution",
    communication: "Wants to see how it works day-to-day. Prefers concrete examples, implementation timelines, and clear onboarding."
  },
  {
    id: "technical_buyer",
    label: "Technical Decision Maker",
    emoji: "🛠️",
    title: "CTO / VP Engineering / Head of Product",
    industry: "SaaS, technology, engineering-heavy",
    companySize: "Any",
    painPoints: "Technical debt, integration friction, security concerns, team adoption",
    personality: "Detail-oriented, skeptical of marketing, values transparency and technical honesty",
    communication: "Wants technical depth. Respects honest limitations. Hates buzzwords and oversimplification."
  },
  {
    id: "relationship_buyer",
    label: "Relationship-First Buyer",
    emoji: "🤝",
    title: "Owner / Director in India/MENA",
    industry: "Traditional businesses, family firms, regional enterprises",
    companySize: "Any",
    painPoints: "Trust deficit with vendors, fear of being taken advantage of, need for ongoing support",
    personality: "Relationship-oriented, values trust over speed, consultative in their own way",
    communication: "Wants to know YOU before your product. Expects multiple touchpoints. Dislikes hard-sell or pressure tactics."
  },
  {
    id: "first_time",
    label: "First-Time Buyer",
    emoji: "🌱",
    title: "New purchaser / First-time user",
    industry: "Any",
    companySize: "Any",
    painPoints: "Uncertainty, fear of making the wrong choice, overwhelming options, lack of internal support",
    personality: "Cautious, needs reassurance, values guidance, easily overwhelmed",
    communication: "Needs education and hand-holding. Simple language. Clear next steps. No jargon."
  },
  {
    id: "price_sensitive",
    label: "Price-Sensitive SMB",
    emoji: "🏪",
    title: "Small business owner / Manager",
    industry: "Retail, services, small manufacturing",
    companySize: "1–50 employees",
    painPoints: "Tight budgets, cash flow, need for quick payback, limited staff to implement",
    personality: "Resourceful, direct, time-starved, wants immediate value",
    communication: "Gets to the point. Wants price and ROI upfront. Respects honesty about costs. No fluff."
  },
];

export const LANGUAGES = [
  { id: "en", name: "English", native: "English" },
  { id: "hinglish", name: "Hinglish", native: "Hindi + English mix" },
  { id: "hi", name: "Hindi", native: "हिन्दी" },
  { id: "mr", name: "Marathi", native: "मराठी" },
  { id: "ta", name: "Tamil", native: "தமிழ்" },
  { id: "te", name: "Telugu", native: "తెలుగు" },
  { id: "bn", name: "Bengali", native: "বাংলা" },
  { id: "gu", name: "Gujarati", native: "ગુજરાતી" },
  { id: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  { id: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ" },
];
export const REGIONS = [
  { id: "india", name: "India" },
  { id: "me", name: "Middle East / GCC" },
  { id: "us", name: "United States" },
  { id: "uk", name: "United Kingdom" },
  { id: "sea", name: "Southeast Asia" },
  { id: "global", name: "Global / neutral" },
];

export const DELIVERY = [
  { id: "soft", name: "Soft / warm", note: "Friendly, low pressure, relationship-first" },
  { id: "balanced", name: "Balanced", note: "Confident but not pushy" },
  { id: "hard", name: "Hard / assertive", note: "Direct, high control, pushes for commitment" },
];

/* ---------- AI Role-play simulator ---------- */
export const BUYER_PERSONAS = [
  { id: "owner", label: "Owner / Founder", defaultProfile: "Small business owner with 15-30 employees. Wears multiple hats, time-starved, makes decisions quickly but hates wasting money. Trusts referrals over cold outreach." },
  { id: "sales_head", label: "Sales Head", defaultProfile: "VP or Head of Sales managing a team of 10-50 reps. Obsessed with pipeline, conversion rates, and rep productivity. Skeptical of tools that promise magic." },
  { id: "ops_head", label: "Operations Head", defaultProfile: "COO or Operations Director focused on efficiency, process, and reducing manual work. Needs proof of ROI before moving forward." },
  { id: "hr_head", label: "HR Head", defaultProfile: "HR Director managing hiring, onboarding, and culture. Cost-conscious but willing to invest in retention and productivity tools." },
  { id: "finance_head", label: "Finance Head", defaultProfile: "CFO or Finance Director. Every decision goes through a spreadsheet. Needs hard numbers, payback periods, and risk mitigation." },
  { id: "it_head", label: "IT Head", defaultProfile: "CTO or IT Manager evaluating tools for security, integration, and scalability. Wants technical specs and references from similar companies." },
  { id: "custom", label: "Custom", defaultProfile: "" },
];

export const DIFFICULTY_LEVELS = [
  { id: "easy", label: "Easy", emoji: "🟢", desc: "Cooperative buyer. Low resistance. Good for building confidence." },
  { id: "realistic", label: "Realistic", emoji: "🟡", desc: "Balanced skepticism. The most common real-world buyer." },
  { id: "difficult", label: "Difficult", emoji: "🔴", desc: "Pushy, price-sensitive, short on time. Tests your composure." },
  { id: "expert", label: "Expert / Aggressive", emoji: "🔥", desc: "Knows your product better than you. Aggressive objections. Elite-level practice." },
];

export const RP_SCORE_DIMENSIONS = [
  { key: "discovery", label: "Discovery" },
  { key: "questionQuality", label: "Question Quality" },
  { key: "listening", label: "Listening" },
  { key: "objectionHandling", label: "Objection Handling" },
  { key: "valueProposition", label: "Value Proposition" },
  { key: "rapport", label: "Rapport" },
  { key: "closing", label: "Closing" },
];
