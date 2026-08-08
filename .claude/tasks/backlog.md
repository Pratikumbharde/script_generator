# Current Backlog — Prioritized

## 🔴 P0 — Critical (Do Next)

### P0.1 Component Extraction
**Why:** app.jsx is 2700 lines. Any change requires loading the entire file, burning tokens.
**What:** Extract components into separate files under `src/components/`
**Files to create:**
- `src/components/NavSidebar.jsx`
- `src/components/ProductsView.jsx`
- `src/components/ProductForm.jsx`
- `src/components/StudioView.jsx` (largest — script cockpit)
- `src/components/ScriptsView.jsx`
- `src/components/TeamView.jsx`
- `src/components/TrainingView.jsx`
- `src/components/ScriptCockpit.jsx` (the timeline + segments UI)
- `src/components/shared/Styles.jsx` (STYLES string)
- `src/components/shared/Loading.jsx`
- `src/data/constants.js` (METHODS, CALL_TYPES, LANGUAGES, etc.)
- `src/utils/helpers.js` (slug, scriptKey, durationsFor, etc.)
**Estimated effort:** Medium (2–3 hours)
**Impact:** High — reduces token usage per session dramatically

### P0.2 Error Boundaries + Retry Logic
**Why:** Currently any API failure crashes the experience with raw error text.
**What:**
- Add ErrorBoundary around the app
- Add retry with exponential backoff to API client
- Add user-friendly error states (not just "Generation service returned 404")
**Estimated effort:** Small (1 hour)

### P0.3 Loading Skeletons
**Why:** Current loading is just a spinner. Perceived performance matters.
**What:** Replace spinner with content skeletons that match the layout shape.
**Estimated effort:** Small (1 hour)

## 🟡 P1 — High Priority

### P1.1 Script Streaming Generation
**Why:** Scripts take 5–15 seconds to generate. Users stare at a spinner. Streaming would show progress.
**What:**
- Switch Ollama proxy to handle streaming (`stream: true`)
- Frontend progressively renders script as tokens arrive
- Show a live preview of the script being built
**Estimated effort:** Medium
**Depends on:** P0.1 (cleaner component structure needed)

### P1.2 Script Effectiveness Tracking
**Why:** Users don't know which scripts work. This is the core value proposition.
**What:**
- Add `outcome` field to scripts (won/lost/no_deal/pending)
- Add `notes` field for post-call reflection
- Add simple dashboard: "Scripts by win rate"
**DB change:** Add `outcome`, `notes`, `used_at` to scripts table
**Estimated effort:** Small

### P1.3 Team Workspaces (Multi-User Within Company)
**Why:** Currently each user is isolated. Sales teams need shared script libraries.
**What:**
- Add `workspaces` table
- User belongs to workspace
- Products and scripts can be workspace-shared or private
- Invite by email flow
**Estimated effort:** Medium

### P1.4 Public API + Webhooks
**Why:** Power users want to generate scripts from their CRM/automation tools.
**What:**
- API key generation for users
- Public endpoints: `POST /api/v1/scripts/generate`
- Webhooks: script.completed, script.used
**Estimated effort:** Medium

## 🟢 P2 — Medium Priority

### P2.1 Mobile App / PWA
**Why:** Reps review scripts on phones before calls.
**What:**
- PWA manifest + service worker
- Mobile-optimized script view (card mode)
- Push notifications for upcoming calls
**Estimated effort:** Medium

### P2.2 Voice Practice Mode
**Why:** Reps need to practice before real calls.
**What:**
- AI reads buyer objections, rep responds
- AI scores responses (confidence, coverage, tone)
- Record and playback
**Estimated effort:** Medium–Large

### P2.3 Script Component Library
**Why:** Users rebuild the same opening hooks and closes repeatedly.
**What:**
- Save individual segments as reusable components
- Component library with tags (opening, close, objection_handler, rapport)
- Drag-and-drop script builder
**Estimated effort:** Medium

### P2.4 Enhanced Persona Engine
**Why:** Generic personas produce generic scripts.
**What:**
- Detailed persona builder: title, industry, company size, pain points, personality type, communication style
- AI uses persona depth for hyper-personalized scripts
- Persona templates (e.g., "Cautious CFO", "Visionary Founder")
**Estimated effort:** Small

## 🔵 P3 — Future / Nice to Have

### P3.1 CRM Integration
- Salesforce/HubSpot/Pipedrive connectors
- Auto-pull deal stage and buyer info
- Log script usage back to CRM

### P3.2 Real-Time Call Cockpit
- Floating panel during Zoom/Teams calls
- Timer-synced script following
- Smart pause detection

### P3.3 Call Recording Analysis
- Upload recording → AI scores script adherence
- Identify missed opportunities
- Suggest script improvements

### P3.4 Company Voice DNA
- Upload company pitch decks, emails, call recordings
- Fine-tune generation to match company voice
- Style consistency across all scripts

### P3.5 Self-Improving AI
- Track which scripts lead to wins
- Feedback loop to improve generation prompts
- A/B test script variants

### P3.6 Marketplace
- Pre-built script templates by industry
- Community-contributed methodologies
- Expert-verified script packs

---

## Task Template (for new tasks)
```markdown
### TASK-ID: Feature Name
**Status:** backlog | in-progress | completed | blocked
**Priority:** P0 | P1 | P2 | P3
**Owner:** (agent name or unassigned)
**Started:** YYYY-MM-DD
**Completed:** YYYY-MM-DD

**Why:** (business reason)
**What:** (technical description)
**Files to touch:** (list)
**DB changes:** (if any)
**API changes:** (if any)
**Estimated effort:** Small | Medium | Large
**Blocked by:** (task IDs)
**Blocks:** (task IDs)

**Checklist:**
- [ ] Backend implementation
- [ ] Frontend implementation
- [ ] Database migration (if needed)
- [ ] API documentation update
- [ ] Manual testing
- [ ] Update .claude/tasks/completed.md
```
