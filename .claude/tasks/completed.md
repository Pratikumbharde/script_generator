# Completed Tasks

## ✅ Authentication System
- JWT-based auth with bcrypt password hashing
- Register + Login endpoints
- AuthContext with auto-session restore
- LoginView component with register/login toggle
- Logout button in sidebar
- API client with Bearer token injection

## ✅ Database Backend
- SQLite with better-sqlite3
- Tables: users, products, staff, scripts
- Unique index on scripts for upsert behavior
- All CRUD endpoints with user_id scoping
- ON CONFLICT upsert for script saves

## ✅ API Layer
- Express server (port 3001)
- CORS enabled
- Auth middleware (JWT verification)
- Settings, Products, Staff, Scripts CRUD
- Ollama proxy moved from Vite to Express
- Vite proxy config pointing to Express

## ✅ Frontend Integration
- S storage helper migrated to API backend
- useAuth hook for global auth state
- Conditional rendering (login vs. app)
- Company name from user record
- All data flows through API client

## ✅ Dev Infrastructure
- Concurrently running Vite + Express
- .env for secrets
- .gitignore for .env and database.sqlite
- package.json scripts updated

## ✅ Ollama Integration
- Proxy through Express (API key protected)
- Model: glm-5.2:cloud
- Response normalization (Ollama + OpenAI-compatible)
- CORS handling for local Ollama

## ✅ Security
- Passwords hashed with bcrypt
- JWT secret in .env
- API key never exposed to browser
- All endpoints protected by auth middleware
- Data scoped to user_id

## ✅ Error Boundaries + Retry Logic (P0.2)
- ErrorBoundary class component wrapping the app
- ErrorFallback UI with retry and reload buttons
- Retry logic in API client: 3 retries with exponential backoff (500ms, 1s, 2s)
- User-friendly error messages instead of raw crashes

## ✅ Loading Skeletons (P0.3)
- CardSkeleton for product grids
- RowSkeleton for scripts library and lists
- FormSkeleton for forms
- SidebarSkeleton for navigation
- CockpitSkeleton for script studio
- Shimmer animation matching app color palette
- Replaced spinners in auth load, data load, and scripts view

## ✅ Component Extraction (P0.1)
- Extracted all data constants to `src/data/constants.js` — METHODS, CALL_TYPES, DURATIONS, LANGUAGES, REGIONS, DELIVERY, etc.
- Extracted all helpers to `src/utils/helpers.js` — slug, scriptKey, safeParseJSON, closeOpenStructures, callModel, productBlock, styleBlock, generateScript, normalizeSegments, nameOf, parseScriptKey
- Extracted STYLES template to `src/styles/styles.js`
- Extracted view components into separate files:
  - `src/components/ProductsView.jsx`
  - `src/components/ProductForm.jsx`
  - `src/components/ScriptsView.jsx`
  - `src/components/TrainingView.jsx` (+ all sub-components: MethodDetail, CallTypeDetail, MethodOverviewTable, B2CTable, SegmentsTable, MatrixTable, PersonasTable, QualifiersTable)
  - `src/components/StudioView.jsx`
  - `src/components/ScriptCockpit.jsx` (+ ObjectionPanel)
  - `src/components/TeamView.jsx`
- Reduced `app.jsx` from ~2700 lines to 134 lines
- Cleaned up unused imports in `app.jsx`
- All components export default correctly
- Build passes cleanly (46 modules, zero warnings)

## ✅ Script Streaming Generation (P1.1)
- Added `POST /api/chat/stream` endpoint in `server.js` that pipes raw NDJSON/SSE from Ollama to the client without buffering
- Added `callModelStream(system, prompt, onChunk)` in `src/utils/helpers.js` — parses streaming tokens client-side via `response.body.getReader()`
- Added `generateScriptStream(opts, onProgress)` in `src/utils/helpers.js` — streams both core script + objections with stage progress callbacks
- Updated `StudioView.jsx` to use `generateScriptStream` instead of blocking `generateScript`
- Added live preview UI: stage indicator with pulsing dot, status message, and accumulating text preview panel
- Added streaming-specific CSS: `.stream-status`, `.stream-preview`, `.dot` pulse animation
- Backward compatible: `generateScript()` remains untouched for on-demand language generation in `ScriptCockpit.jsx`
- Build passes cleanly (46 modules, zero warnings)

## ✅ Script Effectiveness Tracking (P1.2)
- Added `outcome`, `notes`, `used_at` columns to `scripts` table via `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
- Added `PUT /api/scripts/:id` endpoint for updating outcome/notes/used_at
- Added `updateScript` to `src/api/client.js`
- Updated `S.get` in `src/utils/helpers.js` to return `outcome`, `notes`, `usedAt`
- Added `updateScriptMeta(key, { outcome, notes, usedAt })` helper in `src/utils/helpers.js`
- Updated `ScriptCockpit.jsx` with outcome tracking UI:
  - 4 outcome buttons: Won, Lost, No deal, Pending (with color coding)
  - "Mark as used" button with date display
  - Post-call notes textarea with auto-save on blur
- Updated `ScriptsView.jsx` with win rate dashboard showing:
  - Overall win rate percentage
  - Breakdown: won / lost / no deal / pending counts
- Updated `ScriptsView` `load()` to capture `outcome` from records
- Build passes cleanly (46 modules, zero warnings)

## ✅ Team Workspaces (P1.3)
- Added `workspaces` and `workspace_members` tables with invite token support
- Added `workspace_id` and `visibility` columns to `products` and `scripts` tables
- Auto-migration: creates personal workspace for existing users, migrates existing products/scripts
- Updated `/api/auth/register` to create workspace for new users
- Updated `/api/auth/me` to include workspace + members in response
- Added workspace endpoints:
  - `GET /api/workspace` — get workspace + members + pending invites
  - `PUT /api/workspace` — rename workspace (owner/admin only)
  - `POST /api/workspace/invite` — invite by email with token
  - `POST /api/workspace/join` — accept invite with token
- Updated `products` and `scripts` endpoints to include workspace-shared items
- Updated `AuthContext` with `workspace` state and `setWorkspace` setter
- Updated `app.jsx` sidebar to show workspace name + member count
- Updated `TeamView` with workspace management UI:
  - Workspace name editor
  - Invite teammates by email with role selection (owner/admin only)
  - Pending invites list
  - Members list with roles
  - "Join workspace" token input for accepting invites
- Added workspace API helpers: `getWorkspace`, `updateWorkspace`, `inviteMember`, `joinWorkspace`
- Build passes cleanly (46 modules, zero warnings)

## ✅ Public API + Webhooks (P1.4)
- Added `api_keys` table with SHA-256 hashed keys and scopes (`scripts:read`, `scripts:write`)
- Added `webhooks` table with URL, events, secret, and active flag
- Added API key management endpoints (JWT protected):
  - `GET /api/api-keys` — list keys (masked)
  - `POST /api/api-keys` — create key (returns raw key once)
  - `DELETE /api/api-keys/:id` — revoke key
- Added webhook management endpoints (JWT protected):
  - `GET /api/webhooks` — list webhooks
  - `POST /api/webhooks` — create webhook
  - `PUT /api/webhooks/:id` — update webhook (toggle active, change URL/events/secret)
  - `DELETE /api/webhooks/:id` — delete webhook
- Added public API endpoints (API key auth via `x-api-key` header):
  - `GET /api/v1/products` — list products (requires `scripts:read` scope)
  - `POST /api/v1/scripts/generate` — generate script via Ollama (requires `scripts:write` scope)
- Added webhook dispatcher with HMAC-SHA256 signature (`X-Pitch-Signature` header)
- Dispatches `script.completed` and `script.used` events
- Updated `TeamView.jsx` with `IntegrationsSettings` component:
  - API key list with creation + one-time reveal + revoke
  - Webhook list with toggle active/pause + delete
  - Add webhook form (URL, events, secret)
- Updated `src/api/client.js` with API key and webhook helpers
- Updated `.claude/docs/api-reference.md` with public API docs
- Build passes cleanly (46 modules, zero warnings)

## ✅ Mobile App / PWA (P2.1)
- Added `public/manifest.json` with PWA manifest (standalone display, theme color, icons)
- Generated `public/icons/icon-192.png` and `public/icons/icon-512.png`
- Created `public/sw.js` service worker:
  - Cache-first strategy for static assets
  - Stale-while-revalidate for API requests
  - Push notification handler placeholder
- Updated `index.html` with PWA meta tags:
  - `theme-color`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`
  - `apple-touch-icon`, `manifest` link
- Registered service worker in `main.jsx`
- Added install prompt component in `app.jsx` with `beforeinstallprompt` listener
- Added mobile-responsive CSS breakpoints in `src/styles/styles.js`:
  - Sidebar collapses to horizontal nav at ≤860px
  - Cockpit stacks vertically on mobile
  - Reduced padding and font sizes at ≤560px
  - `.pwa-install` floating banner styles
- Updated `ScriptsView.jsx` with card view toggle:
  - Button to switch between list and card layout
  - Card view auto-enabled on small screens
  - Cards reuse existing `.pcard` styling with action buttons
- Build passes cleanly (46 modules, zero warnings)

## ✅ Voice Practice Mode (P2.2)
- Created `src/components/PracticeView.jsx` with full practice flow:
  - Script picker: grid of saved scripts with product/method/call type info
  - AI scenario generation: uses existing `callModel` helper to generate buyer objections
  - Response input: textarea with Cmd/Ctrl+Enter shortcut
  - AI evaluation: scores on Confidence, Coverage, Tone (0-100 each)
  - Feedback display: strengths, improvements, and overall feedback
  - Score bars with color coding (green ≥80, amber ≥60, red <60)
  - Session history: last 50 practice rounds with average score
  - Retry and new scenario buttons
- Added practice-specific CSS in `src/styles/styles.js`:
  - `.practice-scenario`, `.practice-buyer`, `.practice-scores`
  - `.practice-score` bars, `.practice-total` overall score
  - `.practice-history` with `.ph-row` entries
  - Mobile responsive score layout
- Updated `app.jsx`:
  - Added `PracticeView` import
  - Added "Practice" nav item with 🎤 icon
  - Wired `view === "practice"` route
- Build passes cleanly (47 modules, zero warnings)

## ✅ Script Component Library (P2.3)
- Added `components` table to `server.js` with fields:
  - `id`, `user_id`, `workspace_id`, `name`, `type`, `content`, `tags`, `method`, `product_id`, `created_at`
  - Type constraint: `opening`, `close`, `objection_handler`, `rapport`, `value_prop`, `discovery_question`, `transition`
- Added component CRUD endpoints (JWT protected):
  - `GET /api/components` — list with optional `type` filter
  - `POST /api/components` — create
  �� `PUT /api/components/:id` — update
  - `DELETE /api/components/:id` — delete
- Added component API helpers to `src/api/client.js`:
  - `listComponents`, `createComponent`, `updateComponent`, `deleteComponent`
- Created `src/components/ComponentLibrary.jsx`:
  - Type filter pills with counts (All, Opening, Close, Objection, Rapport, Value Prop, Discovery, Transition)
  - Create form with name, type dropdown, content textarea, tags input
  - Component cards with type badge, name, quoted content, tags
  - Copy to clipboard button with feedback
  - Delete with confirmation
- Added component-specific CSS in `src/styles/styles.js`:
  - `.comp-grid`, `.comp-card`, `.comp-head`, `.comp-type`
  - `.comp-name`, `.comp-content`, `.comp-tags`
- Updated `app.jsx`:
  - Added `ComponentLibrary` import
  - Added "Components" nav item with 📦 icon
  - Wired `view === "components"` route
- Build passes cleanly (48 modules, zero warnings)

## ✅ Enhanced Persona Engine (P2.4)
- Added `PERSONA_TEMPLATES` to `src/data/constants.js` with 7 structured personas:
  - Cautious CFO, Visionary Founder, Pragmatic Ops Manager, Technical Decision Maker, Relationship-First Buyer, First-Time Buyer, Price-Sensitive SMB
  - Each includes: title, industry, company size, pain points, personality, communication style
- Updated `styleBlock` in `src/utils/helpers.js`:
  - Accepts optional `personaDetail` object
  - When present, generates rich multi-line persona context in the prompt:
    - Label, title, industry, company size, pain points, personality, communication style
  - Backward compatible: string personas still work as before
- Updated `StudioView.jsx` with enhanced persona selector:
  - Grid of persona template cards with emoji, label, and title
  - Clicking a template selects it and shows detail panel
  - Detail panel shows pain points, personality, communication style
  - Hide/show toggle for detail panel
  - Template selection syncs with the existing persona dropdown
- Added persona-specific CSS in `src/styles/styles.js`:
  - `.persona-grid`, `.persona-card`, `.persona-emoji`
  - `.persona-name`, `.persona-title`, `.persona-detail`, `.persona-field`
- Build passes cleanly (48 modules, zero warnings)

## ✅ CRM Integration (P3.1)
- Added `crm_connections` table to `server.js` with fields:
  - `id`, `user_id`, `crm_type`, `webhook_url`, `api_token`, `config_json`, `active`, `created_at`
  - CRM type constraint: `salesforce`, `hubspot`, `pipedrive`, `zapier`, `custom`
- Added CRM endpoints (JWT protected):
  - `GET /api/crm` — list connections
  - `POST /api/crm` — create/replace connection
  - `PUT /api/crm/:id` — toggle active
  - `DELETE /api/crm/:id` — disconnect
- Added `dispatchCrm` helper in `server.js`:
  - Sends HMAC-SHA256 signed webhook payloads to all active CRM connections
  - Triggered automatically when a script is marked as used (`PUT /api/scripts/:id`)
- Added CRM API helpers to `src/api/client.js`:
  - `listCrmConnections`, `createCrmConnection`, `updateCrmConnection`, `deleteCrmConnection`
- Updated `TeamView.jsx` IntegrationsSettings with CRM UI:
  - CRM type selector (Salesforce, HubSpot, Pipedrive, Zapier, Custom)
  - Webhook URL input
  - API token input (optional, for HMAC signature)
  - List of active connections with disconnect button
- Build passes cleanly (48 modules, zero warnings)
