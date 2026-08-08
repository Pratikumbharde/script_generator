# 🎯 Pitch Studio

> **AI-powered sales script generator and call intelligence platform for high-performing sales teams.**

Turn your product details into battle-tested, AI-generated sales scripts with objection handling, tone guidance, and real-time coaching. Analyze calls, score deals, and continuously improve your team's performance.

---

## ✨ Features

### 📝 Script Generation
- **AI-powered script creation** — Enter product once, generate scripts for any methodology, call type, duration, and language
- **Time-segmented scripts** — Opening → Value prop → Discovery → Close, with minute-by-minute guidance
- **Objection handling** — Pre-built rebuttals for common objections in any industry
- **Tone & delivery guidance** — AI-suggested tone levels and speaking tips

### 🎭 Practice & Role-Play
- **AI-powered role-play** — Practice with AI prospects that respond realistically
- **Speech recognition** — Talk naturally, get real-time feedback (Chrome/Safari)
- **Performance scoring** — Get scored on objection handling, closing, discovery, and more

### 📊 Deal Intelligence
- **Deal Score Analysis** — AI-powered assessment of deal quality and likelihood to close
- **Risk identification** — Spot deal-killing risks before they cost you revenue
- **Evidence-based scoring** — Scores backed by transcript evidence and call data

### 🔄 Auto-Optimization
- **Closed-loop learning** — Real calls → Transcripts → Win/Loss Analysis → AI Recommendations
- **Impact scoring** — High/Medium/Low impact suggestions with current vs. recommended text
- **One-click apply** — Apply AI suggestions directly to scripts

### 🧠 Conversation Intelligence
- **Sentiment analysis** — Track prospect sentiment throughout the call
- **Coaching insights** — Personalized coaching with exact moments to improve
- **Heatmaps** — Visualize conversation patterns across your team
- **A/B Testing** — Test script variants and measure performance

### 👥 Team Management
- **Workspace & roles** — Owner, admin, member roles with permissions
- **API keys** — Generate keys for integrations
- **Webhooks** — Trigger events on script completion, usage, etc.

### ⚙️ Admin Settings
- **Multi-provider AI** — OpenAI, Anthropic, Ollama support with multiple accounts
- **Primary model selection** — Set which AI account to use by default
- **SMTP configuration** — Built-in email sending with template management
- **Email templates** — Transactional (registration, forgot password, OTP) + notification templates

---

## 🖼️ Screenshots

*(Coming soon — add your screenshots here)*

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+ ([Download](https://nodejs.org))
- **npm** v9+ (comes with Node.js)
- **SQLite** (built-in, no setup needed)
- **Ollama** (optional, for local AI) ([Install](https://ollama.com))

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/ukvalley/pitch-studio.git
cd pitch-studio

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env

# 4. Edit .env with your settings
# Required: JWT_SECRET, ALLOWED_ORIGINS
# Optional: OLLAMA_CLOUD_BASE_URL, SMTP settings

# 5. Start development server
npm run dev
```

This starts:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001

### Build for Production

```bash
npm run build
```

Outputs to `dist/` folder.

---

## ⚙️ Environment Variables

Create a `.env` file in the project root:

```env
# Server
SERVER_PORT=3001
NODE_ENV=development

# Security (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this

# AI Provider (choose one or configure via admin UI)
OLLAMA_CLOUD_BASE_URL=http://localhost:11434
OLLAMA_CLOUD_API_KEY=
OLLAMA_MODEL=glm-5.2:cloud

# CORS — your frontend origin
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3001

# SMTP (optional — can also configure via Settings UI)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
SMTP_SECURE=tls
```

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, Lucide React icons |
| **Backend** | Express 5, Node.js |
| **Database** | SQLite (better-sqlite3) |
| **Auth** | JWT (jsonwebtoken), bcryptjs |
| **AI Proxy** | OpenAI, Anthropic, Ollama |
| **Email** | Nodemailer |
| **PWA** | Service Worker, Web App Manifest |
| **Styling** | CSS-in-JS (single styles.js file) |

---

## 📁 Project Structure

```
pitch-studio/
├── app.jsx                    # Main React app with routing
├── server.js                  # Express API server
├── index.html                 # HTML entry point
├── main.jsx                   # React entry point
├── public/
│   ├── icons/                 # PWA icons
│   ├── manifest.json          # PWA manifest
│   └── sw.js                  # Service worker
├── src/
│   ├── api/
│   │   └── client.js          # Frontend API client
│   ├── components/            # React components
│   │   ├── AutoOptimizationView.jsx
│   │   ├── DealScoreView.jsx
│   │   ├── ScriptRefinementView.jsx
│   │   ├── SettingsView.jsx
│   │   ├── Sidebar.jsx
│   │   └── ... (45+ components)
│   ├── context/
│   │   └── AuthContext.jsx    # Auth provider
│   ├── data/
│   │   └── constants.js       # Languages, roles, etc.
│   ├── styles/
│   │   └── styles.js          # Design system CSS
│   └── utils/
│       └── helpers.js         # Storage, formatters
├── database.sqlite            # SQLite database (auto-created)
├── .env                       # Environment variables
├── .env.example               # Example env file
├── package.json
└── vite.config.js
```

---

## 📦 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products |
| POST | `/api/products` | Create product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |

### Scripts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/scripts` | List scripts |
| POST | `/api/scripts` | Generate script |
| PUT | `/api/scripts/:id` | Update script |
| DELETE | `/api/scripts/:id` | Delete script |
| POST | `/api/scripts/:id/share` | Create share link |

### Deal Score
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/deal-scores/analyze` | Analyze deal |
| GET | `/api/deal-scores` | List scores |
| DELETE | `/api/deal-scores/:id` | Delete score |

### Auto-Optimization
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auto-optimizations/overview` | Get overview |
| GET | `/api/auto-optimizations` | List optimizations |
| POST | `/api/auto-optimizations/generate` | Generate suggestions |
| POST | `/api/auto-optimizations/:id/apply` | Apply suggestion |
| DELETE | `/api/auto-optimizations/:id` | Delete suggestion |

### AI Configuration
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ai-accounts` | List AI accounts |
| POST | `/api/ai-accounts` | Create account |
| PUT | `/api/ai-accounts/:id` | Update account |
| DELETE | `/api/ai-accounts/:id` | Delete account |
| POST | `/api/ai-accounts/:id/primary` | Set primary |

### Email Templates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/email-templates` | List templates |
| POST | `/api/email-templates` | Create template |
| PUT | `/api/email-templates/:id` | Update template |
| DELETE | `/api/email-templates/:id` | Delete template |
| POST | `/api/email-templates/:id/duplicate` | Duplicate template |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | AI proxy (OpenAI/Anthropic/Ollama) |
| POST | `/api/chat/stream` | Streaming AI proxy |

*(See `server.js` for full API reference)*

---

## 🚀 Deployment

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for detailed deployment guides:

- **Shared Hosting (cPanel)** — Step-by-step for beginners
- **VPS (DigitalOcean, Linode, Vultr)** — Production-grade Nginx + PM2 setup
- **Render.com** — Free tier, one-click deploy
- **Railway.app** — Modern developer experience
- **Fly.io** — Global edge deployment

---

## 🛠️ Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite + Express concurrently |
| `npm run server` | Start Express server only |
| `npm run build` | Build frontend for production |
| `npm run preview` | Preview production build locally |

### Database

SQLite database auto-creates on first run. Tables:
- `users`, `products`, `scripts`, `workspaces`, `workspace_members`
- `deal_scores`, `auto_optimizations`, `coaching_insights`
- `ai_model_accounts`, `email_templates`, `api_keys`, `webhooks`
- `script_shares`, `scheduled_calls`, `script_comments`

*(See `server.js` for full schema)*

---

## 🔐 Security

- **JWT authentication** with Bearer tokens
- **Password hashing** with bcryptjs
- **CORS** restricted to allowed origins
- **SQL injection** protection via parameterized queries
- **API key authentication** for external integrations
- **Input validation** on all endpoints

---

## 🐛 Troubleshooting

### "Port already in use"
```bash
lsof -i :3001
kill -9 <PID>
```

### "Cannot find module"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Frontend shows old version
- Hard refresh: **Ctrl+F5** (Windows) / **Cmd+Shift+R** (Mac)
- Unregister service worker in DevTools → Application → Service Workers

### SQLite readonly error
```bash
chmod 777 database.sqlite
```

---

## 📄 License

[MIT License](LICENSE) — Feel free to use, modify, and distribute.

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m "Add feature"`
4. Push to branch: `git push origin feature-name`
5. Open a Pull Request

---

## 📧 Support

- **Issues**: [GitHub Issues](https://github.com/ukvalley/pitch-studio/issues)
- **Email**: support@pitchstudio.com *(placeholder)*

---

## 🌟 Acknowledgements

Built with ❤️ by the Pitch Studio team.

Special thanks to:
- [React](https://react.dev) for the UI framework
- [Vite](https://vitejs.dev) for blazing fast development
- [Express](https://expressjs.com) for the backend
- [SQLite](https://sqlite.org) for lightweight data storage
- [Ollama](https://ollama.com) for local AI inference

---

**Happy selling! 🚀**
