# Pitch Studio — Script Generator

## Project Overview
A live-call cockpit for sales teams. Enter a product once → pick methodology + call type + duration → AI generates a time-segmented script + objection handling. Scripts are saved to a database and never regenerate unless explicitly requested.

## Quick Start
```bash
cd "script generator"
npm install
npm run dev        # Runs Vite (5173) + Express API (3001)
```

## Architecture
- **Frontend:** React 18 + Vite (port 5173)
- **Backend:** Express + SQLite (port 3001)
- **AI:** Ollama proxy via Express (model: glm-5.2:cloud)
- **Auth:** JWT + bcrypt, token stored in localStorage
- **Database:** SQLite (`database.sqlite`) — users, products, staff, scripts

## Project Structure
```
script generator/
├── app.jsx                  # Main React app (all views + components)
├── main.jsx                 # Entry point, mounts App with AuthProvider
├── server.js                # Express backend + SQLite + API routes
├── vite.config.js           # Vite config with /api proxy
├── package.json
├── .env                     # Secrets (API keys, JWT secret)
├── database.sqlite          # SQLite database (gitignored)
├── src/
│   ├── api/client.js        # API fetch wrappers
│   ├── context/AuthContext.jsx
│   └── components/LoginView.jsx
└── .claude/                 # Project management docs
    ├── CLAUDE.md            # This file — project context
    ├── features/
    │   ├── 01-core-generation.md
    │   ├── 02-auth-system.md
    │   ├── 03-database-backend.md
    │   └── roadmap.md       # Future features
    ├── tasks/
    │   ├── backlog.md
    │   ├── in-progress.md
    │   └── completed.md
    ├── docs/
    │   ├── architecture.md
    │   ├── api-reference.md
    │   └── database-schema.md
    └── decisions/
        └── 001-sqlite-over-postgres.md
```

## Current State
- ✅ Registration / Login with JWT auth
- ✅ SQLite database with users, products, staff, scripts tables
- ✅ Express API with CRUD + auth middleware
- ✅ Ollama proxy through Express (API key protected)
- ✅ Vite dev proxy to Express
- ✅ AuthContext with auto-session restore
- ✅ LoginView component
- ✅ API client layer (src/api/client.js)
- ✅ S storage helper migrated to API backend
- ✅ Concurrent dev scripts (Vite + Express)

## Environment Variables
```env
OLLAMA_CLOUD_BASE_URL=http://localhost:11434
OLLAMA_CLOUD_API_KEY=***
VITE_OLLAMA_MODEL=glm-5.2:cloud
SERVER_PORT=3001
JWT_SECRET=***
```

## Database Tables
- `users` — id, email, password_hash, company_name
- `products` — id, user_id, name, category, one_liner, description, ideal_customer, pain_points, differentiators, price_model, proof_points, competitors
- `staff` — id, user_id, name, role, languages (JSON)
- `scripts` — id, user_id, product_id, method, call_type, duration, language, region, delivery, simple, persona, opening, tone_level, tone_guidance, segments_json, objections_json, saved_at

## API Endpoints (all prefixed /api)
- `POST /auth/register` — {email, password, company_name}
- `POST /auth/login` — {email, password}
- `GET /auth/me` — verify JWT
- `GET|PUT /settings` — company name
- `GET|POST|PUT|DELETE /products` — CRUD
- `GET|POST|DELETE /staff` — CRUD
- `GET|POST|DELETE /scripts` — CRUD
- `POST /chat` — Ollama proxy

## Development Notes
- The S storage helper in app.jsx is now API-backed — it translates old localStorage calls into REST API calls
- Script generation uses unique index on config combination for upsert behavior
- JWT expires in 7 days
- All data is scoped to user_id
- The app.jsx file is ~2700 lines with inline CSS (STYLES string) + all components
- No component splitting yet — everything is in app.jsx

## Tech Debt / Known Issues
- app.jsx is a single 2700-line file — needs component extraction
- No error boundary
- No loading skeletons beyond spinner
- No retry logic for failed API calls
- No offline mode
- ProductForm still generates its own random ID (should use API response)
- No input validation on backend beyond basic presence checks

## Next Priority
See `.claude/features/roadmap.md` and `.claude/tasks/backlog.md`
