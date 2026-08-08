# Feature Roadmap

## Vision
Build the world's best AI sales script generator — one that sales teams cannot live without.

## Philosophy
- **Do one thing better than anyone else:** Script generation is the core. Everything serves this.
- **Every feature must answer:** "Does this help reps close more deals?"
- **Quality > Quantity:** Fewer features, done exceptionally well.

---

## Phase 0 — Foundation ✅ (Done)

### Core Platform
- [x] Registration / Login system
- [x] SQLite database backend
- [x] Express API with auth middleware
- [x] API client layer (frontend)
- [x] AuthContext with session management
- [x] Ollama AI proxy through Express
- [x] Concurrent dev servers (Vite + Express)

### Script Generation
- [x] 15 sales methodologies (SPIN, Challenger, Sandler, etc.)
- [x] 6 call types (Discovery, Demo, Closing, etc.)
- [x] Multi-language support (10+ languages including Hinglish)
- [x] Regional localization
- [x] Delivery style (Soft, Balanced, Hard)
- [x] Simple language mode
- [x] Persona targeting
- [x] Objection handling generation
- [x] Time-segmented scripts with timeline
- [x] Multi-language script comparison (side-by-side)

### Training & Knowledge
- [x] Methodology training cards
- [x] Call type guides
- [x] Comparison tables (B2B vs B2C, segment sizing)
- [x] Persona-method matching guide

---

## Phase 1 — Usability & Performance (Next)

### P1.1 Component Extraction
Extract 2700-line app.jsx into modular components.

### P1.2 Error Handling & Retry
- Error boundaries, retry logic, user-friendly messages.

### P1.3 Loading Skeletons
- Content-aware loading states instead of spinners.

### P1.4 Script Streaming
- Stream AI tokens in real-time instead of waiting for full response.

### P1.5 Mobile-Responsive Studio
- Full mobile experience for reviewing scripts on-the-go.

---

## Phase 2 — Intelligence

### P2.1 Script Effectiveness Tracking
- Mark outcomes (won/lost/pending), add notes, see win rates by methodology.

### P2.2 A/B Script Generation
- Generate 2–3 variants for same setup. Rep picks best fit.

### P2.3 Smart Model Router
- Auto-select best AI model for task complexity.

### P2.4 Self-Improving Scripts
- Track winning patterns, feed back into generation prompts.

---

## Phase 3 — Team & Collaboration

### P3.1 Team Workspaces
- Shared workspace, invite by email, role-based permissions.

### P3.2 Script Review Workflow
- Draft → Peer Review → Manager Approval → Live.

### P3.3 Script Forking & Personalization
- Team scripts as templates, reps personalize without breaking master.

### P3.4 Shared Script Library
- Usage stats, ratings, feedback, leaderboards.

---

## Phase 4 — Integration

### P4.1 CRM Connectors
- Salesforce, HubSpot, Pipedrive. Pull deal stage, auto-suggest scripts.

### P4.2 Calendar Integration
- See upcoming calls, preload scripts.

### P4.3 Public API
- API keys for external tools, Zapier/Make support.

---

## Phase 5 — Differentiation

### P5.1 Voice Practice Mode
- AI plays buyer, scores responses, records for review.

### P5.2 Real-Time Call Cockpit
- Floating panel, timer-synced script following.

### P5.3 Call Recording Analysis
- Upload recording, score script adherence, identify misses.

### P5.4 Company Voice DNA
- Upload pitch decks/emails, AI learns company voice.

---

## Phase 6 — Enterprise

### P6.1 Compliance & Audit
- Audit trails, data residency, PII redaction, approval workflows.

### P6.2 SSO / SAML
- Enterprise SSO, SCIM provisioning.

### P6.3 Advanced Analytics
- Revenue attribution per script, cohort analysis.

---

## Phase 7 — Ecosystem

### P7.1 Script Marketplace
- Industry templates, expert-verified packs, community contributions.

### P7.2 Custom Methodology Builder
- Users define their own methodology frameworks.

### P7.3 White-Label
- Resell script generation under own brand.

---

## Priority Matrix

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Component Extraction | High | Medium | P0 |
| Script Streaming | High | Medium | P1 |
| Win Rate Tracking | High | Small | P1 |
| Team Workspaces | High | Medium | P2 |
| CRM Integration | High | Medium | P2 |
| Voice Practice | High | Large | P3 |
| Call Recording Analysis | High | Large | P3 |
| Company Voice DNA | Very High | Large | P4 |
| Marketplace | Medium | Large | P5 |
| White-Label | Medium | Large | P5 |

---

## Success Metrics
- **Activation:** User generates first script within 24h of signup
- **Retention:** 60%+ weekly active users after 4 weeks
- **Engagement:** 5+ scripts generated per user per month
- **Outcomes:** Scripts with "won" outcome > 30% (tracked)
- **NPS:** > 50 from active users
