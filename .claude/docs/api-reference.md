# API Reference

## Authentication
All data endpoints require `Authorization: Bearer <jwt_token>` header.

### POST /api/auth/register
Create a new account.
```json
// Request
{
  "email": "user@example.com",
  "password": "min6chars",
  "company_name": "Acme Inc"  // optional
}

// Response
{
  "token": "eyJhbGciOiJIUzI1Ni...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "company_name": "Acme Inc"
  }
}
```

### POST /api/auth/login
Authenticate and get token.
```json
// Request
{
  "email": "user@example.com",
  "password": "min6chars"
}

// Response
{
  "token": "eyJhbGciOiJIUzI1Ni...",
  "user": { "id": 1, "email": "...", "company_name": "..." }
}
```

### GET /api/auth/me
Verify token and return current user.
```json
// Response
{
  "user": { "id": 1, "email": "...", "company_name": "..." }
}
```

## Settings

### GET /api/settings
```json
// Response
{ "company_name": "Acme Inc" }
```

### PUT /api/settings
```json
// Request
{ "company_name": "New Name" }

// Response
{ "success": true, "company_name": "New Name" }
```

## Products

### GET /api/products
List all products for the authenticated user.
```json
// Response
{
  "products": [
    {
      "id": 1,
      "user_id": 1,
      "name": "Product Name",
      "category": "SaaS",
      "one_liner": "...",
      "description": "...",
      "ideal_customer": "...",
      "pain_points": "...",
      "differentiators": "...",
      "price_model": "...",
      "proof_points": "...",
      "competitors": "...",
      "created_at": "2026-07-25 12:00:00"
    }
  ]
}
```

### POST /api/products
```json
// Request
{
  "name": "...",
  "category": "...",
  "one_liner": "...",
  "description": "...",
  "ideal_customer": "...",
  "pain_points": "...",
  "differentiators": "...",
  "price_model": "...",
  "proof_points": "...",
  "competitors": "..."
}

// Response
{ "product": { ... } }
```

### PUT /api/products/:id
Update product. Same request shape as POST.

### DELETE /api/products/:id
Delete product and cascade delete related scripts.
```json
// Response
{ "success": true }
```

## Staff

### GET /api/staff
```json
// Response
{
  "staff": [
    {
      "id": 1,
      "user_id": 1,
      "name": "Jane Doe",
      "role": "Sales Rep",
      "languages": ["en", "hi"],
      "created_at": "..."
    }
  ]
}
```

### POST /api/staff
```json
// Request
{
  "name": "Jane Doe",
  "role": "Sales Rep",
  "languages": ["en", "hi"]
}

// Response
{ "staff": { ... } }
```

### DELETE /api/staff/:id
```json
// Response
{ "success": true }
```

## Scripts

### GET /api/scripts
List all scripts for the user, newest first.
```json
// Response
{
  "scripts": [
    {
      "id": 1,
      "user_id": 1,
      "product_id": 1,
      "method": "spin",
      "call_type": "discovery",
      "duration": 30,
      "language": "en",
      "region": "us",
      "delivery": "balanced",
      "simple": 0,
      "persona": "general",
      "data": {
        "opening": "...",
        "toneLevel": "Consultative",
        "toneGuidance": "...",
        "segments": [...],
        "objections": [...]
      },
      "meta": {
        "productId": 1,
        "method": "spin",
        "callType": "discovery",
        ...
      }
    }
  ]
}
```

### POST /api/scripts
Create or update a script (upsert on unique config).
```json
// Request
{
  "product_id": 1,
  "method": "spin",
  "call_type": "discovery",
  "duration": 30,
  "language": "en",
  "region": "us",
  "delivery": "balanced",
  "simple": false,
  "persona": "general",
  "opening": "...",
  "tone_level": "Consultative",
  "tone_guidance": "...",
  "segments": [...],
  "objections": [...],
  "saved_at": 1234567890
}

// Response
{ "script": { ... } }
```

### DELETE /api/scripts/:id
```json
// Response
{ "success": true }
```

## AI Proxy

### POST /api/chat
Proxy to Ollama. Accepts Ollama chat format.
```json
// Request
{
  "model": "glm-5.2:cloud",
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "stream": false
}

// Response (normalized)
{
  "message": {
    "content": "..."
  }
}
```

### POST /api/chat/stream
Proxy to Ollama with streaming. Returns NDJSON/SSE.
```json
// Request
{
  "model": "glm-5.2:cloud",
  "messages": [...],
  "stream": true
}

// Response (raw NDJSON chunks)
data: {"message":{"content":"Hello"}}
data: {"message":{"content":" world"}}
...
```

## Public API (API Key Auth)

Public endpoints use `x-api-key` header instead of JWT.

### GET /api/v1/products
List products accessible to the API key owner.
```json
// Headers
x-api-key: ps_...

// Response
{
  "products": [
    { "id": 1, "name": "...", "category": "...", "one_liner": "...", "description": "..." }
  ]
}
```

### POST /api/v1/scripts/generate
Generate a script via the AI engine.
```json
// Headers
x-api-key: ps_...
Content-Type: application/json

// Request
{
  "product_id": 1,
  "method": "spin",
  "call_type": "discovery",
  "duration": 30,
  "language": "en",
  "region": "us",
  "delivery": "balanced",
  "simple": false,
  "persona": "general"
}

// Response
{
  "script": {
    "opening": "...",
    "toneLevel": "Consultative",
    "toneGuidance": "...",
    "segments": [...]
  },
  "model": "glm-5.2:cloud"
}
```

## API Keys

### GET /api/api-keys
List API keys (hashed, raw key never returned).
```json
// Response
{
  "keys": [
    { "id": 1, "name": "Zapier", "scopes": "scripts:read,scripts:write", "created_at": "...", "last_used_at": "..." }
  ]
}
```

### POST /api/api-keys
Create a new API key.
```json
// Request
{ "name": "Zapier" }

// Response
{
  "key": "ps_abc123...",
  "name": "Zapier",
  "warning": "This is the only time the key is shown. Copy it now."
}
```

### DELETE /api/api-keys/:id
Revoke an API key.
```json
// Response
{ "success": true }
```

## Webhooks

### GET /api/webhooks
List webhooks.
```json
// Response
{
  "webhooks": [
    {
      "id": 1,
      "url": "https://hooks.zapier.com/...",
      "events": "script.completed,script.used",
      "secret": "whsec_...",
      "active": 1,
      "created_at": "..."
    }
  ]
}
```

### POST /api/webhooks
Create a webhook.
```json
// Request
{
  "url": "https://hooks.zapier.com/...",
  "events": "script.completed,script.used",
  "secret": "optional-signing-secret"
}

// Response
{ "webhook": { ... } }
```

### PUT /api/webhooks/:id
Update webhook fields (url, events, secret, active).
```json
// Request
{ "active": false }

// Response
{ "webhook": { ... } }
```

### DELETE /api/webhooks/:id
Delete a webhook.
```json
// Response
{ "success": true }
```

### Webhook Payload Format
When events fire, POSTs are sent with HMAC-SHA256 signature in `X-Pitch-Signature` header.
```json
// Headers
X-Pitch-Signature: sha256=...
Content-Type: application/json

// Body (script.completed)
{
  "event": "script.completed",
  "product_id": 1,
  "method": "spin",
  "call_type": "discovery",
  "duration": 30,
  "language": "en",
  "generated_at": 1234567890
}
```

## Error Responses
```json
// 400 Bad Request
{ "error": "Email and password required" }

// 401 Unauthorized
{ "error": "Invalid token" }

// 404 Not Found
{ "error": "Not found" }

// 409 Conflict
{ "error": "Email already registered" }

// 500 Internal Error
{ "error": "Error message" }
```

## Status Codes
| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created (not used yet, but reserve) |
| 400 | Bad request / validation error |
| 401 | Unauthorized / bad token |
| 404 | Resource not found |
| 409 | Conflict (duplicate email) |
| 500 | Server error |
