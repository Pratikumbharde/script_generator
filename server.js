import express from 'express'
import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import cors from 'cors'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'
import nodemailer from 'nodemailer'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.SERVER_PORT || 3001
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'
const OLLAMA_BASE_URL = process.env.OLLAMA_CLOUD_BASE_URL || 'http://localhost:11434'
const OLLAMA_API_KEY = process.env.OLLAMA_CLOUD_API_KEY
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || process.env.VITE_OLLAMA_MODEL || 'glm-5.2:cloud'

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())
  : ['http://localhost:5173', 'http://localhost:3001', 'http://127.0.0.1:5173']

app.use(cors({ origin: ALLOWED_ORIGINS }))
app.use(express.json())

/* ---------- SQLite database ---------- */
const db = new Database(path.join(__dirname, 'database.sqlite'))

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    company_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    workspace_id INTEGER,
    visibility TEXT DEFAULT 'private' CHECK(visibility IN ('private','workspace')),
    name TEXT NOT NULL,
    category TEXT,
    one_liner TEXT,
    description TEXT,
    ideal_customer TEXT,
    pain_points TEXT,
    differentiators TEXT,
    price_model TEXT,
    proof_points TEXT,
    competitors TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    role TEXT,
    languages TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS scripts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    workspace_id INTEGER,
    visibility TEXT DEFAULT 'private' CHECK(visibility IN ('private','workspace')),
    product_id INTEGER NOT NULL,
    method TEXT NOT NULL,
    call_type TEXT NOT NULL,
    duration INTEGER NOT NULL,
    language TEXT NOT NULL,
    region TEXT NOT NULL,
    delivery TEXT NOT NULL,
    simple INTEGER NOT NULL DEFAULT 0,
    persona TEXT NOT NULL DEFAULT 'general',
    opening TEXT,
    tone_level TEXT,
    tone_guidance TEXT,
    segments_json TEXT,
    objections_json TEXT,
    saved_at INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_scripts_config ON scripts (
    user_id, product_id, method, call_type, duration, language, region, delivery, simple, persona
  );

  -- P1.2 migration: add outcome tracking columns if missing
  /* (migrated below after db init) */

  -- P1.3 migration: workspace support
  CREATE TABLE IF NOT EXISTS workspaces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    owner_user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS workspace_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workspace_id INTEGER NOT NULL,
    user_id INTEGER,
    role TEXT NOT NULL DEFAULT 'member',
    invited_email TEXT,
    invite_token TEXT,
    joined_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- P1.4 migration: API keys + webhooks
  CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    key_hash TEXT NOT NULL,
    name TEXT,
    scopes TEXT DEFAULT 'scripts:read,scripts:write',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_used_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS webhooks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    url TEXT NOT NULL,
    events TEXT NOT NULL, -- comma-separated: script.completed,script.used
    secret TEXT,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    webhook_id INTEGER NOT NULL,
    event TEXT NOT NULL,
    payload TEXT NOT NULL,
    status INTEGER,
    response_body TEXT,
    attempted_at INTEGER,
    succeeded INTEGER DEFAULT 0
  );

  -- P2.3 migration: script component library
  CREATE TABLE IF NOT EXISTS components (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    workspace_id INTEGER,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('opening','close','objection_handler','rapport','value_prop','discovery_question','transition')),
    content TEXT NOT NULL,
    tags TEXT,
    method TEXT,
    product_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- P3.1 migration: CRM integration
  CREATE TABLE IF NOT EXISTS crm_connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    crm_type TEXT NOT NULL CHECK(crm_type IN ('salesforce','hubspot','pipedrive','zapier','custom')),
    webhook_url TEXT,
    api_token TEXT,
    config_json TEXT,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- P3.4 migration: Company Voice DNA
  CREATE TABLE IF NOT EXISTS voice_docs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('pitch_deck','email','call_recording','brand_guide','competitor_battlecard','other')),
    content TEXT NOT NULL,
    tags TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- P3.5 migration: self-improving AI feedback
  CREATE TABLE IF NOT EXISTS prompt_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    script_id INTEGER,
    product_id INTEGER,
    method TEXT,
    call_type TEXT,
    variant TEXT NOT NULL DEFAULT 'default',
    prompt_used TEXT,
    outcome TEXT CHECK(outcome IN ('won','lost','no_deal','pending')),
    rating INTEGER CHECK(rating BETWEEN 1 AND 5),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- P3.6 migration: marketplace templates
  CREATE TABLE IF NOT EXISTS marketplace_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    method TEXT,
    call_type TEXT,
    duration INTEGER,
    description TEXT,
    opening TEXT,
    segments_json TEXT,
    objections_json TEXT,
    tags TEXT,
    author TEXT,
    downloads INTEGER DEFAULT 0,
    rating REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- P5.2 migration: script sharing
  CREATE TABLE IF NOT EXISTS script_shares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    script_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- P5.3 migration: scheduled calls
  CREATE TABLE IF NOT EXISTS scheduled_calls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER,
    script_id INTEGER,
    prospect_name TEXT,
    prospect_company TEXT,
    prospect_email TEXT,
    method TEXT,
    call_type TEXT,
    duration INTEGER,
    scheduled_at INTEGER NOT NULL,
    timezone TEXT DEFAULT 'UTC',
    notes TEXT,
    status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled','completed','cancelled','no_show')),
    briefing_json TEXT,
    reminder_sent INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- P5.4 migration: script comments (team collaboration)
  CREATE TABLE IF NOT EXISTS script_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    script_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'comment' CHECK(type IN ('comment','approval','revision')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- P6.1 migration: email notifications log
  CREATE TABLE IF NOT EXISTS email_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    template TEXT NOT NULL,
    to_email TEXT NOT NULL,
    subject TEXT,
    body TEXT,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'queued' CHECK(status IN ('queued','sent','failed'))
  );

  -- P6.1 migration: user notification preferences
  CREATE TABLE IF NOT EXISTS user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    email_weekly_digest INTEGER DEFAULT 1,
    email_call_reminders INTEGER DEFAULT 1,
    email_script_alerts INTEGER DEFAULT 1,
    theme TEXT DEFAULT 'light' CHECK(theme IN ('light','dark','system')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- P11.2: AI model accounts (multi-provider, multi-key)
  CREATE TABLE IF NOT EXISTS ai_model_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL DEFAULT 'Default',
    provider TEXT NOT NULL DEFAULT 'ollama' CHECK(provider IN ('ollama','openai','anthropic')),
    model TEXT,
    api_key TEXT,
    base_url TEXT,
    is_primary INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- P6.2 migration: webhook automation rules
  CREATE TABLE IF NOT EXISTS automation_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    trigger_event TEXT NOT NULL CHECK(trigger_event IN ('script.completed','script.used','call.scheduled','call.completed','feedback.created')),
    action_type TEXT NOT NULL CHECK(action_type IN ('webhook','email','slack')),
    target_url TEXT,
    payload_template TEXT,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- P11.3: email templates
  CREATE TABLE IF NOT EXISTS email_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    description TEXT,
    variables TEXT, -- JSON array
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- P7.1 migration: AI coaching insights
  CREATE TABLE IF NOT EXISTS coaching_insights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    script_id INTEGER,
    call_id INTEGER,
    type TEXT NOT NULL DEFAULT 'roleplay' CHECK(type IN ('roleplay','call','practice')),
    transcript TEXT,
    overall_score INTEGER CHECK(overall_score BETWEEN 1 AND 100),
    rapport_score INTEGER CHECK(rapport_score BETWEEN 1 AND 100),
    objection_score INTEGER CHECK(objection_score BETWEEN 1 AND 100),
    closing_score INTEGER CHECK(closing_score BETWEEN 1 AND 100),
    discovery_score INTEGER CHECK(discovery_score BETWEEN 1 AND 100),
    strengths TEXT,
    improvements TEXT,
    action_items TEXT,
    ai_summary TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- P7.2 migration: sentiment sessions
  CREATE TABLE IF NOT EXISTS sentiment_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    call_id INTEGER,
    type TEXT NOT NULL DEFAULT 'call' CHECK(type IN ('call','roleplay','practice')),
    overall_sentiment REAL DEFAULT 0 CHECK(overall_sentiment BETWEEN -1 AND 1),
    sentiment_history TEXT, -- JSON array of {time,sentiment,reason}
    detected_pivots TEXT, -- JSON array of suggested pivots
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- P7.3 migration: A/B script variants
  CREATE TABLE IF NOT EXISTS script_variants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    group_name TEXT NOT NULL,
    variant TEXT NOT NULL CHECK(variant IN ('A','B')),
    script_id INTEGER,
    product_id INTEGER NOT NULL,
    method TEXT NOT NULL,
    call_type TEXT NOT NULL,
    duration INTEGER NOT NULL,
    language TEXT NOT NULL,
    region TEXT NOT NULL,
    delivery TEXT NOT NULL,
    simple INTEGER NOT NULL DEFAULT 0,
    persona TEXT NOT NULL DEFAULT 'general',
    segments_json TEXT,
    active INTEGER DEFAULT 1,
    usage_count INTEGER DEFAULT 0,
    win_count INTEGER DEFAULT 0,
    loss_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, group_name, variant)
  );

  -- P7.4 migration: CRM OAuth tokens
  CREATE TABLE IF NOT EXISTS crm_oauth_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    crm_type TEXT NOT NULL CHECK(crm_type IN ('salesforce','hubspot')),
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    instance_url TEXT,
    expires_at INTEGER,
    config_json TEXT,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- P7.5 migration: rep performance snapshots
  CREATE TABLE IF NOT EXISTS rep_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    period TEXT NOT NULL, -- e.g. '2026-W30'
    scripts_generated INTEGER DEFAULT 0,
    scripts_used INTEGER DEFAULT 0,
    calls_scheduled INTEGER DEFAULT 0,
    calls_completed INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    avg_script_rating REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, period)
  );

  -- P8.1 migration: workspace permissions (RBAC)
  CREATE TABLE IF NOT EXISTS workspace_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workspace_id INTEGER NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('owner','admin','editor','viewer')),
    can_generate_scripts INTEGER DEFAULT 1,
    can_edit_products INTEGER DEFAULT 1,
    can_delete_scripts INTEGER DEFAULT 1,
    can_view_analytics INTEGER DEFAULT 1,
    can_manage_team INTEGER DEFAULT 0,
    can_override_prompts INTEGER DEFAULT 0,
    can_export_data INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(workspace_id, role)
  );

  -- P8.2 migration: audit logs
  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    workspace_id INTEGER,
    action TEXT NOT NULL, -- e.g. 'script.generated','product.updated','user.login'
    entity_type TEXT, -- e.g. 'script','product','user'
    entity_id INTEGER,
    details TEXT, -- JSON
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- P8.4 migration: custom AI prompt templates
  CREATE TABLE IF NOT EXISTS custom_prompts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    workspace_id INTEGER,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('system','opening','objection','discovery','closing','tone')),
    prompt TEXT NOT NULL,
    is_default INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- P8.5 migration: usage tracking
  CREATE TABLE IF NOT EXISTS usage_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action TEXT NOT NULL, -- e.g. 'script.generate','chat.message'
    tokens_used INTEGER DEFAULT 0,
    model TEXT,
    duration_ms INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- P9.1 migration: competitor monitoring
  CREATE TABLE IF NOT EXISTS competitor_intel (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    workspace_id INTEGER,
    competitor_name TEXT NOT NULL,
    source_url TEXT,
    raw_content TEXT,
    ai_summary TEXT,
    key_messages TEXT, -- JSON array
    threats TEXT, -- JSON array
    suggested_responses TEXT, -- JSON array
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- P9.1b: competitors entity table
  CREATE TABLE IF NOT EXISTS competitors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    workspace_id INTEGER,
    product_id INTEGER,
    name TEXT NOT NULL,
    category TEXT,
    website TEXT,
    threat_level TEXT DEFAULT 'low' CHECK(threat_level IN ('low','medium','high')),
    status TEXT DEFAULT 'active' CHECK(status IN ('active','archived','monitoring')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- P9.1c: competitor sources
  CREATE TABLE IF NOT EXISTS competitor_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    competitor_id INTEGER NOT NULL,
    source_type TEXT NOT NULL DEFAULT 'manual' CHECK(source_type IN ('website','pricing','product','blog','changelog','news','social','upload','manual')),
    source_url TEXT,
    label TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- P9.2 migration: predictive deal scores
  CREATE TABLE IF NOT EXISTS deal_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    script_id INTEGER,
    call_id INTEGER,
    transcript TEXT,
    close_probability REAL DEFAULT 0 CHECK(close_probability BETWEEN 0 AND 1),
    tone_score INTEGER DEFAULT 0 CHECK(tone_score BETWEEN 1 AND 100),
    objection_pattern TEXT,
    win_pattern_match REAL DEFAULT 0,
    risk_factors TEXT, -- JSON array
    recommendations TEXT, -- JSON array
    ai_summary TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- P9.3 migration: organizations
  CREATE TABLE IF NOT EXISTS organizations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    owner_user_id INTEGER NOT NULL,
    billing_tier TEXT DEFAULT 'free' CHECK(billing_tier IN ('free','starter','pro','enterprise')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- P9.4 migration: script refinements
  CREATE TABLE IF NOT EXISTS script_refinements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    script_id INTEGER NOT NULL,
    original_segments_json TEXT,
    refined_segments_json TEXT,
    changes_made TEXT, -- JSON array of what changed
    improvement_score INTEGER CHECK(improvement_score BETWEEN 1 AND 100),
    ai_explanation TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- P9.5 migration: voice recordings (TTS)
  CREATE TABLE IF NOT EXISTS voice_recordings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    script_id INTEGER,
    segment_index INTEGER DEFAULT -1, -- -1 means full script
    text_content TEXT NOT NULL,
    voice_id TEXT DEFAULT 'default',
    audio_url TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','processing','completed','failed')),
    duration_seconds INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- P10.1 migration: auto-script optimization suggestions
  CREATE TABLE IF NOT EXISTS auto_optimizations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    workspace_id INTEGER,
    script_id INTEGER,
    week_period TEXT NOT NULL, -- e.g. '2026-W30'
    win_count INTEGER DEFAULT 0,
    loss_count INTEGER DEFAULT 0,
    suggestion TEXT NOT NULL,
    suggested_segments_json TEXT,
    confidence_score REAL DEFAULT 0 CHECK(confidence_score BETWEEN 0 AND 1),
    applied INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- P10.2 migration: conversation intelligence heatmaps
  CREATE TABLE IF NOT EXISTS conversation_heatmaps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    workspace_id INTEGER,
    phrase TEXT NOT NULL,
    category TEXT DEFAULT 'general' CHECK(category IN ('opening','value_prop','objection','closing','discovery','rapport')),
    win_correlation REAL DEFAULT 0,
    loss_correlation REAL DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    avg_close_probability REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- P10.3 migration: AI sales assistant chat
  CREATE TABLE IF NOT EXISTS chat_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user','assistant','system')),
    content TEXT NOT NULL,
    model_used TEXT,
    tokens_used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- P10.4 migration: smart alerts
  CREATE TABLE IF NOT EXISTS smart_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    workspace_id INTEGER,
    alert_type TEXT NOT NULL CHECK(alert_type IN ('performance_drop','win_rate_change','usage_spike','pattern_detected','coaching_needed')),
    severity TEXT NOT NULL CHECK(severity IN ('info','warning','critical')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_plan TEXT,
    metric_value REAL,
    metric_previous REAL,
    dismissed INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- P10.5 migration: model routing logs
  CREATE TABLE IF NOT EXISTS model_routing_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    task_type TEXT NOT NULL CHECK(task_type IN ('script_generation','coaching','sentiment','deal_scoring','chat','refinement','competitor_intel')),
    model_used TEXT NOT NULL,
    fallback_from TEXT,
    duration_ms INTEGER DEFAULT 0,
    success INTEGER DEFAULT 1,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`)

/* ---------- migrations (ALTER TABLE ADD COLUMN IF NOT EXISTS not supported) ---------- */
function addColumnIfNotExists(table, column, def) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all()
  if (!cols.find((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`)
  }
}

addColumnIfNotExists('scripts', 'outcome', "TEXT CHECK(outcome IN ('won','lost','no_deal','pending'))")
addColumnIfNotExists('scripts', 'notes', 'TEXT')
addColumnIfNotExists('scripts', 'used_at', 'INTEGER')
addColumnIfNotExists('products', 'workspace_id', 'INTEGER')
addColumnIfNotExists('products', 'visibility', "TEXT DEFAULT 'private' CHECK(visibility IN ('private','workspace'))")
addColumnIfNotExists('scripts', 'workspace_id', 'INTEGER')
addColumnIfNotExists('scripts', 'visibility', "TEXT DEFAULT 'private' CHECK(visibility IN ('private','workspace'))")
addColumnIfNotExists('coaching_insights', 'raw_data', 'TEXT')
addColumnIfNotExists('competitor_intel', 'threat_level', "TEXT DEFAULT 'low' CHECK(threat_level IN ('low','medium','high'))")
addColumnIfNotExists('competitor_intel', 'product_id', 'INTEGER')
addColumnIfNotExists('competitor_intel', 'raw_data', 'TEXT')
addColumnIfNotExists('competitor_intel', 'competitor_id', 'INTEGER')

// P10.2b: conversation intelligence enhancements
addColumnIfNotExists('conversation_heatmaps', 'evidence_json', 'TEXT')
addColumnIfNotExists('conversation_heatmaps', 'source', "TEXT DEFAULT 'manual' CHECK(source IN ('manual','script_analysis','practice_analysis'))")
addColumnIfNotExists('conversation_heatmaps', 'product_id', 'INTEGER')
addColumnIfNotExists('conversation_heatmaps', 'win_count', 'INTEGER DEFAULT 0')
addColumnIfNotExists('conversation_heatmaps', 'loss_count', 'INTEGER DEFAULT 0')

// P9.2b: deal scoring dimensions
addColumnIfNotExists('deal_scores', 'need_score', 'INTEGER DEFAULT 0')
addColumnIfNotExists('deal_scores', 'authority_score', 'INTEGER DEFAULT 0')
addColumnIfNotExists('deal_scores', 'budget_score', 'INTEGER DEFAULT 0')
addColumnIfNotExists('deal_scores', 'timeline_score', 'INTEGER DEFAULT 0')
addColumnIfNotExists('deal_scores', 'confidence', "TEXT DEFAULT 'medium' CHECK(confidence IN ('low','medium','high'))")
addColumnIfNotExists('deal_scores', 'next_action', 'TEXT')

// P9.4b: refinement dimensions + version history
addColumnIfNotExists('script_refinements', 'dimension_scores_json', 'TEXT')
addColumnIfNotExists('script_refinements', 'previous_score', 'INTEGER')
addColumnIfNotExists('script_refinements', 'goal', 'TEXT')
addColumnIfNotExists('script_refinements', 'focus_areas_json', 'TEXT')
addColumnIfNotExists('script_refinements', 'version_number', 'INTEGER DEFAULT 1')
addColumnIfNotExists('script_refinements', 'product_name', 'TEXT')
addColumnIfNotExists('script_refinements', 'method', 'TEXT')
addColumnIfNotExists('script_refinements', 'call_type', 'TEXT')
addColumnIfNotExists('script_refinements', 'language', 'TEXT')

// P11.1: AI provider preferences
addColumnIfNotExists('user_preferences', 'ai_provider', "TEXT DEFAULT 'ollama' CHECK(ai_provider IN ('ollama','openai','anthropic'))")
addColumnIfNotExists('user_preferences', 'ai_model', 'TEXT')
addColumnIfNotExists('user_preferences', 'ai_api_key', 'TEXT')
addColumnIfNotExists('user_preferences', 'ai_base_url', 'TEXT')

// P11.3: SMTP configuration
addColumnIfNotExists('user_preferences', 'smtp_host', 'TEXT')
addColumnIfNotExists('user_preferences', 'smtp_port', 'INTEGER')
addColumnIfNotExists('user_preferences', 'smtp_user', 'TEXT')
addColumnIfNotExists('user_preferences', 'smtp_pass', 'TEXT')
addColumnIfNotExists('user_preferences', 'smtp_from', 'TEXT')
addColumnIfNotExists('user_preferences', 'smtp_secure', 'INTEGER DEFAULT 0')

// P12.1: auto-optimization enhancements (impact scores, evidence, versioning)
addColumnIfNotExists('auto_optimizations', 'impact_level', "TEXT DEFAULT 'medium' CHECK(impact_level IN ('high','medium','low'))")
addColumnIfNotExists('auto_optimizations', 'current_text', 'TEXT')
addColumnIfNotExists('auto_optimizations', 'recommended_text', 'TEXT')
addColumnIfNotExists('auto_optimizations', 'why', 'TEXT')
addColumnIfNotExists('auto_optimizations', 'evidence_json', 'TEXT')
addColumnIfNotExists('auto_optimizations', 'script_version', 'TEXT')
addColumnIfNotExists('auto_optimizations', 'approved_by', 'TEXT')
addColumnIfNotExists('auto_optimizations', 'measured_uplift', 'TEXT')

/* -- workspace data migration (run after columns exist) -- */
// create personal workspaces for users without one
db.prepare(`
  INSERT INTO workspaces (name, owner_user_id)
  SELECT COALESCE(company_name, 'My workspace'), id FROM users
  WHERE id NOT IN (SELECT owner_user_id FROM workspaces)
`).run()

// migrate products to owner's workspace
db.prepare(`
  UPDATE products SET workspace_id = (
    SELECT w.id FROM workspaces w WHERE w.owner_user_id = products.user_id LIMIT 1
  ) WHERE workspace_id IS NULL
`).run()

// migrate scripts to owner's workspace
db.prepare(`
  UPDATE scripts SET workspace_id = (
    SELECT w.id FROM workspaces w WHERE w.owner_user_id = scripts.user_id LIMIT 1
  ) WHERE workspace_id IS NULL
`).run()

// add owner as workspace member
db.prepare(`
  INSERT OR IGNORE INTO workspace_members (workspace_id, user_id, role, joined_at)
  SELECT w.id, w.owner_user_id, 'owner', CURRENT_TIMESTAMP FROM workspaces w
`).run()

/* ---------- helpers ---------- */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.replace(/^Bearer\s+/i, '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.userId = decoded.userId
    req.userEmail = decoded.email
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

/* ---------- public API key auth ---------- */
function requireApiKey(req, res, next) {
  const header = req.headers.authorization || ''
  const key = header.replace(/^ApiKey\s+/i, '').replace(/^Bearer\s+/i, '')
  if (!key) return res.status(401).json({ error: 'API key required' })

  const hashed = require('crypto').createHash('sha256').update(key).digest('hex')
  const record = db.prepare('SELECT * FROM api_keys WHERE key_hash = ? AND active = 1').get(hashed)
  if (!record) return res.status(401).json({ error: 'Invalid API key' })

  db.prepare('UPDATE api_keys SET last_used_at = ? WHERE id = ?').run(Date.now(), record.id)
  req.userId = record.user_id
  req.apiKeyScopes = (record.scopes || '').split(',').map(s => s.trim())
  next()
}

function hasScope(req, scope) {
  return req.apiKeyScopes?.includes(scope)
}

/* ---------- P8.1: RBAC helpers ---------- */
function getUserWorkspaceRole(userId) {
  const row = db.prepare(`
    SELECT m.role, w.id as workspace_id FROM workspace_members m
    JOIN workspaces w ON w.id = m.workspace_id
    WHERE m.user_id = ? AND m.joined_at IS NOT NULL
    LIMIT 1
  `).get(userId)
  return row || { role: 'viewer', workspace_id: null }
}

function getWorkspacePermissions(workspaceId, role) {
  const row = db.prepare(`
    SELECT * FROM workspace_permissions WHERE workspace_id = ? AND role = ?
  `).get(workspaceId, role)
  if (row) return row
  // default permissions per role
  const defaults = {
    owner: { can_generate_scripts: 1, can_edit_products: 1, can_delete_scripts: 1, can_view_analytics: 1, can_manage_team: 1, can_override_prompts: 1, can_export_data: 1 },
    admin: { can_generate_scripts: 1, can_edit_products: 1, can_delete_scripts: 1, can_view_analytics: 1, can_manage_team: 1, can_override_prompts: 1, can_export_data: 1 },
    editor: { can_generate_scripts: 1, can_edit_products: 1, can_delete_scripts: 1, can_view_analytics: 1, can_manage_team: 0, can_override_prompts: 0, can_export_data: 0 },
    viewer: { can_generate_scripts: 0, can_edit_products: 0, can_delete_scripts: 0, can_view_analytics: 1, can_manage_team: 0, can_override_prompts: 0, can_export_data: 0 },
  }
  return { role, ...defaults[role] }
}

function requirePermission(permission) {
  return (req, res, next) => {
    const { role, workspace_id } = getUserWorkspaceRole(req.userId)
    const perms = getWorkspacePermissions(workspace_id, role)
    if (!perms[permission]) return res.status(403).json({ error: 'Insufficient permissions' })
    req.userRole = role
    req.workspaceId = workspace_id
    next()
  }
}

/* ---------- P8.2: audit logging ---------- */
function auditLog(userId, action, entityType, entityId, details = {}) {
  try {
    const { workspaceId } = getUserWorkspaceRole(userId)
    db.prepare(`
      INSERT INTO audit_logs (user_id, workspace_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, workspaceId || null, action, entityType || null, entityId || null, JSON.stringify(details))
  } catch (e) {
    console.error('[auditLog] error:', e.message)
  }
}

/* ---------- P8.5: usage tracking ---------- */
function trackUsage(userId, action, opts = {}) {
  try {
    db.prepare(`
      INSERT INTO usage_logs (user_id, action, tokens_used, model, duration_ms)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, action, opts.tokens_used || 0, opts.model || null, opts.duration_ms || 0)
  } catch (e) {
    console.error('[trackUsage] error:', e.message)
  }
}

/* ---------- webhook dispatcher ---------- */
async function dispatchWebhook(userId, event, payload) {
  const hooks = db.prepare(
    'SELECT * FROM webhooks WHERE user_id = ? AND active = 1'
  ).all(userId)

  for (const hook of hooks) {
    const events = (hook.events || '').split(',').map(e => e.trim())
    if (!events.includes(event)) continue

    const body = JSON.stringify({ event, timestamp: Date.now(), data: payload })
    const headers = { 'Content-Type': 'application/json' }
    if (hook.secret) {
      const sig = require('crypto').createHmac('sha256', hook.secret).update(body).digest('hex')
      headers['X-Webhook-Signature'] = `sha256=${sig}`
    }

    let status = 0
    let responseBody = ''
    let succeeded = 0
    try {
      const res = await fetch(hook.url, { method: 'POST', headers, body })
      status = res.status
      responseBody = await res.text().catch(() => '')
      succeeded = res.ok ? 1 : 0
    } catch (err) {
      responseBody = err.message
    }

    db.prepare(
      'INSERT INTO webhook_deliveries (webhook_id, event, payload, status, response_body, attempted_at, succeeded) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(hook.id, event, body, status, responseBody, Date.now(), succeeded)
  }
}

/* ---------- auth routes ---------- */
app.post('/api/auth/register', (req, res) => {
  const { email, password, company_name } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing) return res.status(409).json({ error: 'Email already registered' })

  const password_hash = bcrypt.hashSync(password, 10)
  const userResult = db.prepare(
    'INSERT INTO users (email, password_hash, company_name) VALUES (?, ?, ?)'
  ).run(email, password_hash, company_name || '')

  const userId = userResult.lastInsertRowid

  // create personal workspace
  const wsResult = db.prepare('INSERT INTO workspaces (name, owner_user_id) VALUES (?, ?)').run(company_name || 'My workspace', userId)
  db.prepare('INSERT INTO workspace_members (workspace_id, user_id, role, joined_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)').run(wsResult.lastInsertRowid, userId, 'owner')

  const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ token, user: { id: userId, email, company_name: company_name || '' } })
})

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
  if (!user) return res.status(401).json({ error: 'Invalid credentials' })

  const valid = bcrypt.compareSync(password, user.password_hash)
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' })
  res.json({
    token,
    user: { id: user.id, email: user.email, company_name: user.company_name || '' }
  })
})

app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, email, company_name FROM users WHERE id = ?').get(req.userId)
  if (!user) return res.status(404).json({ error: 'User not found' })

  const workspace = db.prepare(
    `SELECT w.id, w.name, w.owner_user_id, m.role
     FROM workspaces w
     JOIN workspace_members m ON m.workspace_id = w.id
     WHERE m.user_id = ? AND m.joined_at IS NOT NULL
     LIMIT 1`
  ).get(req.userId)

  const members = workspace ? db.prepare(
    `SELECT u.email, m.role FROM workspace_members m
     JOIN users u ON u.id = m.user_id
     WHERE m.workspace_id = ? AND m.joined_at IS NOT NULL`
  ).all(workspace.id) : []

  res.json({ user, workspace: workspace ? { ...workspace, members } : null })
})

/* ---------- settings ---------- */
app.get('/api/settings', requireAuth, (req, res) => {
  const user = db.prepare('SELECT company_name FROM users WHERE id = ?').get(req.userId)
  res.json({ company_name: user?.company_name || '' })
})

app.put('/api/settings', requireAuth, (req, res) => {
  const { company_name } = req.body
  db.prepare('UPDATE users SET company_name = ? WHERE id = ?').run(company_name || '', req.userId)
  res.json({ success: true, company_name })
})

/* ---------- workspaces ---------- */
app.get('/api/workspace', requireAuth, (req, res) => {
  const ws = db.prepare(
    `SELECT w.id, w.name, w.owner_user_id, m.role
     FROM workspaces w
     JOIN workspace_members m ON m.workspace_id = w.id
     WHERE m.user_id = ? AND m.joined_at IS NOT NULL
     LIMIT 1`
  ).get(req.userId)
  if (!ws) return res.status(404).json({ error: 'No workspace found' })

  const members = db.prepare(
    `SELECT u.id, u.email, m.role FROM workspace_members m
     JOIN users u ON u.id = m.user_id
     WHERE m.workspace_id = ? AND m.joined_at IS NOT NULL`
  ).all(ws.id)

  const pending = db.prepare(
    `SELECT invited_email, role, created_at FROM workspace_members
     WHERE workspace_id = ? AND joined_at IS NULL`
  ).all(ws.id)

  res.json({ workspace: { ...ws, members, pending } })
})

app.put('/api/workspace', requireAuth, (req, res) => {
  const { name } = req.body
  if (!name) return res.status(400).json({ error: 'Name required' })

  const ws = db.prepare(
    `SELECT w.id FROM workspaces w
     JOIN workspace_members m ON m.workspace_id = w.id
     WHERE m.user_id = ? AND m.role IN ('owner','admin') AND m.joined_at IS NOT NULL
     LIMIT 1`
  ).get(req.userId)
  if (!ws) return res.status(403).json({ error: 'Not allowed' })

  db.prepare('UPDATE workspaces SET name = ? WHERE id = ?').run(name, ws.id)
  res.json({ success: true, name })
})

app.post('/api/workspace/invite', requireAuth, (req, res) => {
  const { email, role = 'member' } = req.body
  if (!email) return res.status(400).json({ error: 'Email required' })

  const ws = db.prepare(
    `SELECT w.id FROM workspaces w
     JOIN workspace_members m ON m.workspace_id = w.id
     WHERE m.user_id = ? AND m.role IN ('owner','admin') AND m.joined_at IS NOT NULL
     LIMIT 1`
  ).get(req.userId)
  if (!ws) return res.status(403).json({ error: 'Not allowed' })

  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  const token = Math.random().toString(36).slice(2) + Date.now().toString(36)

  db.prepare(
    'INSERT INTO workspace_members (workspace_id, user_id, role, invited_email, invite_token) VALUES (?, ?, ?, ?, ?)'
  ).run(ws.id, existingUser?.id || null, role, email, token)

  res.json({ success: true, invite_token: token, message: `Invite sent to ${email}` })
})

app.post('/api/workspace/join', requireAuth, (req, res) => {
  const { token } = req.body
  if (!token) return res.status(400).json({ error: 'Token required' })

  const invite = db.prepare(
    'SELECT * FROM workspace_members WHERE invite_token = ? AND joined_at IS NULL'
  ).get(token)
  if (!invite) return res.status(404).json({ error: 'Invalid or expired invite' })

  db.prepare(
    'UPDATE workspace_members SET user_id = ?, joined_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(req.userId, invite.id)

  res.json({ success: true })
})

/* ---------- products ---------- */
app.get('/api/products', requireAuth, (req, res) => {
  const userWs = db.prepare(
    `SELECT w.id FROM workspaces w JOIN workspace_members m ON m.workspace_id = w.id WHERE m.user_id = ? AND m.joined_at IS NOT NULL LIMIT 1`
  ).get(req.userId)
  const wsId = userWs?.id

  const rows = db.prepare(
    `SELECT * FROM products
     WHERE user_id = ?
        OR (workspace_id = ? AND visibility = 'workspace')
     ORDER BY created_at DESC`
  ).all(req.userId, wsId || 0)
  res.json({ products: rows })
})

app.post('/api/products', requireAuth, (req, res) => {
  const { name, category, one_liner, description, ideal_customer, pain_points, differentiators, price_model, proof_points, competitors, visibility = 'private' } = req.body
  const userWs = db.prepare(
    `SELECT w.id FROM workspaces w JOIN workspace_members m ON m.workspace_id = w.id WHERE m.user_id = ? AND m.joined_at IS NOT NULL LIMIT 1`
  ).get(req.userId)
  const wsId = userWs?.id

  const result = db.prepare(
    `INSERT INTO products (user_id, workspace_id, visibility, name, category, one_liner, description, ideal_customer, pain_points, differentiators, price_model, proof_points, competitors)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(req.userId, wsId || null, visibility, name || '', category || '', one_liner || '', description || '', ideal_customer || '', pain_points || '', differentiators || '', price_model || '', proof_points || '', competitors || '')
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid)
  res.json({ product: row })
})

app.put('/api/products/:id', requireAuth, (req, res) => {
  const { id } = req.params
  const { name, category, one_liner, description, ideal_customer, pain_points, differentiators, price_model, proof_points, competitors, visibility } = req.body

  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id)
  if (!existing) return res.status(404).json({ error: 'Not found' })

  const canEdit = existing.user_id === req.userId || (
    existing.visibility === 'workspace' && db.prepare(
      `SELECT 1 FROM workspace_members m JOIN workspaces w ON w.id = m.workspace_id
       WHERE m.workspace_id = ? AND m.user_id = ? AND m.role IN ('owner','admin') AND m.joined_at IS NOT NULL`
    ).get(existing.workspace_id, req.userId)
  )
  if (!canEdit) return res.status(403).json({ error: 'Not allowed' })

  const fields = []
  const values = []
  if (name !== undefined) { fields.push('name = ?'); values.push(name) }
  if (category !== undefined) { fields.push('category = ?'); values.push(category) }
  if (one_liner !== undefined) { fields.push('one_liner = ?'); values.push(one_liner) }
  if (description !== undefined) { fields.push('description = ?'); values.push(description) }
  if (ideal_customer !== undefined) { fields.push('ideal_customer = ?'); values.push(ideal_customer) }
  if (pain_points !== undefined) { fields.push('pain_points = ?'); values.push(pain_points) }
  if (differentiators !== undefined) { fields.push('differentiators = ?'); values.push(differentiators) }
  if (price_model !== undefined) { fields.push('price_model = ?'); values.push(price_model) }
  if (proof_points !== undefined) { fields.push('proof_points = ?'); values.push(proof_points) }
  if (competitors !== undefined) { fields.push('competitors = ?'); values.push(competitors) }
  if (visibility !== undefined) { fields.push('visibility = ?'); values.push(visibility) }
  if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' })
  values.push(id)

  db.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`).run(...values)
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id)
  res.json({ product: row })
})

app.delete('/api/products/:id', requireAuth, (req, res) => {
  const { id } = req.params
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id)
  if (!existing) return res.status(404).json({ error: 'Not found' })

  const canDelete = existing.user_id === req.userId || (
    existing.visibility === 'workspace' && db.prepare(
      `SELECT 1 FROM workspace_members m JOIN workspaces w ON w.id = m.workspace_id
       WHERE m.workspace_id = ? AND m.user_id = ? AND m.role IN ('owner','admin') AND m.joined_at IS NOT NULL`
    ).get(existing.workspace_id, req.userId)
  )
  if (!canDelete) return res.status(403).json({ error: 'Not allowed' })

  db.prepare('DELETE FROM products WHERE id = ?').run(id)
  db.prepare('DELETE FROM scripts WHERE product_id = ?').run(id)
  res.json({ success: true })
})

/* ---------- staff ---------- */
app.get('/api/staff', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM staff WHERE user_id = ? ORDER BY created_at DESC').all(req.userId)
  res.json({ staff: rows.map((s) => ({ ...s, languages: JSON.parse(s.languages || '[]') })) })
})

app.post('/api/staff', requireAuth, (req, res) => {
  const { name, role, languages } = req.body
  const result = db.prepare(
    'INSERT INTO staff (user_id, name, role, languages) VALUES (?, ?, ?, ?)'
  ).run(req.userId, name || '', role || '', JSON.stringify(languages || []))
  const row = db.prepare('SELECT * FROM staff WHERE id = ?').get(result.lastInsertRowid)
  res.json({ staff: { ...row, languages: JSON.parse(row.languages || '[]') } })
})

app.delete('/api/staff/:id', requireAuth, (req, res) => {
  const { id } = req.params
  const existing = db.prepare('SELECT id FROM staff WHERE id = ? AND user_id = ?').get(id, req.userId)
  if (!existing) return res.status(404).json({ error: 'Not found' })
  db.prepare('DELETE FROM staff WHERE id = ?').run(id)
  res.json({ success: true })
})

/* ---------- scripts ---------- */
app.get('/api/scripts', requireAuth, (req, res) => {
  const userWs = db.prepare(
    `SELECT w.id FROM workspaces w JOIN workspace_members m ON m.workspace_id = w.id WHERE m.user_id = ? AND m.joined_at IS NOT NULL LIMIT 1`
  ).get(req.userId)
  const wsId = userWs?.id

  const rows = db.prepare(
    `SELECT * FROM scripts
     WHERE user_id = ?
        OR (workspace_id = ? AND visibility = 'workspace')
     ORDER BY saved_at DESC`
  ).all(req.userId, wsId || 0)
  res.json({
    scripts: rows.map((r) => ({
      ...r,
      outcome: r.outcome || 'pending',
      notes: r.notes || '',
      used_at: r.used_at || null,
      data: {
        opening: r.opening,
        toneLevel: r.tone_level,
        toneGuidance: r.tone_guidance,
        segments: JSON.parse(r.segments_json || '[]'),
        objections: JSON.parse(r.objections_json || '[]'),
      },
      meta: {
        productId: r.product_id,
        method: r.method,
        callType: r.call_type,
        duration: r.duration,
        language: r.language,
        region: r.region,
        delivery: r.delivery,
        simple: !!r.simple,
        persona: r.persona,
      },
    }))
  })
})

app.post('/api/scripts', requireAuth, (req, res) => {
  const { product_id, method, call_type, duration, language, region, delivery, simple, persona, opening, tone_level, tone_guidance, segments, objections, saved_at, visibility = 'private' } = req.body

  const userWs = db.prepare(
    `SELECT w.id FROM workspaces w JOIN workspace_members m ON m.workspace_id = w.id WHERE m.user_id = ? AND m.joined_at IS NOT NULL LIMIT 1`
  ).get(req.userId)
  const wsId = userWs?.id

  const segJson = JSON.stringify(segments || [])
  const objJson = JSON.stringify(objections || [])

  const result = db.prepare(
    `INSERT INTO scripts (user_id, workspace_id, visibility, product_id, method, call_type, duration, language, region, delivery, simple, persona, opening, tone_level, tone_guidance, segments_json, objections_json, saved_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, product_id, method, call_type, duration, language, region, delivery, simple, persona)
     DO UPDATE SET opening=excluded.opening, tone_level=excluded.tone_level, tone_guidance=excluded.tone_guidance, segments_json=excluded.segments_json, objections_json=excluded.objections_json, saved_at=excluded.saved_at`
  ).run(req.userId, wsId || null, visibility, product_id, method, call_type, duration, language, region, delivery, simple ? 1 : 0, persona || 'general', opening || '', tone_level || '', tone_guidance || '', segJson, objJson, saved_at || Date.now())

  const rowId = result.lastInsertRowid || db.prepare(
    `SELECT id FROM scripts WHERE user_id=? AND product_id=? AND method=? AND call_type=? AND duration=? AND language=? AND region=? AND delivery=? AND simple=? AND persona=?`
  ).get(req.userId, product_id, method, call_type, duration, language, region, delivery, simple ? 1 : 0, persona || 'general').id

  const row = db.prepare('SELECT * FROM scripts WHERE id = ?').get(rowId)
  res.json({
    script: {
      ...row,
      data: {
        opening: row.opening,
        toneLevel: row.tone_level,
        toneGuidance: row.tone_guidance,
        segments: JSON.parse(row.segments_json || '[]'),
        objections: JSON.parse(row.objections_json || '[]'),
      },
      meta: {
        productId: row.product_id,
        method: row.method,
        callType: row.call_type,
        duration: row.duration,
        language: row.language,
        region: row.region,
        delivery: row.delivery,
        simple: !!row.simple,
        persona: row.persona,
      },
    }
  })
})

app.put('/api/scripts/:id', requireAuth, (req, res) => {
  const { id } = req.params
  const { outcome, notes, used_at } = req.body
  const existing = db.prepare('SELECT * FROM scripts WHERE id = ?').get(id)
  if (!existing) return res.status(404).json({ error: 'Not found' })

  const canEdit = existing.user_id === req.userId || (
    existing.visibility === 'workspace' && db.prepare(
      `SELECT 1 FROM workspace_members m JOIN workspaces w ON w.id = m.workspace_id
       WHERE m.workspace_id = ? AND m.user_id = ? AND m.role IN ('owner','admin') AND m.joined_at IS NOT NULL`
    ).get(existing.workspace_id, req.userId)
  )
  if (!canEdit) return res.status(403).json({ error: 'Not allowed' })

  const updates = []
  const values = []
  if (outcome !== undefined) { updates.push('outcome = ?'); values.push(outcome) }
  if (notes !== undefined) { updates.push('notes = ?'); values.push(notes) }
  if (used_at !== undefined) { updates.push('used_at = ?'); values.push(used_at) }
  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' })

  values.push(id)
  db.prepare(`UPDATE scripts SET ${updates.join(', ')} WHERE id = ?`).run(...values)

  // P3.1: dispatch to CRM when script is marked as used
  if (used_at !== undefined) {
    dispatchCrm(req.userId, 'script.used', {
      script_id: id,
      product_id: existing.product_id,
      method: existing.method,
      call_type: existing.call_type,
      duration: existing.duration,
      language: existing.language,
      used_at,
    })
  }

  const row = db.prepare('SELECT * FROM scripts WHERE id = ?').get(id)
  res.json({
    script: {
      ...row,
      outcome: row.outcome || 'pending',
      notes: row.notes || '',
      used_at: row.used_at || null,
      data: {
        opening: row.opening,
        toneLevel: row.tone_level,
        toneGuidance: row.tone_guidance,
        segments: JSON.parse(row.segments_json || '[]'),
        objections: JSON.parse(row.objections_json || '[]'),
      },
      meta: {
        productId: row.product_id,
        method: row.method,
        callType: row.call_type,
        duration: row.duration,
        language: row.language,
        region: row.region,
        delivery: row.delivery,
        simple: !!row.simple,
        persona: row.persona,
      },
    }
  })
})

app.delete('/api/scripts/:id', requireAuth, (req, res) => {
  const { id } = req.params
  const existing = db.prepare('SELECT id FROM scripts WHERE id = ? AND user_id = ?').get(id, req.userId)
  if (!existing) return res.status(404).json({ error: 'Not found' })
  db.prepare('DELETE FROM scripts WHERE id = ?').run(id)
  res.json({ success: true })
})

/* ---------- components (JWT protected) ---------- */
app.get('/api/components', requireAuth, (req, res) => {
  const { type } = req.query
  let sql = 'SELECT * FROM components WHERE user_id = ?'
  const params = [req.userId]
  if (type) { sql += ' AND type = ?'; params.push(type) }
  sql += ' ORDER BY created_at DESC'
  const rows = db.prepare(sql).all(...params)
  res.json({ components: rows })
})

app.post('/api/components', requireAuth, (req, res) => {
  const { name, type, content, tags, method, product_id } = req.body
  if (!name || !type || !content) return res.status(400).json({ error: 'name, type, content required' })
  const result = db.prepare(
    'INSERT INTO components (user_id, name, type, content, tags, method, product_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(req.userId, name, type, content, tags || '', method || '', product_id || null)
  const row = db.prepare('SELECT * FROM components WHERE id = ?').get(result.lastInsertRowid)
  res.json({ component: row })
})

app.put('/api/components/:id', requireAuth, (req, res) => {
  const { id } = req.params
  const { name, type, content, tags, method, product_id } = req.body
  const existing = db.prepare('SELECT id FROM components WHERE id = ? AND user_id = ?').get(id, req.userId)
  if (!existing) return res.status(404).json({ error: 'Not found' })
  db.prepare('UPDATE components SET name = ?, type = ?, content = ?, tags = ?, method = ?, product_id = ? WHERE id = ?')
    .run(name, type, content, tags || '', method || '', product_id || null, id)
  const row = db.prepare('SELECT * FROM components WHERE id = ?').get(id)
  res.json({ component: row })
})

app.delete('/api/components/:id', requireAuth, (req, res) => {
  const { id } = req.params
  const existing = db.prepare('SELECT id FROM components WHERE id = ? AND user_id = ?').get(id, req.userId)
  if (!existing) return res.status(404).json({ error: 'Not found' })
  db.prepare('DELETE FROM components WHERE id = ?').run(id)
  res.json({ success: true })
})

/* ---------- voice docs (JWT protected) ---------- */
app.get('/api/voice-docs', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT id, name, type, tags, created_at FROM voice_docs WHERE user_id = ? ORDER BY created_at DESC').all(req.userId)
  res.json({ docs: rows })
})

app.get('/api/voice-docs/content', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT content FROM voice_docs WHERE user_id = ?').all(req.userId)
  const combined = rows.map((r) => r.content).join('\n\n---\n\n')
  res.json({ voiceContext: combined })
})

app.post('/api/voice-docs', requireAuth, (req, res) => {
  const { name, type, content, tags } = req.body
  if (!name || !type || !content) return res.status(400).json({ error: 'name, type, content required' })
  const result = db.prepare(
    'INSERT INTO voice_docs (user_id, name, type, content, tags) VALUES (?, ?, ?, ?, ?)'
  ).run(req.userId, name, type, content, tags || '')
  const row = db.prepare('SELECT id, name, type, tags, created_at FROM voice_docs WHERE id = ?').get(result.lastInsertRowid)
  res.json({ doc: row })
})

app.delete('/api/voice-docs/:id', requireAuth, (req, res) => {
  const { id } = req.params
  const existing = db.prepare('SELECT id FROM voice_docs WHERE id = ? AND user_id = ?').get(id, req.userId)
  if (!existing) return res.status(404).json({ error: 'Not found' })
  db.prepare('DELETE FROM voice_docs WHERE id = ?').run(id)
  res.json({ success: true })
})

/* ---------- prompt feedback (JWT protected) ---------- */
app.get('/api/feedback', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT pf.*, s.opening, s.product_id
    FROM prompt_feedback pf
    LEFT JOIN scripts s ON s.id = pf.script_id
    WHERE pf.user_id = ?
    ORDER BY pf.created_at DESC
  `).all(req.userId)
  res.json({ feedback: rows })
})

app.post('/api/feedback', requireAuth, (req, res) => {
  const { script_id, product_id, method, call_type, variant, prompt_used, outcome, rating, notes } = req.body
  const result = db.prepare(
    'INSERT INTO prompt_feedback (user_id, script_id, product_id, method, call_type, variant, prompt_used, outcome, rating, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(req.userId, script_id || null, product_id || null, method || '', call_type || '', variant || 'default', prompt_used || '', outcome || null, rating || null, notes || '')
  const row = db.prepare('SELECT * FROM prompt_feedback WHERE id = ?').get(result.lastInsertRowid)
  res.json({ feedback: row })
})

app.get('/api/feedback/winning-patterns', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT method, call_type, variant, COUNT(*) as count,
      SUM(CASE WHEN outcome = 'won' THEN 1 ELSE 0 END) as wins,
      AVG(rating) as avg_rating
    FROM prompt_feedback
    WHERE user_id = ? AND outcome IS NOT NULL
    GROUP BY method, call_type, variant
    ORDER BY wins DESC, avg_rating DESC
  `).all(req.userId)
  res.json({ patterns: rows })
})

/* ---------- marketplace templates (JWT protected) ---------- */
app.get('/api/marketplace', requireAuth, (req, res) => {
  const { category } = req.query
  let sql = 'SELECT id, title, category, method, call_type, duration, description, tags, author, downloads, rating, created_at FROM marketplace_templates'
  if (category) sql += ' WHERE category = ?'
  sql += ' ORDER BY downloads DESC'
  const rows = category ? db.prepare(sql).all(category) : db.prepare(sql).all()
  res.json({ templates: rows })
})

app.get('/api/marketplace/:id', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM marketplace_templates WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Not found' })
  res.json({
    template: {
      ...row,
      segments: JSON.parse(row.segments_json || '[]'),
      objections: JSON.parse(row.objections_json || '[]'),
    }
  })
})

app.post('/api/marketplace/:id/download', requireAuth, (req, res) => {
  const { id } = req.params
  const existing = db.prepare('SELECT id FROM marketplace_templates WHERE id = ?').get(id)
  if (!existing) return res.status(404).json({ error: 'Not found' })
  db.prepare('UPDATE marketplace_templates SET downloads = downloads + 1 WHERE id = ?').run(id)
  res.json({ success: true })
})

/* ---------- script sharing (JWT protected create, public read) ---------- */
app.post('/api/scripts/:id/share', requireAuth, (req, res) => {
  const { id } = req.params
  const { expires_in_days = 7 } = req.body
  const script = db.prepare('SELECT * FROM scripts WHERE id = ? AND user_id = ?').get(id, req.userId)
  if (!script) return res.status(404).json({ error: 'Script not found' })

  const token = require('crypto').randomBytes(16).toString('hex')
  const expiresAt = Date.now() + (expires_in_days * 86400000)

  db.prepare('INSERT INTO script_shares (user_id, script_id, token, expires_at) VALUES (?, ?, ?, ?)')
    .run(req.userId, id, token, expiresAt)

  res.json({ shareUrl: `${req.protocol}://${req.get('host')}/api/s/${token}`, expiresAt })
})

app.get('/api/s/:token', (req, res) => {
  const { token } = req.params
  const share = db.prepare('SELECT * FROM script_shares WHERE token = ?').get(token)
  if (!share) return res.status(404).json({ error: 'Link not found' })
  if (share.expires_at && Date.now() > share.expires_at) return res.status(410).json({ error: 'Link expired' })

  const script = db.prepare('SELECT * FROM scripts WHERE id = ?').get(share.script_id)
  if (!script) return res.status(404).json({ error: 'Script not found' })

  res.json({
    productName: script.product_id,
    method: script.method,
    callType: script.call_type,
    duration: script.duration,
    language: script.language,
    opening: script.opening,
    toneLevel: script.tone_level,
    toneGuidance: script.tone_guidance,
    segments: JSON.parse(script.segments_json || '[]'),
    objections: JSON.parse(script.objections_json || '[]'),
  })
})

/* ---------- scheduled calls (JWT protected) ---------- */
app.get('/api/scheduled-calls', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT sc.*, p.name as product_name
    FROM scheduled_calls sc
    LEFT JOIN products p ON p.id = sc.product_id
    WHERE sc.user_id = ?
    ORDER BY sc.scheduled_at ASC
  `).all(req.userId)
  res.json({ calls: rows })
})

app.post('/api/scheduled-calls', requireAuth, (req, res) => {
  const { product_id, script_id, prospect_name, prospect_company, prospect_email, method, call_type, duration, scheduled_at, timezone, notes } = req.body
  const result = db.prepare(
    'INSERT INTO scheduled_calls (user_id, product_id, script_id, prospect_name, prospect_company, prospect_email, method, call_type, duration, scheduled_at, timezone, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(req.userId, product_id || null, script_id || null, prospect_name || '', prospect_company || '', prospect_email || '', method || '', call_type || '', duration || 30, scheduled_at, timezone || 'UTC', notes || '')
  const row = db.prepare('SELECT * FROM scheduled_calls WHERE id = ?').get(result.lastInsertRowid)
  res.json({ call: row })
})

app.put('/api/scheduled-calls/:id', requireAuth, (req, res) => {
  const { id } = req.params
  const { status, notes, scheduled_at } = req.body
  const existing = db.prepare('SELECT id FROM scheduled_calls WHERE id = ? AND user_id = ?').get(id, req.userId)
  if (!existing) return res.status(404).json({ error: 'Not found' })
  const sets = [];
  const vals = [];
  if (status) { sets.push('status = ?'); vals.push(status); }
  if (notes !== undefined) { sets.push('notes = ?'); vals.push(notes); }
  if (scheduled_at) { sets.push('scheduled_at = ?'); vals.push(scheduled_at); }
  if (sets.length) {
    vals.push(id)
    db.prepare(`UPDATE scheduled_calls SET ${sets.join(', ')} WHERE id = ?`).run(...vals)
  }
  const row = db.prepare('SELECT * FROM scheduled_calls WHERE id = ?').get(id)
  res.json({ call: row })
})

app.delete('/api/scheduled-calls/:id', requireAuth, (req, res) => {
  const { id } = req.params
  const existing = db.prepare('SELECT id FROM scheduled_calls WHERE id = ? AND user_id = ?').get(id, req.userId)
  if (!existing) return res.status(404).json({ error: 'Not found' })
  db.prepare('DELETE FROM scheduled_calls WHERE id = ?').run(id)
  res.json({ success: true })
})

/* ---------- script comments (team collaboration) ---------- */
app.get('/api/scripts/:id/comments', requireAuth, (req, res) => {
  const { id } = req.params
  const rows = db.prepare(`
    SELECT sc.*, u.email as author_email
    FROM script_comments sc
    JOIN users u ON u.id = sc.user_id
    WHERE sc.script_id = ?
    ORDER BY sc.created_at ASC
  `).all(id)
  res.json({ comments: rows })
})

app.post('/api/scripts/:id/comments', requireAuth, (req, res) => {
  const { id } = req.params
  const { content, type = 'comment' } = req.body
  if (!content?.trim()) return res.status(400).json({ error: 'content required' })
  const result = db.prepare(
    'INSERT INTO script_comments (script_id, user_id, content, type) VALUES (?, ?, ?, ?)'
  ).run(id, req.userId, content.trim(), type)
  const row = db.prepare('SELECT sc.*, u.email as author_email FROM script_comments sc JOIN users u ON u.id = sc.user_id WHERE sc.id = ?').get(result.lastInsertRowid)
  res.json({ comment: row })
})

app.delete('/api/comments/:id', requireAuth, (req, res) => {
  const { id } = req.params
  const existing = db.prepare('SELECT id FROM script_comments WHERE id = ? AND user_id = ?').get(id, req.userId)
  if (!existing) return res.status(404).json({ error: 'Not found' })
  db.prepare('DELETE FROM script_comments WHERE id = ?').run(id)
  res.json({ success: true })
})

/* ---------- P6: user preferences (theme + notifications) ---------- */
app.get('/api/preferences', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM user_preferences WHERE user_id = ?').get(req.userId)
  if (!row) {
    db.prepare('INSERT INTO user_preferences (user_id) VALUES (?)').run(req.userId)
    const created = db.prepare('SELECT * FROM user_preferences WHERE user_id = ?').get(req.userId)
    return res.json({ preferences: created })
  }
  res.json({ preferences: row })
})

app.put('/api/preferences', requireAuth, (req, res) => {
  const {
    theme, email_weekly_digest, email_call_reminders, email_script_alerts,
    ai_provider, ai_model, ai_api_key, ai_base_url,
    smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from, smtp_secure,
  } = req.body
  const existing = db.prepare('SELECT id FROM user_preferences WHERE user_id = ?').get(req.userId)
  if (!existing) {
    db.prepare('INSERT INTO user_preferences (user_id, theme, email_weekly_digest, email_call_reminders, email_script_alerts, ai_provider, ai_model, ai_api_key, ai_base_url, smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from, smtp_secure) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(req.userId, theme || 'light', email_weekly_digest ?? 1, email_call_reminders ?? 1, email_script_alerts ?? 1, ai_provider || 'ollama', ai_model || null, ai_api_key || null, ai_base_url || null, smtp_host || null, smtp_port || null, smtp_user || null, smtp_pass || null, smtp_from || null, smtp_secure ?? 0)
  } else {
    const sets = [];
    const vals = [];
    if (theme !== undefined) { sets.push('theme = ?'); vals.push(theme); }
    if (email_weekly_digest !== undefined) { sets.push('email_weekly_digest = ?'); vals.push(email_weekly_digest ? 1 : 0); }
    if (email_call_reminders !== undefined) { sets.push('email_call_reminders = ?'); vals.push(email_call_reminders ? 1 : 0); }
    if (email_script_alerts !== undefined) { sets.push('email_script_alerts = ?'); vals.push(email_script_alerts ? 1 : 0); }
    if (ai_provider !== undefined) { sets.push('ai_provider = ?'); vals.push(ai_provider); }
    if (ai_model !== undefined) { sets.push('ai_model = ?'); vals.push(ai_model); }
    if (ai_api_key !== undefined) { sets.push('ai_api_key = ?'); vals.push(ai_api_key); }
    if (ai_base_url !== undefined) { sets.push('ai_base_url = ?'); vals.push(ai_base_url); }
    if (smtp_host !== undefined) { sets.push('smtp_host = ?'); vals.push(smtp_host); }
    if (smtp_port !== undefined) { sets.push('smtp_port = ?'); vals.push(smtp_port); }
    if (smtp_user !== undefined) { sets.push('smtp_user = ?'); vals.push(smtp_user); }
    if (smtp_pass !== undefined) { sets.push('smtp_pass = ?'); vals.push(smtp_pass); }
    if (smtp_from !== undefined) { sets.push('smtp_from = ?'); vals.push(smtp_from); }
    if (smtp_secure !== undefined) { sets.push('smtp_secure = ?'); vals.push(smtp_secure ? 1 : 0); }
    if (sets.length) {
      vals.push(req.userId)
      db.prepare(`UPDATE user_preferences SET ${sets.join(', ')} WHERE user_id = ?`).run(...vals)
    }
  }
  const row = db.prepare('SELECT * FROM user_preferences WHERE user_id = ?').get(req.userId)
  res.json({ preferences: row })
})

/* ---------- P11.2: AI model accounts ---------- */
app.get('/api/ai-accounts', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT id, name, provider, model, api_key, base_url, is_primary, created_at FROM ai_model_accounts WHERE user_id = ? ORDER BY created_at DESC').all(req.userId)
  res.json({ accounts: rows })
})

app.post('/api/ai-accounts', requireAuth, (req, res) => {
  const { name, provider, model, api_key, base_url } = req.body
  if (!name || !provider) return res.status(400).json({ error: 'name and provider required' })
  const existingCount = db.prepare('SELECT COUNT(*) as c FROM ai_model_accounts WHERE user_id = ?').get(req.userId)?.c || 0
  const isPrimary = existingCount === 0 ? 1 : 0
  const result = db.prepare(
    'INSERT INTO ai_model_accounts (user_id, name, provider, model, api_key, base_url, is_primary) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(req.userId, name, provider, model || null, api_key || null, base_url || null, isPrimary)
  const account = db.prepare('SELECT id, name, provider, model, api_key, base_url, is_primary, created_at FROM ai_model_accounts WHERE id = ?').get(result.lastInsertRowid)
  res.json({ account })
})

app.put('/api/ai-accounts/:id', requireAuth, (req, res) => {
  const { name, provider, model, api_key, base_url } = req.body
  const existing = db.prepare('SELECT id FROM ai_model_accounts WHERE id = ? AND user_id = ?').get(req.params.id, req.userId)
  if (!existing) return res.status(404).json({ error: 'Not found' })
  const sets = []
  const vals = []
  if (name !== undefined) { sets.push('name = ?'); vals.push(name); }
  if (provider !== undefined) { sets.push('provider = ?'); vals.push(provider); }
  if (model !== undefined) { sets.push('model = ?'); vals.push(model); }
  if (api_key !== undefined) { sets.push('api_key = ?'); vals.push(api_key); }
  if (base_url !== undefined) { sets.push('base_url = ?'); vals.push(base_url); }
  if (sets.length) {
    vals.push(req.params.id)
    db.prepare(`UPDATE ai_model_accounts SET ${sets.join(', ')} WHERE id = ?`).run(...vals)
  }
  const account = db.prepare('SELECT id, name, provider, model, api_key, base_url, is_primary, created_at FROM ai_model_accounts WHERE id = ?').get(req.params.id)
  res.json({ account })
})

app.delete('/api/ai-accounts/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT id, is_primary FROM ai_model_accounts WHERE id = ? AND user_id = ?').get(req.params.id, req.userId)
  if (!existing) return res.status(404).json({ error: 'Not found' })
  db.prepare('DELETE FROM ai_model_accounts WHERE id = ?').run(req.params.id)
  // If deleted was primary, promote newest to primary
  if (existing.is_primary) {
    const newest = db.prepare('SELECT id FROM ai_model_accounts WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(req.userId)
    if (newest) {
      db.prepare('UPDATE ai_model_accounts SET is_primary = 1 WHERE id = ?').run(newest.id)
    }
  }
  res.json({ success: true })
})

app.post('/api/ai-accounts/:id/primary', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT id FROM ai_model_accounts WHERE id = ? AND user_id = ?').get(req.params.id, req.userId)
  if (!existing) return res.status(404).json({ error: 'Not found' })
  db.prepare('UPDATE ai_model_accounts SET is_primary = 0 WHERE user_id = ?').run(req.userId)
  db.prepare('UPDATE ai_model_accounts SET is_primary = 1 WHERE id = ?').run(req.params.id)
  const account = db.prepare('SELECT id, name, provider, model, api_key, base_url, is_primary, created_at FROM ai_model_accounts WHERE id = ?').get(req.params.id)
  res.json({ account })
})

/* ---------- P11.3: email sending helper & templates ---------- */

const DEFAULT_TEMPLATES = [
  /* Transactional — Auth */
  {
    name: 'Welcome / Registration',
    slug: 'user_registration',
    subject: 'Welcome to {{company_name}}, {{user_name}}!',
    body: `Hi {{user_name}},

Welcome to {{company_name}}! Your account has been created successfully.

We're excited to have you on board. Start by creating your first product script in Call Studio.

If you have any questions, reply to this email.

— {{company_name}} Team`,
    description: 'Sent when a new user registers.',
    variables: JSON.stringify(['user_name','company_name']),
  },
  {
    name: 'Forgot Password',
    slug: 'forgot_password',
    subject: 'Reset your {{company_name}} password',
    body: `Hi {{user_name}},

We received a request to reset your password for {{company_name}}.

Click the link below to reset your password:
{{reset_link}}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email.

— {{company_name}} Team`,
    description: 'Sent when a user requests a password reset.',
    variables: JSON.stringify(['user_name','company_name','reset_link']),
  },
  {
    name: 'OTP / Verification Code',
    slug: 'otp_verification',
    subject: 'Your verification code: {{otp_code}}',
    body: `Hi {{user_name}},

Your one-time verification code is:

{{otp_code}}

This code is valid for 10 minutes. Do not share it with anyone.

— {{company_name}} Team`,
    description: 'Sent for 2FA, email verification, or sensitive action confirmation.',
    variables: JSON.stringify(['user_name','company_name','otp_code']),
  },
  {
    name: 'Password Changed',
    slug: 'password_changed',
    subject: 'Your {{company_name}} password was changed',
    body: `Hi {{user_name}},

Your password for {{company_name}} was successfully changed.

If you didn't make this change, please contact support immediately.

— {{company_name}} Team`,
    description: 'Sent after a successful password change.',
    variables: JSON.stringify(['user_name','company_name']),
  },
  /* Transactional — Workspace */
  {
    name: 'Workspace Invite',
    slug: 'workspace_invite',
    subject: 'You\'ve been invited to join {{company_name}} on Pitch Studio',
    body: `Hi {{invited_name}},

{{inviter_name}} has invited you to join {{company_name}} on Pitch Studio.

Click the link below to accept:
{{invite_link}}

— {{company_name}} Team`,
    description: 'Sent when someone is invited to a workspace.',
    variables: JSON.stringify(['invited_name','company_name','inviter_name','invite_link']),
  },
  /* App Notifications */
  {
    name: 'Weekly Performance Digest',
    slug: 'weekly_digest',
    subject: 'Your weekly pitch performance digest',
    body: `Hi {{user_name}},

Here's your weekly performance summary:

📝 Scripts created: {{scripts_count}}
📞 Calls made: {{calls_made}}
✅ Win rate: {{win_rate}}%

Keep up the great work!

— {{company_name}} Team`,
    description: 'Sent every Monday with script and call statistics.',
    variables: JSON.stringify(['user_name','company_name','scripts_count','calls_made','win_rate']),
  },
  {
    name: 'Call Reminder',
    slug: 'call_reminder',
    subject: 'Reminder: scheduled call with {{prospect_name}}',
    body: `Hi {{user_name}},

You have a {{call_type}} call scheduled in 15 minutes:

👤 Prospect: {{prospect_name}}
🏢 Company: {{prospect_company}}
📅 Time: {{scheduled_time}}

Good luck!

— {{company_name}} Team`,
    description: 'Sent 15 minutes before a scheduled call.',
    variables: JSON.stringify(['user_name','company_name','prospect_name','prospect_company','scheduled_time','call_type']),
  },
  {
    name: 'Script Alert',
    slug: 'script_alert',
    subject: 'New script activity in your workspace',
    body: `Hi {{user_name}},

{{author_name}} {{action}} the script "{{script_title}}".

— {{company_name}} Team`,
    description: 'Sent when team members create or update scripts.',
    variables: JSON.stringify(['user_name','company_name','author_name','action','script_title']),
  },
];

function seedDefaultTemplates(userId) {
  const existingSlugs = new Set(
    db.prepare('SELECT slug FROM email_templates WHERE user_id = ?').all(userId).map((r) => r.slug)
  )
  const stmt = db.prepare('INSERT INTO email_templates (user_id, name, slug, subject, body, description, variables) VALUES (?, ?, ?, ?, ?, ?, ?)')
  for (const t of DEFAULT_TEMPLATES) {
    if (!existingSlugs.has(t.slug)) {
      stmt.run(userId, t.name, t.slug, t.subject, t.body, t.description, t.variables)
    }
  }
}

async function sendEmail({ userId, to, subject, body, templateSlug, variables }) {
  const prefs = db.prepare('SELECT smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from, smtp_secure FROM user_preferences WHERE user_id = ?').get(userId)
  if (!prefs?.smtp_host) {
    throw new Error('SMTP not configured. Go to Settings > Email to configure SMTP.')
  }

  // If templateSlug provided, load and interpolate
  let finalSubject = subject || ''
  let finalBody = body || ''
  if (templateSlug) {
    const tpl = db.prepare('SELECT subject, body FROM email_templates WHERE user_id = ? AND slug = ? AND active = 1').get(userId, templateSlug)
    if (tpl) {
      finalSubject = tpl.subject
      finalBody = tpl.body
    }
  }

  // Interpolate variables
  if (variables) {
    for (const [key, val] of Object.entries(variables)) {
      finalSubject = finalSubject.replace(new RegExp(`{{${key}}}`, 'g'), val || '')
      finalBody = finalBody.replace(new RegExp(`{{${key}}}`, 'g'), val || '')
    }
  }

  const transporter = nodemailer.createTransport({
    host: prefs.smtp_host,
    port: prefs.smtp_port || 587,
    secure: prefs.smtp_secure === 1,
    auth: {
      user: prefs.smtp_user || '',
      pass: prefs.smtp_pass || '',
    },
  })

  const info = await transporter.sendMail({
    from: prefs.smtp_from || prefs.smtp_user || 'no-reply@pitchstudio.app',
    to,
    subject: finalSubject,
    text: finalBody,
    html: finalBody.replace(/\n/g, '<br />'),
  })

  db.prepare('INSERT INTO email_logs (user_id, template, to_email, subject, body, status) VALUES (?, ?, ?, ?, ?, ?)')
    .run(userId, templateSlug || 'custom', to, finalSubject, finalBody, 'sent')

  return info
}

app.get('/api/email-templates', requireAuth, (req, res) => {
  seedDefaultTemplates(req.userId)
  const rows = db.prepare('SELECT id, name, slug, subject, body, description, variables, active, created_at FROM email_templates WHERE user_id = ? ORDER BY created_at DESC').all(req.userId)
  res.json({ templates: rows })
})

app.post('/api/email-templates', requireAuth, (req, res) => {
  const { name, slug, subject, body, description, variables, active } = req.body
  if (!name || !slug || !subject || !body) return res.status(400).json({ error: 'name, slug, subject, body required' })
  const result = db.prepare(
    'INSERT INTO email_templates (user_id, name, slug, subject, body, description, variables, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(req.userId, name, slug, subject, body, description || '', variables || '[]', active ? 1 : 0)
  const row = db.prepare('SELECT id, name, slug, subject, body, description, variables, active, created_at FROM email_templates WHERE id = ?').get(result.lastInsertRowid)
  res.json({ template: row })
})

app.put('/api/email-templates/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT id FROM email_templates WHERE id = ? AND user_id = ?').get(req.params.id, req.userId)
  if (!existing) return res.status(404).json({ error: 'Not found' })
  const { name, slug, subject, body, description, variables, active } = req.body
  const sets = []
  const vals = []
  if (name !== undefined) { sets.push('name = ?'); vals.push(name); }
  if (slug !== undefined) { sets.push('slug = ?'); vals.push(slug); }
  if (subject !== undefined) { sets.push('subject = ?'); vals.push(subject); }
  if (body !== undefined) { sets.push('body = ?'); vals.push(body); }
  if (description !== undefined) { sets.push('description = ?'); vals.push(description); }
  if (variables !== undefined) { sets.push('variables = ?'); vals.push(variables); }
  if (active !== undefined) { sets.push('active = ?'); vals.push(active ? 1 : 0); }
  if (sets.length) {
    vals.push(req.params.id)
    db.prepare(`UPDATE email_templates SET ${sets.join(', ')} WHERE id = ?`).run(...vals)
  }
  const row = db.prepare('SELECT id, name, slug, subject, body, description, variables, active, created_at FROM email_templates WHERE id = ?').get(req.params.id)
  res.json({ template: row })
})

app.delete('/api/email-templates/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT id FROM email_templates WHERE id = ? AND user_id = ?').get(req.params.id, req.userId)
  if (!existing) return res.status(404).json({ error: 'Not found' })
  db.prepare('DELETE FROM email_templates WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

app.post('/api/email-templates/:id/duplicate', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM email_templates WHERE id = ? AND user_id = ?').get(req.params.id, req.userId)
  if (!existing) return res.status(404).json({ error: 'Not found' })
  const result = db.prepare(
    'INSERT INTO email_templates (user_id, name, slug, subject, body, description, variables, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(req.userId, existing.name + ' (Copy)', existing.slug + '_copy_' + Date.now(), existing.subject, existing.body, existing.description || '', existing.variables || '[]', existing.active)
  const row = db.prepare('SELECT id, name, slug, subject, body, description, variables, active, created_at FROM email_templates WHERE id = ?').get(result.lastInsertRowid)
  res.json({ template: row })
})

app.post('/api/email/test-smtp', requireAuth, async (req, res) => {
  try {
    const { to } = req.body
    const testTo = to || req.userEmail
    await sendEmail({
      userId: req.userId,
      to: testTo,
      subject: 'Pitch Studio — SMTP Test',
      body: `Hi ${req.userEmail.split('@')[0]},

This is a test email from Pitch Studio. If you received it, your SMTP configuration is working correctly!

— Pitch Studio Team`,
    })
    res.json({ success: true, message: `Test email sent to ${testTo}` })
  } catch (err) {
    console.error('[SMTP test] Error:', err.message)
    res.status(400).json({ error: err.message })
  }
})

/* ---------- P6.2: automation rules ---------- */
app.get('/api/automation-rules', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM automation_rules WHERE user_id = ? ORDER BY created_at DESC').all(req.userId)
  res.json({ rules: rows })
})

app.post('/api/automation-rules', requireAuth, (req, res) => {
  const { trigger_event, action_type, target_url, payload_template, active } = req.body
  if (!trigger_event || !action_type) return res.status(400).json({ error: 'trigger_event and action_type required' })
  const result = db.prepare(
    'INSERT INTO automation_rules (user_id, trigger_event, action_type, target_url, payload_template, active) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.userId, trigger_event, action_type, target_url || '', payload_template || '', active ? 1 : 0)
  const row = db.prepare('SELECT * FROM automation_rules WHERE id = ?').get(result.lastInsertRowid)
  res.json({ rule: row })
})

app.put('/api/automation-rules/:id', requireAuth, (req, res) => {
  const { id } = req.params
  const { trigger_event, action_type, target_url, payload_template, active } = req.body
  const existing = db.prepare('SELECT id FROM automation_rules WHERE id = ? AND user_id = ?').get(id, req.userId)
  if (!existing) return res.status(404).json({ error: 'Not found' })
  db.prepare('UPDATE automation_rules SET trigger_event = ?, action_type = ?, target_url = ?, payload_template = ?, active = ? WHERE id = ?')
    .run(trigger_event, action_type, target_url || '', payload_template || '', active ? 1 : 0, id)
  const row = db.prepare('SELECT * FROM automation_rules WHERE id = ?').get(id)
  res.json({ rule: row })
})

app.delete('/api/automation-rules/:id', requireAuth, (req, res) => {
  const { id } = req.params
  const existing = db.prepare('SELECT id FROM automation_rules WHERE id = ? AND user_id = ?').get(id, req.userId)
  if (!existing) return res.status(404).json({ error: 'Not found' })
  db.prepare('DELETE FROM automation_rules WHERE id = ?').run(id)
  res.json({ success: true })
})

/* ---------- CRM connections (JWT protected) ---------- */
app.get('/api/crm', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT id, crm_type, webhook_url, active, created_at FROM crm_connections WHERE user_id = ? ORDER BY created_at DESC').all(req.userId)
  res.json({ connections: rows })
})

app.post('/api/crm', requireAuth, (req, res) => {
  const { crm_type, webhook_url, api_token, config_json } = req.body
  if (!crm_type || !webhook_url) return res.status(400).json({ error: 'crm_type and webhook_url required' })
  db.prepare('DELETE FROM crm_connections WHERE user_id = ? AND crm_type = ?').run(req.userId, crm_type)
  const result = db.prepare(
    'INSERT INTO crm_connections (user_id, crm_type, webhook_url, api_token, config_json) VALUES (?, ?, ?, ?, ?)'
  ).run(req.userId, crm_type, webhook_url, api_token || '', config_json || '')
  const row = db.prepare('SELECT id, crm_type, webhook_url, active, created_at FROM crm_connections WHERE id = ?').get(result.lastInsertRowid)
  res.json({ connection: row })
})

app.put('/api/crm/:id', requireAuth, (req, res) => {
  const { id } = req.params
  const { active } = req.body
  const existing = db.prepare('SELECT id FROM crm_connections WHERE id = ? AND user_id = ?').get(id, req.userId)
  if (!existing) return res.status(404).json({ error: 'Not found' })
  db.prepare('UPDATE crm_connections SET active = ? WHERE id = ?').run(active ? 1 : 0, id)
  const row = db.prepare('SELECT id, crm_type, webhook_url, active, created_at FROM crm_connections WHERE id = ?').get(id)
  res.json({ connection: row })
})

app.delete('/api/crm/:id', requireAuth, (req, res) => {
  const { id } = req.params
  const existing = db.prepare('SELECT id FROM crm_connections WHERE id = ? AND user_id = ?').get(id, req.userId)
  if (!existing) return res.status(404).json({ error: 'Not found' })
  db.prepare('DELETE FROM crm_connections WHERE id = ?').run(id)
  res.json({ success: true })
})

/* ---------- CRM dispatch helper ---------- */
async function dispatchCrm(userId, eventType, payload) {
  try {
    const connections = db.prepare('SELECT * FROM crm_connections WHERE user_id = ? AND active = 1').all(userId)
    for (const conn of connections) {
      try {
        const body = JSON.stringify({ event: eventType, ...payload, source: 'pitch-studio', timestamp: Date.now() })
        const sig = require('crypto').createHmac('sha256', conn.api_token || 'pitch-default').update(body).digest('hex')
        await fetch(conn.webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Pitch-Signature': `sha256=${sig}` },
          body,
        })
      } catch (_) {}
    }
  } catch (_) {}
}

/* ---------- API keys (JWT protected) ---------- */
app.get('/api/api-keys', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT id, name, scopes, created_at, last_used_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC').all(req.userId)
  res.json({ keys: rows })
})

app.post('/api/api-keys', requireAuth, (req, res) => {
  const { name } = req.body
  const rawKey = 'ps_' + require('crypto').randomBytes(24).toString('hex')
  const hashed = require('crypto').createHash('sha256').update(rawKey).digest('hex')
  db.prepare('INSERT INTO api_keys (user_id, key_hash, name) VALUES (?, ?, ?)').run(req.userId, hashed, name || 'API Key')
  res.json({ key: rawKey, name: name || 'API Key', warning: 'This is the only time the key is shown. Copy it now.' })
})

app.delete('/api/api-keys/:id', requireAuth, (req, res) => {
  const { id } = req.params
  const existing = db.prepare('SELECT id FROM api_keys WHERE id = ? AND user_id = ?').get(id, req.userId)
  if (!existing) return res.status(404).json({ error: 'Not found' })
  db.prepare('DELETE FROM api_keys WHERE id = ?').run(id)
  res.json({ success: true })
})

/* ---------- webhooks (JWT protected) ---------- */
app.get('/api/webhooks', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM webhooks WHERE user_id = ? ORDER BY created_at DESC').all(req.userId)
  res.json({ webhooks: rows })
})

app.post('/api/webhooks', requireAuth, (req, res) => {
  const { url, events, secret } = req.body
  if (!url || !events) return res.status(400).json({ error: 'url and events required' })
  const result = db.prepare(
    'INSERT INTO webhooks (user_id, url, events, secret) VALUES (?, ?, ?, ?)'
  ).run(req.userId, url, events, secret || '')
  const row = db.prepare('SELECT * FROM webhooks WHERE id = ?').get(result.lastInsertRowid)
  res.json({ webhook: row })
})

app.put('/api/webhooks/:id', requireAuth, (req, res) => {
  const { id } = req.params
  const { url, events, secret, active } = req.body
  const existing = db.prepare('SELECT * FROM webhooks WHERE id = ? AND user_id = ?').get(id, req.userId)
  if (!existing) return res.status(404).json({ error: 'Not found' })

  const updates = []
  const values = []
  if (url !== undefined) { updates.push('url = ?'); values.push(url) }
  if (events !== undefined) { updates.push('events = ?'); values.push(events) }
  if (secret !== undefined) { updates.push('secret = ?'); values.push(secret) }
  if (active !== undefined) { updates.push('active = ?'); values.push(active ? 1 : 0) }
  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' })
  values.push(id)

  db.prepare(`UPDATE webhooks SET ${updates.join(', ')} WHERE id = ?`).run(...values)
  const row = db.prepare('SELECT * FROM webhooks WHERE id = ?').get(id)
  res.json({ webhook: row })
})

app.delete('/api/webhooks/:id', requireAuth, (req, res) => {
  const { id } = req.params
  const existing = db.prepare('SELECT id FROM webhooks WHERE id = ? AND user_id = ?').get(id, req.userId)
  if (!existing) return res.status(404).json({ error: 'Not found' })
  db.prepare('DELETE FROM webhooks WHERE id = ?').run(id)
  res.json({ success: true })
})

/* ---------- public API (API key auth) ---------- */
app.get('/api/v1/products', requireApiKey, (req, res) => {
  if (!hasScope(req, 'scripts:read')) return res.status(403).json({ error: 'Scope scripts:read required' })
  const rows = db.prepare('SELECT id, name, category, one_liner, description FROM products WHERE user_id = ?').all(req.userId)
  res.json({ products: rows })
})

app.post('/api/v1/scripts/generate', requireApiKey, async (req, res) => {
  if (!hasScope(req, 'scripts:write')) return res.status(403).json({ error: 'Scope scripts:write required' })

  const { product_id, method, call_type, duration, language, region, delivery, simple, persona } = req.body
  if (!product_id || !method || !call_type || !duration) {
    return res.status(400).json({ error: 'product_id, method, call_type, duration required' })
  }

  const product = db.prepare('SELECT * FROM products WHERE id = ? AND user_id = ?').get(product_id, req.userId)
  if (!product) return res.status(404).json({ error: 'Product not found' })

  // Forward to Ollama via existing proxy logic
  try {
    const headers = { 'Content-Type': 'application/json' }
    if (OLLAMA_API_KEY) headers['Authorization'] = `Bearer ${OLLAMA_API_KEY}`

    const methodObj = { name: method, tone: 'Consultative', blurb: method }
    const callTypeObj = { name: call_type }
    const style = `Methodology: ${method}\nCall type: ${call_type}\nDuration: ${duration}m\nLanguage: ${language || 'en'}\nRegion: ${region || 'india'}`
    const corePrompt = `Write a ${duration} minute sales call script for ${product.name}.\n${style}\nProduct: ${product.description || product.one_liner || ''}\nReturn ONLY JSON with opening, toneLevel, toneGuidance, segments array.`

    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: OLLAMA_MODEL || 'glm-5.2:cloud',
        messages: [
          { role: 'system', content: 'You are an elite sales coach. Output ONLY valid JSON.' },
          { role: 'user', content: corePrompt },
        ],
        stream: false,
      }),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      return res.status(response.status).json({ error: text || `Upstream ${response.status}` })
    }

    let data = await response.json()
    if (data.choices && data.choices[0]?.message?.content) {
      data = { message: { content: data.choices[0].message.content } }
    }

    const generated = data.message?.content || ''
    let parsed = {}
    try {
      const clean = generated.replace(/```json/gi, '').replace(/```/g, '').trim()
      parsed = JSON.parse(clean.slice(clean.indexOf('{')))
    } catch (_) {
      parsed = { raw: generated }
    }

    // dispatch webhook
    await dispatchWebhook(req.userId, 'script.completed', {
      product_id,
      method,
      call_type,
      duration,
      language: language || 'en',
      generated_at: Date.now(),
    })

    res.json({ script: parsed, model: OLLAMA_MODEL || 'glm-5.2:cloud' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* ---------- AI chat proxy (multi-provider) ---------- */

function getUserChatConfig(req) {
  // Try JWT auth first
  const header = req.headers.authorization || ''
  const token = header.replace(/^Bearer\s+/i, '')
  let userId = null
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      userId = decoded.userId
    } catch { /* invalid token — fallback to env defaults */ }
  }

  const fallback = {
    provider: 'ollama',
    model: OLLAMA_MODEL || 'glm-5.2',
    apiKey: OLLAMA_API_KEY || null,
    baseUrl: OLLAMA_BASE_URL,
  }

  if (!userId) return fallback

  // 1. Try primary ai_model_accounts (new multi-account system)
  const account = db.prepare('SELECT provider, model, api_key, base_url FROM ai_model_accounts WHERE user_id = ? AND is_primary = 1 LIMIT 1').get(userId)
  if (account) {
    return {
      provider: account.provider,
      model: account.model || OLLAMA_MODEL || 'glm-5.2',
      apiKey: account.api_key || OLLAMA_API_KEY || null,
      baseUrl: account.base_url || OLLAMA_BASE_URL,
    }
  }

  // 2. Fallback to user_preferences (legacy single-config system)
  const prefs = db.prepare('SELECT ai_provider, ai_model, ai_api_key, ai_base_url FROM user_preferences WHERE user_id = ?').get(userId)
  if (prefs?.ai_provider) {
    return {
      provider: prefs.ai_provider,
      model: prefs.ai_model || OLLAMA_MODEL || 'glm-5.2',
      apiKey: prefs.ai_api_key || OLLAMA_API_KEY || null,
      baseUrl: prefs.ai_base_url || OLLAMA_BASE_URL,
    }
  }

  return fallback
}

function normalizeChatResponse(provider, upstreamData) {
  if (provider === 'openai') {
    const content = upstreamData.choices?.[0]?.message?.content || ''
    return { message: { content } }
  }
  if (provider === 'anthropic') {
    const content = upstreamData.content?.[0]?.text || ''
    return { message: { content } }
  }
  // Ollama or fallback
  return upstreamData
}

/* Extract text chunk from provider-specific SSE event */
function extractStreamChunk(provider, data) {
  if (provider === 'openai') {
    return data.choices?.[0]?.delta?.content || ''
  }
  if (provider === 'anthropic') {
    return data.delta?.text || ''
  }
  // Ollama
  return data.message?.content || data.response || ''
}

/* Build request and call upstream AI model. Returns raw fetch Response. */
async function fetchAIModel(cfg, messages, stream = false) {
  let url, headers = { 'Content-Type': 'application/json' }, body

  if (cfg.provider === 'openai') {
    url = 'https://api.openai.com/v1/chat/completions'
    headers['Authorization'] = `Bearer ${cfg.apiKey}`
    body = JSON.stringify({ model: cfg.model, messages, stream })
  } else if (cfg.provider === 'anthropic') {
    url = 'https://api.anthropic.com/v1/messages'
    headers['x-api-key'] = cfg.apiKey
    headers['anthropic-version'] = '2023-06-01'
    const sysMsgs = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n')
    const chatMsgs = messages.filter((m) => m.role !== 'system')
    body = JSON.stringify({ model: cfg.model, max_tokens: 4096, system: sysMsgs || undefined, messages: chatMsgs, stream })
  } else {
    url = `${cfg.baseUrl}/api/chat`
    if (cfg.apiKey) headers['Authorization'] = `Bearer ${cfg.apiKey}`
    body = JSON.stringify({ model: cfg.model, messages, stream, think: false, options: { num_ctx: 16384, num_predict: 16384 } })
  }

  return fetch(url, { method: 'POST', headers, body })
}

app.post('/api/chat', requireAuth, async (req, res) => {
  try {
    const cfg = getUserChatConfig(req)
    const { messages } = req.body
    const response = await fetchAIModel(cfg, messages, false)

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      console.error(`[AI proxy] Upstream ${response.status}:`, text.slice(0, 500))
      return res.status(response.status).json({ error: text || `Service returned ${response.status}`, upstream_url: response.url, status: response.status })
    }

    const upstreamData = await response.json()
    const normalized = normalizeChatResponse(cfg.provider, upstreamData)
    res.status(response.status).json(normalized)
  } catch (err) {
    console.error('[AI proxy] Error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/chat/stream', requireAuth, async (req, res) => {
  try {
    const cfg = getUserChatConfig(req)
    const { messages } = req.body
    const response = await fetchAIModel(cfg, messages, true)

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      console.error(`[AI proxy] Upstream ${response.status} from ${response.url}:`, text)
      return res.status(response.status).json({ error: text || `Service returned ${response.status}`, upstream_url: response.url, status: response.status })
    }

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      if (cfg.provider === 'ollama') {
        // Ollama: proxy raw bytes unchanged
        res.write(Buffer.from(value))
        continue
      }

      // OpenAI / Anthropic: normalize SSE to Ollama-style format
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.trim()) continue
        const jsonLine = line.replace(/^data:\s*/, '').trim()
        if (jsonLine === '[DONE]') {
          res.write('data: {"done":true}\n\n')
          continue
        }
        try {
          const data = JSON.parse(jsonLine)
          if (data.type === 'message_stop' || data.type === 'message_end') {
            res.write('data: {"done":true}\n\n')
            continue
          }
          const chunk = extractStreamChunk(cfg.provider, data)
          if (chunk) {
            res.write(`data: {"message":{"content":${JSON.stringify(chunk)}}}\n\n`)
          }
        } catch (_) {
          // ignore malformed lines
        }
      }
    }

    // Flush remaining buffer
    if (buffer.trim()) {
      const jsonLine = buffer.replace(/^data:\s*/, '').trim()
      if (jsonLine && jsonLine !== '[DONE]') {
        try {
          const data = JSON.parse(jsonLine)
          const chunk = extractStreamChunk(cfg.provider, data)
          if (chunk) {
            res.write(`data: {"message":{"content":${JSON.stringify(chunk)}}}\n\n`)
          }
        } catch (_) {}
      }
    }

    res.end()
  } catch (err) {
    console.error('[AI proxy] Stream error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

/* ---------- analytics (JWT protected) ---------- */
app.get('/api/analytics/overview', requireAuth, (req, res) => {
  const scriptsCount = db.prepare('SELECT COUNT(*) as c FROM scripts WHERE user_id = ?').get(req.userId)?.c || 0
  const outcomes = db.prepare(`
    SELECT outcome, COUNT(*) as c FROM scripts WHERE user_id = ? AND outcome IS NOT NULL GROUP BY outcome
  `).all(req.userId)
  const callsMade = db.prepare(`
    SELECT COUNT(*) as c FROM scripts WHERE user_id = ? AND used_at IS NOT NULL
  `).get(req.userId)?.c || 0
  const feedbackCount = db.prepare('SELECT COUNT(*) as c FROM prompt_feedback WHERE user_id = ?').get(req.userId)?.c || 0
  res.json({ scripts: scriptsCount, callsMade, outcomes, feedbackCount })
})

app.get('/api/analytics/win-rate-trend', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT strftime('%Y-%m', datetime(saved_at / 1000, 'unixepoch')) as month,
      COUNT(*) as total,
      SUM(CASE WHEN outcome = 'won' THEN 1 ELSE 0 END) as wins
    FROM scripts
    WHERE user_id = ? AND saved_at IS NOT NULL
    GROUP BY month
    ORDER BY month DESC
    LIMIT 12
  `).all(req.userId)
  res.json({ trend: rows })
})

app.get('/api/analytics/top-methods', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT method, call_type, COUNT(*) as total,
      SUM(CASE WHEN outcome = 'won' THEN 1 ELSE 0 END) as wins,
      ROUND(AVG(CASE WHEN rating IS NOT NULL THEN rating END), 1) as avg_rating
    FROM scripts
    LEFT JOIN prompt_feedback pf ON pf.script_id = scripts.id
    WHERE scripts.user_id = ?
    GROUP BY method, call_type
    ORDER BY wins DESC, total DESC
    LIMIT 10
  `).all(req.userId)
  res.json({ methods: rows })
})

app.get('/api/analytics/team-activity', requireAuth, (req, res) => {
  const userWs = db.prepare(
    `SELECT w.id FROM workspaces w JOIN workspace_members m ON m.workspace_id = w.id WHERE m.user_id = ? AND m.joined_at IS NOT NULL LIMIT 1`
  ).get(req.userId)
  const wsId = userWs?.id
  if (!wsId) return res.json({ members: [] })

  const rows = db.prepare(`
    SELECT u.email, COUNT(s.id) as scripts, COUNT(CASE WHEN s.used_at IS NOT NULL THEN 1 END) as calls,
      COUNT(CASE WHEN s.outcome = 'won' THEN 1 END) as wins
    FROM users u
    JOIN workspace_members m ON m.user_id = u.id AND m.workspace_id = ?
    LEFT JOIN scripts s ON s.user_id = u.id
    GROUP BY u.id
    ORDER BY wins DESC, calls DESC
  `).all(wsId)
  res.json({ members: rows })
})

/* ---------- P7.1 coaching insights ---------- */
app.get('/api/coaching-insights', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT ci.*, p.name as product_name
    FROM coaching_insights ci
    LEFT JOIN scripts s ON s.id = ci.script_id
    LEFT JOIN products p ON p.id = s.product_id
    WHERE ci.user_id = ?
    ORDER BY ci.created_at DESC
    LIMIT 50
  `).all(req.userId)
  res.json({ insights: rows })
})

app.post('/api/coaching-insights/generate', requireAuth, async (req, res) => {
  const { transcript, type = 'roleplay', script_id, call_id } = req.body
  if (!transcript) return res.status(400).json({ error: 'transcript required' })

  try {
    const headers = { 'Content-Type': 'application/json' }
    if (OLLAMA_API_KEY) headers['Authorization'] = `Bearer ${OLLAMA_API_KEY}`

    const systemPrompt = `You are an elite sales coach. Analyze the following sales call transcript and return ONLY valid JSON with this exact structure:
{
  "overall_score": 1-100,
  "skill_scores": {
    "discovery": 1-100,
    "questioning": 1-100,
    "listening": 1-100,
    "painIdentification": 1-100,
    "valuePositioning": 1-100,
    "objectionHandling": 1-100,
    "closing": 1-100
  },
  "strengths": ["brief strength 1", "brief strength 2"],
  "improvements": ["brief improvement 1", "brief improvement 2"],
  "exact_moments": [
    {
      "context": "what the prospect said",
      "whatYouDid": "what the rep did",
      "whatYouShouldHaveDone": "what the rep should have done",
      "betterResponse": "exact better wording"
    }
  ],
  "recommended_practice": [
    { "label": "skill name", "weakness": "what needs work", "practiceType": "objection" }
  ],
  "ai_summary": "2-3 sentence personalized coaching summary"
}

Be specific. Include 2-4 exact_moments with realistic coaching. Make recommended_practice actionable.`

    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: OLLAMA_MODEL || 'glm-5.2:cloud',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: transcript },
        ],
        stream: false,
      }),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      return res.status(response.status).json({ error: text || `Upstream ${response.status}` })
    }

    let data = await response.json()
    if (data.choices && data.choices[0]?.message?.content) {
      data = { message: { content: data.choices[0].message.content } }
    }

    const generated = data.message?.content || ''
    let parsed = {}
    try {
      const clean = generated.replace(/```json/gi, '').replace(/```/g, '').trim()
      parsed = JSON.parse(clean.slice(clean.indexOf('{')))
    } catch (_) {
      parsed = { raw: generated }
    }

    const result = db.prepare(`
      INSERT INTO coaching_insights
      (user_id, script_id, call_id, type, transcript, overall_score, rapport_score, objection_score, closing_score, discovery_score, strengths, improvements, action_items, ai_summary, raw_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.userId,
      script_id || null,
      call_id || null,
      type,
      transcript,
      parsed.overall_score || null,
      parsed.skill_scores?.discovery || parsed.rapport_score || null,
      parsed.skill_scores?.objectionHandling || parsed.objection_score || null,
      parsed.skill_scores?.closing || parsed.closing_score || null,
      parsed.skill_scores?.discovery || parsed.discovery_score || null,
      Array.isArray(parsed.strengths) ? JSON.stringify(parsed.strengths) : null,
      Array.isArray(parsed.improvements) ? JSON.stringify(parsed.improvements) : null,
      Array.isArray(parsed.action_items) ? JSON.stringify(parsed.action_items) : null,
      parsed.ai_summary || null,
      JSON.stringify(parsed)
    )

    const row = db.prepare('SELECT * FROM coaching_insights WHERE id = ?').get(result.lastInsertRowid)
    res.json({ insight: { ...row, raw_data: parsed }, generated: parsed })
  } catch (err) {
    console.error('[Coaching insights] Error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/coaching-insights/:id', requireAuth, (req, res) => {
  const { id } = req.params
  const existing = db.prepare('SELECT id FROM coaching_insights WHERE id = ? AND user_id = ?').get(id, req.userId)
  if (!existing) return res.status(404).json({ error: 'Not found' })
  db.prepare('DELETE FROM coaching_insights WHERE id = ?').run(id)
  res.json({ success: true })
})

/* ---------- P7.2 sentiment analysis ---------- */
app.post('/api/sentiment/analyze', requireAuth, async (req, res) => {
  const { transcript, type = 'call', call_id } = req.body
  if (!transcript) return res.status(400).json({ error: 'transcript required' })

  try {
    const headers = { 'Content-Type': 'application/json' }
    if (OLLAMA_API_KEY) headers['Authorization'] = `Bearer ${OLLAMA_API_KEY}`

    const systemPrompt = `You are a sales sentiment analyst. Analyze the following sales call transcript and return ONLY valid JSON with this exact structure:
{
  "overall_sentiment": -1.0 to 1.0,
  "sentiment_history": [
    { "time": "0:30", "sentiment": 0.2, "reason": "brief reason" }
  ],
  "detected_pivots": [
    { "time": "2:15", "suggestion": "suggested pivot action", "reason": "why" }
  ]
}`

    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: OLLAMA_MODEL || 'glm-5.2:cloud',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: transcript },
        ],
        stream: false,
      }),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      return res.status(response.status).json({ error: text || `Upstream ${response.status}` })
    }

    let data = await response.json()
    if (data.choices && data.choices[0]?.message?.content) {
      data = { message: { content: data.choices[0].message.content } }
    }

    const generated = data.message?.content || ''
    let parsed = {}
    try {
      const clean = generated.replace(/```json/gi, '').replace(/```/g, '').trim()
      parsed = JSON.parse(clean.slice(clean.indexOf('{')))
    } catch (_) {
      parsed = { raw: generated }
    }

    const result = db.prepare(`
      INSERT INTO sentiment_sessions (user_id, call_id, type, overall_sentiment, sentiment_history, detected_pivots)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      req.userId,
      call_id || null,
      type,
      parsed.overall_sentiment || 0,
      Array.isArray(parsed.sentiment_history) ? JSON.stringify(parsed.sentiment_history) : null,
      Array.isArray(parsed.detected_pivots) ? JSON.stringify(parsed.detected_pivots) : null
    )

    const row = db.prepare('SELECT * FROM sentiment_sessions WHERE id = ?').get(result.lastInsertRowid)
    res.json({ session: row, generated: parsed })
  } catch (err) {
    console.error('[Sentiment] Error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/sentiment/:id', requireAuth, (req, res) => {
  const { id } = req.params
  const row = db.prepare('SELECT * FROM sentiment_sessions WHERE id = ? AND user_id = ?').get(id, req.userId)
  if (!row) return res.status(404).json({ error: 'Not found' })
  try { row.sentiment_history = JSON.parse(row.sentiment_history || '[]') } catch { row.sentiment_history = [] }
  try { row.detected_pivots = JSON.parse(row.detected_pivots || '[]') } catch { row.detected_pivots = [] }
  res.json({ session: row })
})

/* ---------- P7.3 A/B script testing ---------- */
app.get('/api/script-variants', requireAuth, (req, res) => {
  const { group } = req.query
  const rows = group
    ? db.prepare('SELECT * FROM script_variants WHERE user_id = ? AND group_name = ? ORDER BY variant').all(req.userId, group)
    : db.prepare('SELECT * FROM script_variants WHERE user_id = ? ORDER BY group_name, variant').all(req.userId)
  res.json({ variants: rows })
})

app.post('/api/script-variants', requireAuth, (req, res) => {
  const { group_name, variant, script_id, product_id, method, call_type, duration, language, region, delivery, simple, persona, segments_json } = req.body
  if (!group_name || !variant || !product_id || !method) {
    return res.status(400).json({ error: 'group_name, variant, product_id, method required' })
  }
  if (!['A','B'].includes(variant)) return res.status(400).json({ error: 'variant must be A or B' })

  const result = db.prepare(`
    INSERT INTO script_variants (user_id, group_name, variant, script_id, product_id, method, call_type, duration, language, region, delivery, simple, persona, segments_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, group_name, variant) DO UPDATE SET
      script_id = excluded.script_id,
      product_id = excluded.product_id,
      method = excluded.method,
      call_type = excluded.call_type,
      duration = excluded.duration,
      language = excluded.language,
      region = excluded.region,
      delivery = excluded.delivery,
      simple = excluded.simple,
      persona = excluded.persona,
      segments_json = excluded.segments_json
  `).run(req.userId, group_name, variant, script_id || null, product_id, call_type || '', duration || 0, language || 'en', region || 'india', delivery || 'phone', simple || 0, persona || 'general', segments_json || '')

  const row = db.prepare('SELECT * FROM script_variants WHERE id = ?').get(result.lastInsertRowid || result.changes)
  res.json({ variant: row })
})

app.post('/api/script-variants/:id/use', requireAuth, (req, res) => {
  const { id } = req.params
  const { outcome } = req.body
  const existing = db.prepare('SELECT * FROM script_variants WHERE id = ? AND user_id = ?').get(id, req.userId)
  if (!existing) return res.status(404).json({ error: 'Not found' })

  db.prepare('UPDATE script_variants SET usage_count = usage_count + 1 WHERE id = ?').run(id)
  if (outcome === 'won') db.prepare('UPDATE script_variants SET win_count = win_count + 1 WHERE id = ?').run(id)
  if (outcome === 'lost') db.prepare('UPDATE script_variants SET loss_count = loss_count + 1 WHERE id = ?').run(id)

  const row = db.prepare('SELECT * FROM script_variants WHERE id = ?').get(id)
  res.json({ variant: row })
})

app.get('/api/script-variants/:group/winner', requireAuth, (req, res) => {
  const { group } = req.params
  const rows = db.prepare('SELECT * FROM script_variants WHERE user_id = ? AND group_name = ? AND usage_count > 0 ORDER BY variant').all(req.userId, group)
  if (rows.length < 2) return res.json({ winner: null, reason: 'Need both variants with usage data' })

  const a = rows.find(r => r.variant === 'A')
  const b = rows.find(r => r.variant === 'B')
  if (!a || !b) return res.json({ winner: null, reason: 'Both A and B required' })

  const aRate = a.usage_count > 0 ? (a.win_count / a.usage_count) : 0
  const bRate = b.usage_count > 0 ? (b.win_count / b.usage_count) : 0
  const winner = aRate > bRate ? 'A' : bRate > aRate ? 'B' : 'tie'
  const confidence = Math.abs(aRate - bRate)

  res.json({
    group_name: group,
    winner,
    confidence: Math.round(confidence * 100),
    a: { usage: a.usage_count, wins: a.win_count, rate: Math.round(aRate * 100) },
    b: { usage: b.usage_count, wins: b.win_count, rate: Math.round(bRate * 100) },
    promote: winner !== 'tie' && (a.usage_count + b.usage_count) >= 10 && confidence >= 0.1,
  })
})

app.delete('/api/script-variants/:id', requireAuth, (req, res) => {
  const { id } = req.params
  const existing = db.prepare('SELECT id FROM script_variants WHERE id = ? AND user_id = ?').get(id, req.userId)
  if (!existing) return res.status(404).json({ error: 'Not found' })
  db.prepare('DELETE FROM script_variants WHERE id = ?').run(id)
  res.json({ success: true })
})

/* ---------- P7.4 CRM native integrations ---------- */
app.get('/api/crm-connections/oauth', requireAuth, (req, res) => {
  const { crm_type } = req.query
  if (!['salesforce','hubspot'].includes(crm_type)) return res.status(400).json({ error: 'crm_type must be salesforce or hubspot' })
  const rows = db.prepare('SELECT id, crm_type, instance_url, expires_at, active, created_at FROM crm_oauth_tokens WHERE user_id = ? AND crm_type = ?').all(req.userId, crm_type)
  res.json({ connections: rows })
})

app.post('/api/crm-connections/oauth', requireAuth, (req, res) => {
  const { crm_type, access_token, refresh_token, instance_url, expires_at, config_json } = req.body
  if (!crm_type || !access_token) return res.status(400).json({ error: 'crm_type and access_token required' })

  db.prepare('DELETE FROM crm_oauth_tokens WHERE user_id = ? AND crm_type = ?').run(req.userId, crm_type)
  const result = db.prepare(`
    INSERT INTO crm_oauth_tokens (user_id, crm_type, access_token, refresh_token, instance_url, expires_at, config_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(req.userId, crm_type, access_token, refresh_token || '', instance_url || '', expires_at || null, config_json || '')

  const row = db.prepare('SELECT id, crm_type, instance_url, expires_at, active, created_at FROM crm_oauth_tokens WHERE id = ?').get(result.lastInsertRowid)
  res.json({ connection: row })
})

app.delete('/api/crm-connections/oauth/:id', requireAuth, (req, res) => {
  const { id } = req.params
  const existing = db.prepare('SELECT id FROM crm_oauth_tokens WHERE id = ? AND user_id = ?').get(id, req.userId)
  if (!existing) return res.status(404).json({ error: 'Not found' })
  db.prepare('DELETE FROM crm_oauth_tokens WHERE id = ?').run(id)
  res.json({ success: true })
})

/* ---------- P7.5 team leaderboard ---------- */
app.get('/api/leaderboard', requireAuth, (req, res) => {
  const { period } = req.query
  const userWs = db.prepare(
    `SELECT w.id FROM workspaces w JOIN workspace_members m ON m.workspace_id = w.id WHERE m.user_id = ? AND m.joined_at IS NOT NULL LIMIT 1`
  ).get(req.userId)
  const wsId = userWs?.id
  if (!wsId) return res.json({ members: [], benchmark: {} })

  const rows = db.prepare(`
    SELECT u.email, u.id,
      COUNT(DISTINCT s.id) as scripts_generated,
      COUNT(DISTINCT CASE WHEN s.used_at IS NOT NULL THEN s.id END) as scripts_used,
      COUNT(DISTINCT CASE WHEN s.outcome = 'won' THEN s.id END) as wins,
      COUNT(DISTINCT CASE WHEN s.outcome = 'lost' THEN s.id END) as losses,
      COUNT(DISTINCT sc.id) as calls_scheduled,
      COUNT(DISTINCT CASE WHEN sc.status = 'completed' THEN sc.id END) as calls_completed,
      ROUND(AVG(CASE WHEN pf.rating IS NOT NULL THEN pf.rating END), 1) as avg_rating
    FROM users u
    JOIN workspace_members m ON m.user_id = u.id AND m.workspace_id = ?
    LEFT JOIN scripts s ON s.user_id = u.id ${period ? `AND strftime('%Y-%m', datetime(s.saved_at / 1000, 'unixepoch')) = ?` : ''}
    LEFT JOIN scheduled_calls sc ON sc.user_id = u.id ${period ? `AND strftime('%Y-%m', datetime(sc.scheduled_at / 1000, 'unixepoch')) = ?` : ''}
    LEFT JOIN prompt_feedback pf ON pf.user_id = u.id
    GROUP BY u.id
    ORDER BY wins DESC, scripts_used DESC
  `).all(...(period ? [wsId, period, period] : [wsId]))

  const totals = rows.length ? {
    avg_scripts: Math.round(rows.reduce((a, r) => a + r.scripts_generated, 0) / rows.length),
    avg_calls: Math.round(rows.reduce((a, r) => a + r.calls_completed, 0) / rows.length),
    avg_wins: Math.round(rows.reduce((a, r) => a + r.wins, 0) / rows.length),
    avg_rating: Math.round((rows.reduce((a, r) => a + (r.avg_rating || 0), 0) / rows.length) * 10) / 10,
  } : {}

  res.json({ members: rows, benchmark: totals })
})

app.get('/api/leaderboard/trends/:userId', requireAuth, (req, res) => {
  const { userId } = req.params
  const rows = db.prepare(`
    SELECT strftime('%Y-%m', datetime(saved_at / 1000, 'unixepoch')) as month,
      COUNT(*) as scripts,
      SUM(CASE WHEN outcome = 'won' THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN used_at IS NOT NULL THEN 1 ELSE 0 END) as calls
    FROM scripts
    WHERE user_id = ? AND saved_at IS NOT NULL
    GROUP BY month
    ORDER BY month DESC
    LIMIT 12
  `).all(userId)
  res.json({ trends: rows })
})

/* ---------- P8.1 workspace permissions ---------- */
app.get('/api/workspace/permissions', requireAuth, (req, res) => {
  const { role, workspace_id } = getUserWorkspaceRole(req.userId)
  const perms = getWorkspacePermissions(workspace_id, role)
  res.json({ role, permissions: perms })
})

app.get('/api/workspace/permissions/all', requireAuth, requirePermission('can_manage_team'), (req, res) => {
  const rows = db.prepare('SELECT * FROM workspace_permissions WHERE workspace_id = ?').all(req.workspaceId)
  res.json({ permissions: rows })
})

app.put('/api/workspace/permissions/:role', requireAuth, requirePermission('can_manage_team'), (req, res) => {
  const { role } = req.params
  const { can_generate_scripts, can_edit_products, can_delete_scripts, can_view_analytics, can_manage_team, can_override_prompts, can_export_data } = req.body
  const existing = db.prepare('SELECT id FROM workspace_permissions WHERE workspace_id = ? AND role = ?').get(req.workspaceId, role)
  if (existing) {
    db.prepare(`UPDATE workspace_permissions SET
      can_generate_scripts = ?, can_edit_products = ?, can_delete_scripts = ?,
      can_view_analytics = ?, can_manage_team = ?, can_override_prompts = ?, can_export_data = ?
      WHERE workspace_id = ? AND role = ?`).run(
      can_generate_scripts ? 1 : 0, can_edit_products ? 1 : 0, can_delete_scripts ? 1 : 0,
      can_view_analytics ? 1 : 0, can_manage_team ? 1 : 0, can_override_prompts ? 1 : 0, can_export_data ? 1 : 0,
      req.workspaceId, role
    )
  } else {
    db.prepare(`INSERT INTO workspace_permissions
      (workspace_id, role, can_generate_scripts, can_edit_products, can_delete_scripts, can_view_analytics, can_manage_team, can_override_prompts, can_export_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      req.workspaceId, role,
      can_generate_scripts ? 1 : 0, can_edit_products ? 1 : 0, can_delete_scripts ? 1 : 0,
      can_view_analytics ? 1 : 0, can_manage_team ? 1 : 0, can_override_prompts ? 1 : 0, can_export_data ? 1 : 0
    )
  }
  const row = db.prepare('SELECT * FROM workspace_permissions WHERE workspace_id = ? AND role = ?').get(req.workspaceId, role)
  res.json({ permission: row })
})

/* ---------- P8.2 audit logs ---------- */
app.get('/api/audit-logs', requireAuth, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 500)
  const offset = parseInt(req.query.offset) || 0
  const actionFilter = req.query.action || ''
  const rows = actionFilter
    ? db.prepare(`SELECT * FROM audit_logs WHERE user_id = ? AND action = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(req.userId, actionFilter, limit, offset)
    : db.prepare(`SELECT * FROM audit_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(req.userId, limit, offset)
  res.json({ logs: rows })
})

app.get('/api/audit-logs/workspace', requireAuth, requirePermission('can_manage_team'), (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 100, 500)
  const rows = db.prepare(`SELECT al.*, u.email FROM audit_logs al JOIN users u ON u.id = al.user_id WHERE al.workspace_id = ? ORDER BY al.created_at DESC LIMIT ?`).all(req.workspaceId, limit)
  res.json({ logs: rows })
})

/* ---------- P8.3 data export & backup ---------- */
app.get('/api/export/workspace', requireAuth, requirePermission('can_export_data'), (req, res) => {
  const { workspaceId } = req
  const products = db.prepare('SELECT * FROM products WHERE workspace_id = ?').all(workspaceId)
  const scripts = db.prepare('SELECT * FROM scripts WHERE workspace_id = ?').all(workspaceId)
  const staff = db.prepare('SELECT * FROM staff WHERE user_id IN (SELECT user_id FROM workspace_members WHERE workspace_id = ?)').all(workspaceId)
  const feedback = db.prepare('SELECT * FROM prompt_feedback WHERE product_id IN (SELECT id FROM products WHERE workspace_id = ?)').all(workspaceId)
  const components = db.prepare('SELECT * FROM components WHERE workspace_id = ?').all(workspaceId)
  const scheduled = db.prepare('SELECT * FROM scheduled_calls WHERE user_id IN (SELECT user_id FROM workspace_members WHERE workspace_id = ?)').all(workspaceId)
  const audit = db.prepare('SELECT * FROM audit_logs WHERE workspace_id = ? ORDER BY created_at DESC LIMIT 1000').all(workspaceId)
  const exportData = {
    exported_at: new Date().toISOString(),
    workspace_id: workspaceId,
    products, scripts, staff, feedback, components, scheduled, audit,
  }
  res.setHeader('Content-Disposition', 'attachment; filename="pitch-studio-export.json"')
  res.setHeader('Content-Type', 'application/json')
  res.json(exportData)
})

app.get('/api/export/workspace.csv', requireAuth, requirePermission('can_export_data'), (req, res) => {
  const { workspaceId } = req
  const scripts = db.prepare('SELECT s.*, p.name as product_name FROM scripts s LEFT JOIN products p ON p.id = s.product_id WHERE s.workspace_id = ?').all(workspaceId)
  const headers = ['id','product_name','method','call_type','duration','language','region','delivery','persona','outcome','created_at']
  const csv = [headers.join(','), ...scripts.map((s) => headers.map((h) => JSON.stringify(s[h] || '')).join(','))].join('\n')
  res.setHeader('Content-Disposition', 'attachment; filename="pitch-studio-scripts.csv"')
  res.setHeader('Content-Type', 'text/csv')
  res.send(csv)
})

/* ---------- P8.4 custom AI prompts ---------- */
app.get('/api/custom-prompts', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT id, name, type, is_default, created_at FROM custom_prompts WHERE user_id = ? ORDER BY created_at DESC').all(req.userId)
  res.json({ prompts: rows })
})

app.get('/api/custom-prompts/:id', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM custom_prompts WHERE id = ? AND user_id = ?').get(req.params.id, req.userId)
  if (!row) return res.status(404).json({ error: 'Not found' })
  res.json({ prompt: row })
})

app.post('/api/custom-prompts', requireAuth, requirePermission('can_override_prompts'), (req, res) => {
  const { name, type, prompt, is_default } = req.body
  if (!name || !type || !prompt) return res.status(400).json({ error: 'name, type, prompt required' })
  if (is_default) {
    db.prepare('UPDATE custom_prompts SET is_default = 0 WHERE user_id = ? AND type = ?').run(req.userId, type)
  }
  const result = db.prepare(`
    INSERT INTO custom_prompts (user_id, workspace_id, name, type, prompt, is_default)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.userId, req.workspaceId || null, name, type, prompt, is_default ? 1 : 0)
  const row = db.prepare('SELECT * FROM custom_prompts WHERE id = ?').get(result.lastInsertRowid)
  res.json({ prompt: row })
})

app.put('/api/custom-prompts/:id', requireAuth, requirePermission('can_override_prompts'), (req, res) => {
  const { id } = req.params
  const { name, type, prompt, is_default } = req.body
  const existing = db.prepare('SELECT * FROM custom_prompts WHERE id = ? AND user_id = ?').get(id, req.userId)
  if (!existing) return res.status(404).json({ error: 'Not found' })
  if (is_default) {
    db.prepare('UPDATE custom_prompts SET is_default = 0 WHERE user_id = ? AND type = ?').run(req.userId, type || existing.type)
  }
  db.prepare(`UPDATE custom_prompts SET name = ?, type = ?, prompt = ?, is_default = ? WHERE id = ?`).run(
    name || existing.name, type || existing.type, prompt || existing.prompt, is_default ? 1 : existing.is_default, id
  )
  const row = db.prepare('SELECT * FROM custom_prompts WHERE id = ?').get(id)
  res.json({ prompt: row })
})

app.delete('/api/custom-prompts/:id', requireAuth, requirePermission('can_override_prompts'), (req, res) => {
  const { id } = req.params
  const existing = db.prepare('SELECT id FROM custom_prompts WHERE id = ? AND user_id = ?').get(id, req.userId)
  if (!existing) return res.status(404).json({ error: 'Not found' })
  db.prepare('DELETE FROM custom_prompts WHERE id = ?').run(id)
  res.json({ success: true })
})

/* ---------- P8.5 usage dashboard & rate limits ---------- */
app.get('/api/usage', requireAuth, (req, res) => {
  const days = Math.min(parseInt(req.query.days) || 30, 365)
  const since = Date.now() - days * 24 * 60 * 60 * 1000
  const rows = db.prepare(`
    SELECT action, COUNT(*) as calls, SUM(tokens_used) as tokens, AVG(duration_ms) as avg_duration
    FROM usage_logs
    WHERE user_id = ? AND created_at >= datetime(? / 1000, 'unixepoch')
    GROUP BY action
  `).all(req.userId, since)
  const daily = db.prepare(`
    SELECT date(created_at) as day, COUNT(*) as calls, SUM(tokens_used) as tokens
    FROM usage_logs
    WHERE user_id = ? AND created_at >= datetime(? / 1000, 'unixepoch')
    GROUP BY day
    ORDER BY day DESC
    LIMIT ${days}
  `).all(req.userId, since)
  res.json({ summary: rows, daily })
})

app.get('/api/usage/workspace', requireAuth, requirePermission('can_view_analytics'), (req, res) => {
  const days = Math.min(parseInt(req.query.days) || 30, 365)
  const since = Date.now() - days * 24 * 60 * 60 * 1000
  const rows = db.prepare(`
    SELECT u.email, COUNT(*) as calls, SUM(ul.tokens_used) as tokens
    FROM usage_logs ul
    JOIN users u ON u.id = ul.user_id
    WHERE ul.user_id IN (SELECT user_id FROM workspace_members WHERE workspace_id = ?)
      AND ul.created_at >= datetime(? / 1000, 'unixepoch')
    GROUP BY ul.user_id
  `).all(req.workspaceId, since)
  res.json({ members: rows })
})

/* ---------- P9.1 competitor monitoring ---------- */

/* Competitor entities */
app.get('/api/competitors', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT c.*, p.name as product_name,
      (SELECT COUNT(*) FROM competitor_intel ci WHERE ci.competitor_id = c.id OR ci.competitor_name = c.name) as intel_count,
      (SELECT MAX(created_at) FROM competitor_intel ci WHERE ci.competitor_id = c.id OR ci.competitor_name = c.name) as last_intel_at
    FROM competitors c
    LEFT JOIN products p ON p.id = c.product_id
    WHERE c.user_id = ? AND c.status != 'archived'
    ORDER BY c.threat_level DESC, c.name ASC
  `).all(req.userId)
  res.json({ competitors: rows })
})

app.post('/api/competitors', requireAuth, (req, res) => {
  const { name, category, website, product_id, threat_level = 'low' } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'name required' })
  const { workspaceId } = getUserWorkspaceRole(req.userId)
  const result = db.prepare(`
    INSERT INTO competitors (user_id, workspace_id, product_id, name, category, website, threat_level, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
  `).run(req.userId, workspaceId || null, product_id || null, name.trim(), category || null, website || null, threat_level)
  const row = db.prepare('SELECT * FROM competitors WHERE id = ?').get(result.lastInsertRowid)
  res.json({ competitor: row })
})

app.put('/api/competitors/:id', requireAuth, (req, res) => {
  const { id } = req.params
  const existing = db.prepare('SELECT * FROM competitors WHERE id = ? AND user_id = ?').get(id, req.userId)
  if (!existing) return res.status(404).json({ error: 'Not found' })
  const { name, category, website, product_id, threat_level, status } = req.body
  db.prepare(`
    UPDATE competitors SET name = ?, category = ?, website = ?, product_id = ?, threat_level = ?, status = ?
    WHERE id = ?
  `).run(
    name ?? existing.name,
    category ?? existing.category,
    website ?? existing.website,
    product_id ?? existing.product_id,
    threat_level ?? existing.threat_level,
    status ?? existing.status,
    id
  )
  const row = db.prepare('SELECT * FROM competitors WHERE id = ?').get(id)
  res.json({ competitor: row })
})

app.delete('/api/competitors/:id', requireAuth, (req, res) => {
  const { id } = req.params
  const existing = db.prepare('SELECT id FROM competitors WHERE id = ? AND user_id = ?').get(id, req.userId)
  if (!existing) return res.status(404).json({ error: 'Not found' })
  db.prepare('DELETE FROM competitors WHERE id = ?').run(id)
  db.prepare('DELETE FROM competitor_sources WHERE competitor_id = ?').run(id)
  res.json({ success: true })
})

/* Sources */
app.get('/api/competitors/:id/sources', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM competitor_sources WHERE competitor_id = ? ORDER BY created_at DESC').all(req.params.id)
  res.json({ sources: rows })
})

app.post('/api/competitors/:id/sources', requireAuth, (req, res) => {
  const { source_type, source_url, label } = req.body
  const result = db.prepare(`
    INSERT INTO competitor_sources (competitor_id, source_type, source_url, label)
    VALUES (?, ?, ?, ?)
  `).run(req.params.id, source_type || 'manual', source_url || null, label || null)
  const row = db.prepare('SELECT * FROM competitor_sources WHERE id = ?').get(result.lastInsertRowid)
  res.json({ source: row })
})

app.delete('/api/competitors/:id/sources/:sid', requireAuth, (req, res) => {
  db.prepare('DELETE FROM competitor_sources WHERE id = ? AND competitor_id = ?').run(req.params.sid, req.params.id)
  res.json({ success: true })
})

/* Intel snapshots */
app.get('/api/competitors/:id/intel', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT * FROM competitor_intel
    WHERE competitor_id = ? OR competitor_name = (SELECT name FROM competitors WHERE id = ?)
    ORDER BY created_at DESC
  `).all(req.params.id, req.params.id)
  res.json({ intel: rows })
})

app.post('/api/competitor-intel/analyze', requireAuth, async (req, res) => {
  const { competitor_name, source_url, raw_content, product_id, competitor_id } = req.body
  if (!competitor_name || !raw_content) return res.status(400).json({ error: 'competitor_name and raw_content required' })

  try {
    const headers = { 'Content-Type': 'application/json' }
    if (OLLAMA_API_KEY) headers['Authorization'] = `Bearer ${OLLAMA_API_KEY}`

    const systemPrompt = `You are an elite competitive intelligence analyst. Analyze the following competitor content and return ONLY valid JSON with this exact structure:
{
  "ai_summary": "brief summary of their positioning and messaging",
  "threat_level": "low|medium|high",
  "key_messages": ["message 1", "message 2"],
  "threats": ["threat 1", "threat 2"],
  "suggested_responses": ["our counter-position 1", "our counter-position 2"],
  "positioning": {
    "target_audience": "who they target",
    "value_proposition": "their core promise",
    "differentiators": ["diff 1", "diff 2"]
  },
  "pricing_intel": {
    "pricing_model": "description",
    "price_range": "range if known",
    "free_tier": true|false
  },
  "feature_intel": {
    "core_features": ["feature 1", "feature 2"],
    "recent_additions": ["new feature 1"]
  },
  "battle_card": {
    "why_customers_choose_them": ["reason 1", "reason 2"],
    "where_they_are_stronger": ["area 1", "area 2"],
    "where_we_are_stronger": ["area 1", "area 2"],
    "common_objection": "We already use them.",
    "recommended_response": "Exact wording sales should use",
    "do_not_say": ["phrase 1", "phrase 2"],
    "ask_instead": ["question 1", "question 2"]
  },
  "changes_detected": [
    { "type": "pricing|feature|messaging|positioning", "description": "what changed", "impact": "low|medium|high" }
  ]
}`

    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: OLLAMA_MODEL || 'glm-5.2:cloud',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: raw_content },
        ],
        stream: false,
      }),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      return res.status(response.status).json({ error: text || `Upstream ${response.status}` })
    }

    let data = await response.json()
    if (data.choices && data.choices[0]?.message?.content) {
      data = { message: { content: data.choices[0].message.content } }
    }

    const generated = data.message?.content || ''
    let parsed = {}
    try {
      const clean = generated.replace(/```json/gi, '').replace(/```/g, '').trim()
      parsed = JSON.parse(clean.slice(clean.indexOf('{')))
    } catch (_) {
      parsed = { raw: generated }
    }

    const { workspaceId } = getUserWorkspaceRole(req.userId)
    const threatLevel = parsed.threat_level || 'low'

    /* Upsert competitor entity if not linked */
    let compId = competitor_id || null
    if (!compId) {
      const existing = db.prepare('SELECT id FROM competitors WHERE user_id = ? AND name = ?').get(req.userId, competitor_name)
      if (existing) {
        compId = existing.id
        db.prepare('UPDATE competitors SET threat_level = ? WHERE id = ?').run(threatLevel, compId)
      }
    }

    const result = db.prepare(`
      INSERT INTO competitor_intel (user_id, workspace_id, competitor_id, competitor_name, source_url, raw_content, ai_summary, key_messages, threats, suggested_responses, threat_level, product_id, raw_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.userId,
      workspaceId || null,
      compId,
      competitor_name,
      source_url || '',
      raw_content,
      parsed.ai_summary || null,
      Array.isArray(parsed.key_messages) ? JSON.stringify(parsed.key_messages) : null,
      Array.isArray(parsed.threats) ? JSON.stringify(parsed.threats) : null,
      Array.isArray(parsed.suggested_responses) ? JSON.stringify(parsed.suggested_responses) : null,
      threatLevel,
      product_id || null,
      JSON.stringify(parsed)
    )

    const row = db.prepare('SELECT * FROM competitor_intel WHERE id = ?').get(result.lastInsertRowid)
    res.json({ intel: row, generated: parsed })
  } catch (err) {
    console.error('[Competitor intel] Error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/competitor-intel/:id', requireAuth, (req, res) => {
  const { id } = req.params
  const existing = db.prepare('SELECT id FROM competitor_intel WHERE id = ? AND user_id = ?').get(id, req.userId)
  if (!existing) return res.status(404).json({ error: 'Not found' })
  db.prepare('DELETE FROM competitor_intel WHERE id = ?').run(id)
  res.json({ success: true })
})

/* ---------- P9.2 predictive deal scoring ---------- */
app.post('/api/deal-scores/analyze', requireAuth, async (req, res) => {
  const { transcript, script_id, call_id } = req.body
  if (!transcript) return res.status(400).json({ error: 'transcript required' })

  try {
    const headers = { 'Content-Type': 'application/json' }
    if (OLLAMA_API_KEY) headers['Authorization'] = `Bearer ${OLLAMA_API_KEY}`

    // Fetch winning patterns for context
    const patterns = db.prepare(`
      SELECT method, call_type, COUNT(*) as total,
        SUM(CASE WHEN outcome = 'won' THEN 1 ELSE 0 END) as wins
      FROM scripts s
      WHERE s.user_id = ? AND s.outcome IS NOT NULL
      GROUP BY method, call_type
      ORDER BY wins DESC
      LIMIT 5
    `).all(req.userId)

    const systemPrompt = `You are a sales deal scoring AI. Analyze this call transcript and return ONLY valid JSON:
{
  "close_probability": 0.0 to 1.0,
  "tone_score": 1-100,
  "objection_pattern": "brief description of objection handling quality",
  "win_pattern_match": 0.0 to 1.0,
  "need_score": 1-100,
  "authority_score": 1-100,
  "budget_score": 1-100,
  "timeline_score": 1-100,
  "confidence": "low|medium|high",
  "risk_factors": ["risk 1", "risk 2"],
  "recommendations": ["actionable recommendation 1", "actionable recommendation 2"],
  "next_action": "single most important next step",
  "ai_summary": "2-3 sentence summary"
}`

    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: OLLAMA_MODEL || 'glm-5.2:cloud',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Winning patterns: ${JSON.stringify(patterns)}\n\nTranscript:\n${transcript}` },
        ],
        stream: false,
      }),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      return res.status(response.status).json({ error: text || `Upstream ${response.status}` })
    }

    let data = await response.json()
    if (data.choices && data.choices[0]?.message?.content) {
      data = { message: { content: data.choices[0].message.content } }
    }

    const generated = data.message?.content || ''
    let parsed = {}
    try {
      const clean = generated.replace(/```json/gi, '').replace(/```/g, '').trim()
      parsed = JSON.parse(clean.slice(clean.indexOf('{')))
    } catch (_) {
      parsed = { raw: generated }
    }

    const result = db.prepare(`
      INSERT INTO deal_scores (user_id, script_id, call_id, transcript, close_probability, tone_score, objection_pattern, win_pattern_match, risk_factors, recommendations, ai_summary, need_score, authority_score, budget_score, timeline_score, confidence, next_action)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.userId,
      script_id || null,
      call_id || null,
      transcript,
      parsed.close_probability || 0,
      parsed.tone_score || null,
      parsed.objection_pattern || null,
      parsed.win_pattern_match || 0,
      Array.isArray(parsed.risk_factors) ? JSON.stringify(parsed.risk_factors) : null,
      Array.isArray(parsed.recommendations) ? JSON.stringify(parsed.recommendations) : null,
      parsed.ai_summary || null,
      parsed.need_score || null,
      parsed.authority_score || null,
      parsed.budget_score || null,
      parsed.timeline_score || null,
      parsed.confidence || 'medium',
      parsed.next_action || null
    )

    const row = db.prepare('SELECT * FROM deal_scores WHERE id = ?').get(result.lastInsertRowid)
    res.json({ score: row, generated: parsed })
  } catch (err) {
    console.error('[Deal scoring] Error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/deal-scores', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM deal_scores WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(req.userId)
  res.json({ scores: rows })
})

app.delete('/api/deal-scores/:id', requireAuth, (req, res) => {
  const { id } = req.params
  const existing = db.prepare('SELECT id FROM deal_scores WHERE id = ? AND user_id = ?').get(id, req.userId)
  if (!existing) return res.status(404).json({ error: 'Not found' })
  db.prepare('DELETE FROM deal_scores WHERE id = ?').run(id)
  res.json({ success: true })
})

/* ---------- P9.3 organizations ---------- */
app.get('/api/organization', requireAuth, (req, res) => {
  const org = db.prepare('SELECT * FROM organizations WHERE owner_user_id = ?').get(req.userId)
  if (!org) return res.json({ organization: null })

  const workspaces = db.prepare(`
    SELECT w.*, COUNT(m.user_id) as member_count
    FROM workspaces w
    LEFT JOIN workspace_members m ON m.workspace_id = w.id AND m.joined_at IS NOT NULL
    WHERE w.id IN (SELECT workspace_id FROM workspace_members WHERE user_id = ?)
    GROUP BY w.id
  `).all(req.userId)

  res.json({ organization: org, workspaces })
})

app.post('/api/organization', requireAuth, (req, res) => {
  const { name, billing_tier } = req.body
  if (!name) return res.status(400).json({ error: 'name required' })

  const existing = db.prepare('SELECT id FROM organizations WHERE owner_user_id = ?').get(req.userId)
  if (existing) return res.status(409).json({ error: 'Organization already exists' })

  const result = db.prepare('INSERT INTO organizations (name, owner_user_id, billing_tier) VALUES (?, ?, ?)').run(name, req.userId, billing_tier || 'free')
  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(result.lastInsertRowid)
  res.json({ organization: org })
})

app.put('/api/organization', requireAuth, (req, res) => {
  const { name, billing_tier } = req.body
  const org = db.prepare('SELECT * FROM organizations WHERE owner_user_id = ?').get(req.userId)
  if (!org) return res.status(404).json({ error: 'Organization not found' })

  if (name) db.prepare('UPDATE organizations SET name = ? WHERE id = ?').run(name, org.id)
  if (billing_tier) db.prepare('UPDATE organizations SET billing_tier = ? WHERE id = ?').run(billing_tier, org.id)

  const updated = db.prepare('SELECT * FROM organizations WHERE id = ?').get(org.id)
  res.json({ organization: updated })
})

/* ---------- P9.4 script refinement ---------- */
app.post('/api/script-refinements/generate', requireAuth, async (req, res) => {
  const { script_id, segments_json, goal, focus_areas } = req.body
  if (!script_id || !segments_json) return res.status(400).json({ error: 'script_id and segments_json required' })

  try {
    const headers = { 'Content-Type': 'application/json' }
    if (OLLAMA_API_KEY) headers['Authorization'] = `Bearer ${OLLAMA_API_KEY}`

    // Fetch script metadata for denormalization
    const script = db.prepare('SELECT product_id, method, call_type, language, (SELECT name FROM products WHERE id = scripts.product_id) as product_name FROM scripts WHERE id = ? AND user_id = ?').get(script_id, req.userId)
    const productName = script?.product_name || 'Unknown'
    const method = script?.method || ''
    const callType = script?.call_type || ''
    const language = script?.language || ''

    // Compute previous score and version number
    const prior = db.prepare('SELECT improvement_score, version_number FROM script_refinements WHERE script_id = ? AND user_id = ? ORDER BY version_number DESC LIMIT 1').get(script_id, req.userId)
    const previousScore = prior?.improvement_score || null
    const versionNumber = (prior?.version_number || 0) + 1

    // Fetch winning patterns
    const patterns = db.prepare(`
      SELECT method, call_type, COUNT(*) as total,
        SUM(CASE WHEN outcome = 'won' THEN 1 ELSE 0 END) as wins
      FROM scripts
      WHERE user_id = ? AND outcome = 'won'
      GROUP BY method, call_type
      ORDER BY wins DESC
      LIMIT 3
    `).all(req.userId)

    const focusHint = Array.isArray(focus_areas) && focus_areas.length > 0
      ? `Focus especially on these areas: ${focus_areas.join(', ')}.`
      : ''
    const goalHint = goal ? `The user's refinement goal is: ${goal}.` : ''

    const systemPrompt = `You are an elite sales script editor. Analyze the following script segments and winning patterns, then return ONLY valid JSON with:
{
  "refined_segments_json": "the improved segments JSON string",
  "changes_made": [
    {"area": "Opening", "what": "...", "why": "...", "impact": "..."},
    {"area": "Discovery", "what": "...", "why": "...", "impact": "..."}
  ],
  "improvement_score": 1-100,
  "dimension_scores": {"opening": 0-100, "discovery": 0-100, "value_prop": 0-100, "objections": 0-100, "closing": 0-100},
  "ai_explanation": "2-3 sentences explaining what improved and why",
  "top_opportunities": [
    {"area": "Objection handling", "impact": "High", "suggestion": "..."}
  ]
}`

    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: OLLAMA_MODEL || 'glm-5.2:cloud',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `${goalHint}\n${focusHint}\nWinning patterns: ${JSON.stringify(patterns)}\n\nCurrent segments JSON:\n${segments_json}` },
        ],
        stream: false,
      }),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      return res.status(response.status).json({ error: text || `Upstream ${response.status}` })
    }

    let data = await response.json()
    if (data.choices && data.choices[0]?.message?.content) {
      data = { message: { content: data.choices[0].message.content } }
    }

    const generated = data.message?.content || ''
    let parsed = {}
    try {
      const clean = generated.replace(/```json/gi, '').replace(/```/g, '').trim()
      parsed = JSON.parse(clean.slice(clean.indexOf('{')))
    } catch (_) {
      parsed = { raw: generated }
    }

    const dimScores = parsed.dimension_scores || {}
    const changes = Array.isArray(parsed.changes_made)
      ? JSON.stringify(parsed.changes_made)
      : null

    const result = db.prepare(`
      INSERT INTO script_refinements (
        user_id, script_id, original_segments_json, refined_segments_json,
        changes_made, improvement_score, ai_explanation,
        dimension_scores_json, previous_score, goal, focus_areas_json, version_number,
        product_name, method, call_type, language
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.userId, script_id, segments_json,
      parsed.refined_segments_json || segments_json,
      changes, parsed.improvement_score || null, parsed.ai_explanation || null,
      JSON.stringify(dimScores), previousScore,
      goal || null, Array.isArray(focus_areas) ? JSON.stringify(focus_areas) : null,
      versionNumber, productName, method, callType, language
    )

    const row = db.prepare('SELECT * FROM script_refinements WHERE id = ?').get(result.lastInsertRowid)
    res.json({ refinement: row, generated: parsed })
  } catch (err) {
    console.error('[Script refinement] Error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/script-refinements', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM script_refinements WHERE user_id = ? ORDER BY created_at DESC').all(req.userId)
  res.json({ refinements: rows })
})

app.get('/api/script-refinements/script/:scriptId', requireAuth, (req, res) => {
  const { scriptId } = req.params
  const rows = db.prepare('SELECT * FROM script_refinements WHERE user_id = ? AND script_id = ? ORDER BY version_number DESC').all(req.userId, scriptId)
  res.json({ refinements: rows })
})

app.delete('/api/script-refinements/:id', requireAuth, (req, res) => {
  const { id } = req.params
  const existing = db.prepare('SELECT id FROM script_refinements WHERE id = ? AND user_id = ?').get(id, req.userId)
  if (!existing) return res.status(404).json({ error: 'Not found' })
  db.prepare('DELETE FROM script_refinements WHERE id = ?').run(id)
  res.json({ success: true })
})

/* ---------- P9.5 voice recordings (TTS) ---------- */
app.get('/api/voice-recordings', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM voice_recordings WHERE user_id = ? ORDER BY created_at DESC').all(req.userId)
  res.json({ recordings: rows })
})

app.post('/api/voice-recordings', requireAuth, (req, res) => {
  const { script_id, segment_index, text_content, voice_id } = req.body
  if (!text_content) return res.status(400).json({ error: 'text_content required' })

  const result = db.prepare(`
    INSERT INTO voice_recordings (user_id, script_id, segment_index, text_content, voice_id, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.userId, script_id || null, segment_index ?? -1, text_content, voice_id || 'default', 'pending')

  const row = db.prepare('SELECT * FROM voice_recordings WHERE id = ?').get(result.lastInsertRowid)
  res.json({ recording: row })
})

app.put('/api/voice-recordings/:id/status', requireAuth, (req, res) => {
  const { id } = req.params
  const { status, audio_url, duration_seconds } = req.body
  const existing = db.prepare('SELECT * FROM voice_recordings WHERE id = ? AND user_id = ?').get(id, req.userId)
  if (!existing) return res.status(404).json({ error: 'Not found' })

  const updates = []
  const values = []
  if (status !== undefined) { updates.push('status = ?'); values.push(status) }
  if (audio_url !== undefined) { updates.push('audio_url = ?'); values.push(audio_url) }
  if (duration_seconds !== undefined) { updates.push('duration_seconds = ?'); values.push(duration_seconds) }
  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' })
  values.push(id)

  db.prepare(`UPDATE voice_recordings SET ${updates.join(', ')} WHERE id = ?`).run(...values)
  const row = db.prepare('SELECT * FROM voice_recordings WHERE id = ?').get(id)
  res.json({ recording: row })
})

app.delete('/api/voice-recordings/:id', requireAuth, (req, res) => {
  const { id } = req.params
  const existing = db.prepare('SELECT id FROM voice_recordings WHERE id = ? AND user_id = ?').get(id, req.userId)
  if (!existing) return res.status(404).json({ error: 'Not found' })
  db.prepare('DELETE FROM voice_recordings WHERE id = ?').run(id)
  res.json({ success: true })
})

/* ---------- P10.1 auto-script optimization ---------- */

function getAutoOptOverview(userId) {
  const totalCalls = db.prepare(`
    SELECT COUNT(*) as c FROM scripts WHERE user_id = ? AND outcome IS NOT NULL
  `).get(userId)?.c || 0

  const scriptsMonitored = db.prepare(`
    SELECT COUNT(DISTINCT script_id) as c FROM auto_optimizations WHERE user_id = ?
  `).get(userId)?.c || 0

  const lastOpt = db.prepare(`
    SELECT MAX(created_at) as ts FROM auto_optimizations WHERE user_id = ?
  `).get(userId)?.ts

  const lastImprovement = db.prepare(`
    SELECT MAX(created_at) as ts FROM auto_optimizations WHERE user_id = ? AND applied = 1
  `).get(userId)?.ts

  const wins = db.prepare(`
    SELECT SUM(win_count) as c FROM auto_optimizations WHERE user_id = ?
  `).get(userId)?.c || 0

  const losses = db.prepare(`
    SELECT SUM(loss_count) as c FROM auto_optimizations WHERE user_id = ?
  `).get(userId)?.c || 0

  const pendingCount = db.prepare(`
    SELECT COUNT(*) as c FROM auto_optimizations WHERE user_id = ? AND applied = 0
  `).get(userId)?.c || 0

  return {
    total_calls_analyzed: totalCalls,
    scripts_monitored: scriptsMonitored,
    wins: wins,
    losses: losses,
    pending_recommendations: pendingCount,
    last_analyzed_at: lastOpt || null,
    last_improvement_at: lastImprovement || null,
  }
}

app.get('/api/auto-optimizations/overview', requireAuth, (req, res) => {
  res.json({ overview: getAutoOptOverview(req.userId) })
})

app.get('/api/auto-optimizations', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM auto_optimizations WHERE user_id = ? ORDER BY created_at DESC').all(req.userId)
  res.json({ optimizations: rows })
})

app.post('/api/auto-optimizations/generate', requireAuth, async (req, res) => {
  const { script_id } = req.body
  try {
    // Get win/loss data for this script
    const winLoss = db.prepare(`
      SELECT
        SUM(CASE WHEN outcome = 'won' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN outcome = 'lost' THEN 1 ELSE 0 END) as losses,
        COUNT(*) as total
      FROM scripts
      WHERE user_id = ? AND id = ?
    `).get(req.userId, script_id || 0)

    // Get current script segments
    const script = db.prepare('SELECT segments_json, method, call_type FROM scripts WHERE id = ? AND user_id = ?').get(script_id, req.userId)
    const segments = script?.segments_json || '[]'
    let parsedSegments = []
    try { parsedSegments = JSON.parse(segments); } catch (_) {}
    const firstSegment = parsedSegments[0]?.content || parsedSegments[0]?.text || ''

    const cfg = getUserChatConfig(req)
    const systemPrompt = `You are an elite sales optimization AI. Analyze the script's win/loss data and current opening segment, then suggest ONE specific improvement.
Return ONLY valid JSON with these fields:
{
  "suggestion": "short title of the change",
  "impact_level": "high|medium|low",
  "current_text": "the current underperforming text",
  "recommended_text": "the improved text",
  "why": "explanation of why this change should improve results, citing patterns from winning vs losing calls",
  "evidence": { "wins": number, "losses": number, "pattern": "description of pattern observed" },
  "confidence_score": 0.0 to 1.0,
  "measured_uplift": "estimated conversion improvement e.g. +8-12%"
}`

    const response = await fetchAIModel(cfg, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Script: ${script?.method || ''} / ${script?.call_type || ''}\nWins: ${winLoss?.wins || 0}, Losses: ${winLoss?.losses || 0}\nCurrent opening: ${firstSegment}` },
    ], false)

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      return res.status(response.status).json({ error: text || `Upstream ${response.status}` })
    }

    const upstreamData = await response.json()
    const normalized = normalizeChatResponse(cfg.provider, upstreamData)
    const generated = normalized.message?.content || ''
    let parsed = {}
    try {
      const clean = generated.replace(/```json/gi, '').replace(/```/g, '').trim()
      parsed = JSON.parse(clean.slice(clean.indexOf('{')))
    } catch (_) {
      parsed = { raw: generated }
    }

    const { workspaceId } = getUserWorkspaceRole(req.userId)
    const now = new Date()
    const weekPeriod = `${now.getFullYear()}-W${Math.ceil((now.getDate() + 6 - now.getDay()) / 7)}`

    const result = db.prepare(`
      INSERT INTO auto_optimizations (
        user_id, workspace_id, script_id, week_period,
        win_count, loss_count, suggestion, suggested_segments_json, confidence_score,
        impact_level, current_text, recommended_text, why, evidence_json, script_version, measured_uplift
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.userId,
      workspaceId || null,
      script_id || null,
      weekPeriod,
      winLoss?.wins || 0,
      winLoss?.losses || 0,
      parsed.suggestion || 'No suggestion generated',
      parsed.suggested_segments_json || segments,
      parsed.confidence_score || 0,
      parsed.impact_level || 'medium',
      parsed.current_text || firstSegment || '',
      parsed.recommended_text || '',
      parsed.why || '',
      JSON.stringify(parsed.evidence || { wins: winLoss?.wins || 0, losses: winLoss?.losses || 0 }),
      'v1.0',
      parsed.measured_uplift || ''
    )

    const row = db.prepare('SELECT * FROM auto_optimizations WHERE id = ?').get(result.lastInsertRowid)
    res.json({ optimization: row, generated: parsed })
  } catch (err) {
    console.error('[Auto optimization] Error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/auto-optimizations/:id/apply', requireAuth, (req, res) => {
  const { id } = req.params
  const opt = db.prepare('SELECT * FROM auto_optimizations WHERE id = ? AND user_id = ?').get(id, req.userId)
  if (!opt) return res.status(404).json({ error: 'Not found' })
  const user = db.prepare('SELECT email FROM users WHERE id = ?').get(req.userId)
  db.prepare('UPDATE auto_optimizations SET applied = 1, approved_by = ? WHERE id = ?').run(user?.email || '', id)
  res.json({ success: true })
})

app.delete('/api/auto-optimizations/:id', requireAuth, (req, res) => {
  const { id } = req.params
  const existing = db.prepare('SELECT id FROM auto_optimizations WHERE id = ? AND user_id = ?').get(id, req.userId)
  if (!existing) return res.status(404).json({ error: 'Not found' })
  db.prepare('DELETE FROM auto_optimizations WHERE id = ?').run(id)
  res.json({ success: true })
})

/* ---------- P10.2 conversation intelligence ---------- */

app.get('/api/heatmaps', requireAuth, (req, res) => {
  const category = req.query.category || ''
  const source = req.query.source || ''
  let sql = 'SELECT * FROM conversation_heatmaps WHERE user_id = ?'
  const params = [req.userId]
  if (category) { sql += ' AND category = ?'; params.push(category) }
  if (source) { sql += ' AND source = ?'; params.push(source) }
  sql += ' ORDER BY win_correlation DESC LIMIT 200'
  const rows = db.prepare(sql).all(...params)
  res.json({ heatmaps: rows })
})

app.post('/api/heatmaps/generate', requireAuth, async (req, res) => {
  const { transcripts } = req.body
  if (!Array.isArray(transcripts) || transcripts.length === 0) {
    return res.status(400).json({ error: 'transcripts array required' })
  }

  try {
    const headers = { 'Content-Type': 'application/json' }
    if (OLLAMA_API_KEY) headers['Authorization'] = `Bearer ${OLLAMA_API_KEY}`

    const systemPrompt = `You are a conversation intelligence analyst. Analyze these sales call transcripts and identify phrases that correlate with wins vs losses. Return ONLY valid JSON:
{
  "phrases": [
    {
      "phrase": "exact phrase",
      "category": "opening|value_prop|objection|closing|discovery|rapport",
      "win_correlation": -1.0 to 1.0,
      "loss_correlation": -1.0 to 1.0,
      "usage_count": number
    }
  ]
}`

    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: OLLAMA_MODEL || 'glm-5.2:cloud',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: transcripts.join('\n---\n') },
        ],
        stream: false,
      }),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      return res.status(response.status).json({ error: text || `Upstream ${response.status}` })
    }

    let data = await response.json()
    if (data.choices && data.choices[0]?.message?.content) {
      data = { message: { content: data.choices[0].message.content } }
    }

    const generated = data.message?.content || ''
    let parsed = {}
    try {
      const clean = generated.replace(/```json/gi, '').replace(/```/g, '').trim()
      parsed = JSON.parse(clean.slice(clean.indexOf('{')))
    } catch (_) {
      parsed = { raw: generated }
    }

    const { workspaceId } = getUserWorkspaceRole(req.userId)
    const phrases = Array.isArray(parsed.phrases) ? parsed.phrases : []

    for (const p of phrases) {
      db.prepare(`
        INSERT INTO conversation_heatmaps (user_id, workspace_id, phrase, category, win_correlation, loss_correlation, usage_count, source)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'manual')
      `).run(
        req.userId,
        workspaceId || null,
        p.phrase || '',
        p.category || 'general',
        p.win_correlation || 0,
        p.loss_correlation || 0,
        p.usage_count || 0
      )
    }

    const rows = db.prepare('SELECT * FROM conversation_heatmaps WHERE user_id = ? AND source = ? ORDER BY win_correlation DESC').all(req.userId, 'manual')
    res.json({ heatmaps: rows, generated: parsed })
  } catch (err) {
    console.error('[Heatmaps] Error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

/* ---------- P10.2b: Conversation Intelligence (script-driven) ---------- */

app.post('/api/conversation-intelligence/analyze-scripts', requireAuth, async (req, res) => {
  try {
    // Fetch user's scripts that have outcomes
    const scripts = db.prepare(`
      SELECT id, product_id, method, call_type, outcome, segments_json, created_at
      FROM scripts
      WHERE user_id = ? AND outcome IS NOT NULL AND outcome != 'pending'
      ORDER BY created_at DESC
      LIMIT 100
    `).all(req.userId)

    if (scripts.length === 0) {
      return res.status(400).json({ error: 'No calls with outcomes found. Mark some scripts as won or lost first.' })
    }

    // Build transcript-like content from segments with outcome labels
    const scriptPayloads = scripts.map((s) => {
      let segments = []
      try { segments = JSON.parse(s.segments_json || '[]') } catch { segments = [] }
      const text = segments.map((seg) => seg.content || seg.text || '').filter(Boolean).join('\n')
      return {
        id: s.id,
        product_id: s.product_id,
        method: s.method,
        call_type: s.call_type,
        outcome: s.outcome,
        text: text.slice(0, 2000), // cap per script to avoid token overflow
      }
    }).filter((s) => s.text.length > 50)

    if (scriptPayloads.length === 0) {
      return res.status(400).json({ error: 'Scripts found but segment content is empty.' })
    }

    const headers = { 'Content-Type': 'application/json' }
    if (OLLAMA_API_KEY) headers['Authorization'] = `Bearer ${OLLAMA_API_KEY}`

    const systemPrompt = `You are a conversation intelligence analyst for a sales team. I will provide you with sales script/call content labeled with their outcomes (won or lost).

Your task: Identify specific phrases, questions, or approaches that correlate with wins versus losses. Focus on actual language patterns, not generic advice.

Return ONLY valid JSON with this structure:
{
  "phrases": [
    {
      "phrase": "the exact phrase or short sentence",
      "category": "opening|value_prop|objection|closing|discovery|rapport",
      "win_count": number of winning calls containing this,
      "loss_count": number of losing calls containing this,
      "total_count": total occurrences,
      "evidence": [1, 2, 3] // array of script IDs where this phrase appears
    }
  ],
  "summary": {
    "total_calls_analyzed": number,
    "winning_calls": number,
    "losing_calls": number,
    "top_insight": "One-sentence summary of the strongest pattern"
  }
}

Rules:
- Only include phrases that appear in at least 2 calls
- Be specific: "Would you be open to..." is better than "ask questions"
- evidence array should contain actual script IDs from the input
- categories must be exactly: opening, value_prop, objection, closing, discovery, rapport`

    const userContent = scriptPayloads.map((s) =>
      `--- Script ID: ${s.id} | Outcome: ${s.outcome} | Method: ${s.method} | Type: ${s.call_type} ---\n${s.text}`
    ).join('\n\n')

    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: OLLAMA_MODEL || 'glm-5.2:cloud',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        stream: false,
      }),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      return res.status(response.status).json({ error: text || `Upstream ${response.status}` })
    }

    let data = await response.json()
    if (data.choices && data.choices[0]?.message?.content) {
      data = { message: { content: data.choices[0].message.content } }
    }

    const generated = data.message?.content || ''
    let parsed = {}
    try {
      const clean = generated.replace(/```json/gi, '').replace(/```/g, '').trim()
      parsed = JSON.parse(clean.slice(clean.indexOf('{')))
    } catch (_) {
      parsed = { raw: generated }
    }

    const { workspaceId } = getUserWorkspaceRole(req.userId)
    const phrases = Array.isArray(parsed.phrases) ? parsed.phrases : []

    // Clear old script_analysis entries for this user
    db.prepare("DELETE FROM conversation_heatmaps WHERE user_id = ? AND source = 'script_analysis'").run(req.userId)

    for (const p of phrases) {
      const winCount = p.win_count || 0
      const lossCount = p.loss_count || 0
      const total = p.total_count || (winCount + lossCount) || 1
      const winRate = total > 0 ? winCount / total : 0
      const winCorrelation = (winRate * 2) - 1 // map 0..1 to -1..1

      db.prepare(`
        INSERT INTO conversation_heatmaps
        (user_id, workspace_id, phrase, category, win_correlation, loss_correlation, usage_count, win_count, loss_count, evidence_json, source)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'script_analysis')
      `).run(
        req.userId,
        workspaceId || null,
        p.phrase || '',
        p.category || 'general',
        winCorrelation,
        -winCorrelation,
        total,
        winCount,
        lossCount,
        JSON.stringify(Array.isArray(p.evidence) ? p.evidence : [])
      )
    }

    const rows = db.prepare("SELECT * FROM conversation_heatmaps WHERE user_id = ? AND source = 'script_analysis' ORDER BY win_correlation DESC").all(req.userId)
    res.json({ heatmaps: rows, summary: parsed.summary || {}, generated: parsed })
  } catch (err) {
    console.error('[Conversation Intelligence] Error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/conversation-intelligence/overview', requireAuth, (req, res) => {
  try {
    // Count scripts with outcomes
    const outcomes = db.prepare(`
      SELECT outcome, COUNT(*) as c FROM scripts WHERE user_id = ? AND outcome IS NOT NULL GROUP BY outcome
    `).all(req.userId)
    const wins = outcomes.find((o) => o.outcome === 'won')?.c || 0
    const losses = outcomes.find((o) => o.outcome === 'lost')?.c || 0
    const noDeals = outcomes.find((o) => o.outcome === 'no_deal')?.c || 0
    const totalCalls = wins + losses + noDeals

    // Phrase stats from analysis
    const phrases = db.prepare(`
      SELECT COUNT(*) as c, AVG(win_correlation) as avg_corr
      FROM conversation_heatmaps
      WHERE user_id = ? AND source = 'script_analysis'
    `).get(req.userId)

    const topWin = db.prepare(`
      SELECT phrase, win_correlation, win_count, loss_count, usage_count
      FROM conversation_heatmaps
      WHERE user_id = ? AND source = 'script_analysis' AND win_correlation > 0
      ORDER BY win_correlation DESC LIMIT 1
    `).get(req.userId)

    const topLoss = db.prepare(`
      SELECT phrase, win_correlation, win_count, loss_count, usage_count
      FROM conversation_heatmaps
      WHERE user_id = ? AND source = 'script_analysis' AND win_correlation < 0
      ORDER BY win_correlation ASC LIMIT 1
    `).get(req.userId)

    // Category breakdown
    const categories = db.prepare(`
      SELECT category,
        COUNT(*) as phrase_count,
        AVG(win_correlation) as avg_corr,
        SUM(win_count) as total_wins,
        SUM(loss_count) as total_losses
      FROM conversation_heatmaps
      WHERE user_id = ? AND source = 'script_analysis'
      GROUP BY category
    `).all(req.userId)

    res.json({
      totalCalls,
      wins,
      losses,
      noDeals,
      winRate: totalCalls > 0 ? Math.round((wins / totalCalls) * 100) : 0,
      phrasesAnalyzed: phrases?.c || 0,
      avgCorrelation: phrases?.avg_corr ? parseFloat(phrases.avg_corr.toFixed(2)) : 0,
      topWinningPhrase: topWin || null,
      topLosingPhrase: topLoss || null,
      categoryBreakdown: categories || [],
      hasData: totalCalls > 0,
    })
  } catch (err) {
    console.error('[CI Overview] Error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/conversation-intelligence/calls', requireAuth, (req, res) => {
  try {
    const { product_id, outcome } = req.query
    let sql = `
      SELECT s.id, s.product_id, s.method, s.call_type, s.duration, s.outcome, s.notes, s.created_at, s.saved_at,
        p.name as product_name
      FROM scripts s
      LEFT JOIN products p ON s.product_id = p.id
      WHERE s.user_id = ? AND s.outcome IS NOT NULL
    `
    const params = [req.userId]
    if (product_id) { sql += ' AND s.product_id = ?'; params.push(product_id) }
    if (outcome) { sql += ' AND s.outcome = ?'; params.push(outcome) }
    sql += ' ORDER BY s.saved_at DESC LIMIT 200'
    const rows = db.prepare(sql).all(...params)
    res.json({ calls: rows })
  } catch (err) {
    console.error('[CI Calls] Error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

/* ---------- P10.3 AI sales assistant chat ---------- */
app.get('/api/chat/sessions', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM chat_sessions WHERE user_id = ? ORDER BY created_at DESC').all(req.userId)
  res.json({ sessions: rows })
})

app.post('/api/chat/sessions', requireAuth, (req, res) => {
  const { title } = req.body
  const result = db.prepare('INSERT INTO chat_sessions (user_id, title) VALUES (?, ?)').run(req.userId, title || 'New Chat')
  const row = db.prepare('SELECT * FROM chat_sessions WHERE id = ?').get(result.lastInsertRowid)
  res.json({ session: row })
})

app.delete('/api/chat/sessions/:id', requireAuth, (req, res) => {
  const { id } = req.params
  const existing = db.prepare('SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?').get(id, req.userId)
  if (!existing) return res.status(404).json({ error: 'Not found' })
  db.prepare('DELETE FROM chat_messages WHERE session_id = ?').run(id)
  db.prepare('DELETE FROM chat_sessions WHERE id = ?').run(id)
  res.json({ success: true })
})

app.get('/api/chat/sessions/:id/messages', requireAuth, (req, res) => {
  const { id } = req.params
  const session = db.prepare('SELECT * FROM chat_sessions WHERE id = ? AND user_id = ?').get(id, req.userId)
  if (!session) return res.status(404).json({ error: 'Session not found' })
  const rows = db.prepare('SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC').all(id)
  res.json({ session, messages: rows })
})

app.post('/api/chat/sessions/:id/messages', requireAuth, async (req, res) => {
  const { id } = req.params
  const { content } = req.body
  if (!content?.trim()) return res.status(400).json({ error: 'content required' })

  const session = db.prepare('SELECT * FROM chat_sessions WHERE id = ? AND user_id = ?').get(id, req.userId)
  if (!session) return res.status(404).json({ error: 'Session not found' })

  // Save user message
  db.prepare('INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)').run(id, 'user', content)

  // Fetch context for the AI
  const history = db.prepare('SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC LIMIT 20').all(id)
  const recentScripts = db.prepare('SELECT method, call_type, outcome FROM scripts WHERE user_id = ? ORDER BY saved_at DESC LIMIT 5').all(req.userId)
  const recentWins = db.prepare('SELECT COUNT(*) as c FROM scripts WHERE user_id = ? AND outcome = ?').get(req.userId, 'won')?.c || 0
  const recentLosses = db.prepare('SELECT COUNT(*) as c FROM scripts WHERE user_id = ? AND outcome = ?').get(req.userId, 'lost')?.c || 0

  const systemPrompt = `You are Pitch Studio AI, an expert sales coach and assistant. You have access to the user's recent data:
- Recent scripts: ${JSON.stringify(recentScripts)}
- Recent wins: ${recentWins}, losses: ${recentLosses}
Help the user with script generation, sales strategy, call preparation, and performance analysis. Be concise and actionable.`

  try {
    const headers = { 'Content-Type': 'application/json' }
    if (OLLAMA_API_KEY) headers['Authorization'] = `Bearer ${OLLAMA_API_KEY}`

    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: OLLAMA_MODEL || 'glm-5.2:cloud',
        messages: [
          { role: 'system', content: systemPrompt },
          ...history.map((m) => ({ role: m.role, content: m.content })),
          { role: 'user', content },
        ],
        stream: false,
      }),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      return res.status(response.status).json({ error: text || `Upstream ${response.status}` })
    }

    let data = await response.json()
    if (data.choices && data.choices[0]?.message?.content) {
      data = { message: { content: data.choices[0].message.content } }
    }

    const aiResponse = data.message?.content || 'I apologize, I could not generate a response.'
    db.prepare('INSERT INTO chat_messages (session_id, role, content, model_used) VALUES (?, ?, ?, ?)').run(id, 'assistant', aiResponse, OLLAMA_MODEL || 'glm-5.2:cloud')

    const rows = db.prepare('SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC').all(id)
    res.json({ messages: rows })
  } catch (err) {
    console.error('[Chat] Error:', err.message)
    db.prepare('INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)').run(id, 'assistant', 'Sorry, I encountered an error. Please try again.')
    const rows = db.prepare('SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC').all(id)
    res.json({ messages: rows, error: err.message })
  }
})

/* ---------- P10.4 smart alerts ---------- */
app.get('/api/smart-alerts', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT * FROM smart_alerts
    WHERE user_id = ? AND dismissed = 0
    ORDER BY CASE severity WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END, created_at DESC
  `).all(req.userId)
  res.json({ alerts: rows })
})

app.get('/api/smart-alerts/all', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM smart_alerts WHERE user_id = ? ORDER BY created_at DESC').all(req.userId)
  res.json({ alerts: rows })
})

app.post('/api/smart-alerts/generate', requireAuth, async (req, res) => {
  try {
    const lastWeek = Date.now() - 7 * 24 * 60 * 60 * 1000
    const prevWeek = Date.now() - 14 * 24 * 60 * 60 * 1000

    const currentWins = db.prepare(`
      SELECT COUNT(*) as c FROM scripts
      WHERE user_id = ? AND outcome = 'won' AND saved_at >= ?
    `).get(req.userId, lastWeek)?.c || 0

    const prevWins = db.prepare(`
      SELECT COUNT(*) as c FROM scripts
      WHERE user_id = ? AND outcome = 'won' AND saved_at >= ? AND saved_at < ?
    `).get(req.userId, prevWeek, lastWeek)?.c || 0

    const currentScripts = db.prepare(`
      SELECT COUNT(*) as c FROM scripts WHERE user_id = ? AND saved_at >= ?
    `).get(req.userId, lastWeek)?.c || 0

    const prevScripts = db.prepare(`
      SELECT COUNT(*) as c FROM scripts WHERE user_id = ? AND saved_at >= ? AND saved_at < ?
    `).get(req.userId, prevWeek, lastWeek)?.c || 0

    const headers = { 'Content-Type': 'application/json' }
    if (OLLAMA_API_KEY) headers['Authorization'] = `Bearer ${OLLAMA_API_KEY}`

    const systemPrompt = `You are a sales analytics AI. Based on the user's recent performance data, generate 0-3 smart alerts. Return ONLY valid JSON:
{
  "alerts": [
    {
      "alert_type": "performance_drop|win_rate_change|usage_spike|pattern_detected|coaching_needed",
      "severity": "info|warning|critical",
      "title": "brief title",
      "message": "detailed message",
      "action_plan": "specific action to take",
      "metric_value": number,
      "metric_previous": number
    }
  ]
}`

    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: OLLAMA_MODEL || 'glm-5.2:cloud',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `This week: ${currentWins} wins out of ${currentScripts} scripts. Previous week: ${prevWins} wins out of ${prevScripts} scripts.` },
        ],
        stream: false,
      }),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      return res.status(response.status).json({ error: text || `Upstream ${response.status}` })
    }

    let data = await response.json()
    if (data.choices && data.choices[0]?.message?.content) {
      data = { message: { content: data.choices[0].message.content } }
    }

    const generated = data.message?.content || ''
    let parsed = {}
    try {
      const clean = generated.replace(/```json/gi, '').replace(/```/g, '').trim()
      parsed = JSON.parse(clean.slice(clean.indexOf('{')))
    } catch (_) {
      parsed = { alerts: [] }
    }

    const { workspaceId } = getUserWorkspaceRole(req.userId)
    const alerts = Array.isArray(parsed.alerts) ? parsed.alerts : []
    const created = []

    for (const alert of alerts) {
      const result = db.prepare(`
        INSERT INTO smart_alerts (user_id, workspace_id, alert_type, severity, title, message, action_plan, metric_value, metric_previous)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        req.userId,
        workspaceId || null,
        alert.alert_type || 'pattern_detected',
        alert.severity || 'info',
        alert.title || 'Smart Alert',
        alert.message || '',
        alert.action_plan || '',
        alert.metric_value || 0,
        alert.metric_previous || 0
      )
      const row = db.prepare('SELECT * FROM smart_alerts WHERE id = ?').get(result.lastInsertRowid)
      created.push(row)
    }

    res.json({ alerts: created })
  } catch (err) {
    console.error('[Smart alerts] Error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.put('/api/smart-alerts/:id/dismiss', requireAuth, (req, res) => {
  const { id } = req.params
  const existing = db.prepare('SELECT id FROM smart_alerts WHERE id = ? AND user_id = ?').get(id, req.userId)
  if (!existing) return res.status(404).json({ error: 'Not found' })
  db.prepare('UPDATE smart_alerts SET dismissed = 1 WHERE id = ?').run(id)
  res.json({ success: true })
})

/* ---------- P10.5 multi-model routing ---------- */
async function routeToModel(taskType, messages, preferredModel = null) {
  const models = preferredModel
    ? [preferredModel, 'glm-5.2:cloud', 'glm-5.2']
    : ['glm-5.2:cloud', 'glm-5.2']

  const startTime = Date.now()
  let lastError = ''

  for (const model of models) {
    try {
      const headers = { 'Content-Type': 'application/json' }
      if (OLLAMA_API_KEY) headers['Authorization'] = `Bearer ${OLLAMA_API_KEY}`

      const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ model, messages, stream: false }),
      })

      if (!response.ok) {
        const text = await response.text().catch(() => '')
        lastError = text
        continue
      }

      let data = await response.json()
      if (data.choices && data.choices[0]?.message?.content) {
        data = { message: { content: data.choices[0].message.content } }
      }

      return {
        success: true,
        model: model,
        content: data.message?.content || '',
        duration_ms: Date.now() - startTime,
      }
    } catch (err) {
      lastError = err.message
    }
  }

  return {
    success: false,
    model: models[models.length - 1],
    content: '',
    error: lastError,
    duration_ms: Date.now() - startTime,
  }
}

app.post('/api/chat/route', requireAuth, async (req, res) => {
  try {
    const { task_type, messages, preferred_model } = req.body
    if (!task_type || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'task_type and messages required' })
    }

    const result = await routeToModel(task_type, messages, preferred_model)

    // Log routing decision
    db.prepare(`
      INSERT INTO model_routing_logs (user_id, task_type, model_used, fallback_from, duration_ms, success, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.userId,
      task_type,
      result.model,
      preferred_model || null,
      result.duration_ms,
      result.success ? 1 : 0,
      result.error || null
    )

    if (!result.success) {
      return res.status(500).json({ error: result.error || 'All models failed' })
    }

    res.json({
      content: result.content,
      model: result.model,
      duration_ms: result.duration_ms,
    })
  } catch (err) {
    console.error('[Model routing] Error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/model-routing/logs', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT task_type, model_used, fallback_from, duration_ms, success, error_message, created_at
    FROM model_routing_logs
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 100
  `).all(req.userId)
  res.json({ logs: rows })
})

/* ---------- start ---------- */
/* ---------- Global error handler (Express 5 forwards async rejections here) ---------- */
app.use((err, req, res, next) => {
  console.error('[Express error]', err.message, err.stack)
  if (res.headersSent) return next(err)
  res.status(500).json({ error: 'Internal server error', detail: err.message, stack: err.stack?.split('\n').slice(0, 3).join(' ') })
})

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
  console.log(`Ollama upstream: ${OLLAMA_BASE_URL} (model: ${OLLAMA_MODEL || 'glm-5.2:cloud'})`)
  if (OLLAMA_BASE_URL.includes('localhost') || OLLAMA_BASE_URL.includes('127.0.0.1')) {
    console.log('⚠️  OLLAMA_CLOUD_BASE_URL points to localhost. Make sure Ollama is running locally, or update .env to your cloud endpoint.')
  }
})
