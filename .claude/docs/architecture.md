# Architecture Documentation

## System Overview
```
┌─────────────────┐         ┌──────────────────┐         ┌──────────────┐
│   React SPA     │  ←────  │   Vite Dev       │  ←────  │   Express    │
│   (Port 5173)   │   /api  │   Server         │   proxy │   (Port 3001)│
└─────────────────┘         └──────────────────┘         └──────┬───────┘
                                                                  │
                                                    ┌─────────────┼─────────────┐
                                                    │             │             │
                                               ┌────▼────┐  ┌────▼────┐  ┌────▼────┐
                                               │ SQLite  │  │ Ollama  │  │  CRM    │
                                               │ DB      │  │ Proxy   │  │ (Future)│
                                               └─────────┘  └─────────┘  └─────────┘
```

## Request Flow
1. User opens http://localhost:5173
2. Vite serves the React SPA
3. Frontend makes API call to `/api/...`
4. Vite dev server proxies `/api` → `http://localhost:3001`
5. Express receives request, verifies JWT
6. Express queries SQLite or forwards to Ollama
7. Response flows back through the chain

## Frontend Architecture
```
main.jsx
└── AuthProvider (context)
    └── App (PitchStudio)
        ├── LoginView (if not authenticated)
        └── Shell (if authenticated)
            ├── NavSidebar
            └── Main Content (switch on view)
                ├── ProductsView
                ├── ProductForm
                ├── StudioView (Script Cockpit)
                ├── ScriptsView
                ├── TrainingView
                └── TeamView
```

## State Management
- **Global:** AuthContext (user, login, logout)
- **App-level:** PitchStudio component (products, staff, active product, view)
- **View-level:** Each view manages its own local state
- **API layer:** src/api/client.js — all fetch calls centralized

## Data Flow
```
User Action → React State Update → API Client → Express → SQLite
                                               ↓
                                         Response → React State Update → Re-render
```

## Authentication Flow
```
Register/Login → Express validates → bcrypt hash check → JWT issued
                                                        ↓
                                              Token stored in localStorage
                                                        ↓
                                              All API calls include Bearer token
                                                        ↓
                                              Express verifies JWT → user_id
                                                        ↓
                                              All queries scoped to user_id
```

## Database Relationships
```
users (1) ────────< (*) products
       │
       ├─────────< (*) staff
       │
       └─────────< (*) scripts ────> (*) products (via product_id)
```

## File Organization (Target)
```
script generator/
├── app.jsx                          # Main shell + routing (thin)
├── main.jsx                         # Entry point
├── server.js                        # Express backend
├── vite.config.js                   # Vite + proxy config
├── package.json
├── .env                             # Secrets
├── src/
│   ├── api/
│   │   └── client.js                # All API calls
│   ├── context/
│   │   └── AuthContext.jsx          # Auth state
│   ├── components/
│   │   ├── LoginView.jsx
│   │   ├── NavSidebar.jsx
│   │   ├── ProductsView.jsx
│   │   ├── ProductForm.jsx
│   │   ├── StudioView.jsx
│   │   ├── ScriptCockpit.jsx
│   │   ├── ScriptsView.jsx
│   │   ├── TrainingView.jsx
│   │   └── TeamView.jsx
│   ├── data/
│   │   └── constants.js             # METHODS, CALL_TYPES, LANGUAGES, etc.
│   ├── utils/
│   │   └── helpers.js               # slug, scriptKey, durationsFor, etc.
│   └── styles/
│       └── styles.js                # STYLES string
└── .claude/                         # Project docs (this folder)
```

## Current vs. Target
**Current:** Single 2700-line app.jsx with inline everything
**Target:** Modular structure as above
**Migration path:** Extract bottom-up (helpers → constants → components → views)

## Security Model
| Layer | Protection |
|-------|------------|
| Transport | HTTPS in production |
| Auth | JWT (7-day expiry), bcrypt passwords |
| Authorization | All DB queries include `WHERE user_id = ?` |
| API Key | Stored in .env, used server-side only |
| CORS | Configured for allowed origins |
| Input | Basic presence validation (needs hardening) |
| Output | JSON only, no HTML injection |

## Performance Considerations
- SQLite is single-writer — sufficient for single-user/small-team
- Better-sqlite3 is synchronous (fast for read-heavy workloads)
- For scale: migrate to PostgreSQL with connection pooling
- Frontend: lazy-load TrainingView, defer non-critical components
- AI generation: streaming would improve perceived performance
