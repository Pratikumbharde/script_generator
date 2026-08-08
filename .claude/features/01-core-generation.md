# Feature 01: Core Script Generation

## Status
✅ Implemented

## Overview
The heart of Pitch Studio. Generate time-segmented, methodology-specific sales scripts with objection handling, tailored to product, buyer persona, region, language, and delivery style.

## How It Works
1. User enters product details (name, description, pains, differentiators, etc.)
2. User selects:
   - Sales methodology (15 options)
   - Call type (6 options)
   - Duration (realistic per method+type)
   - Language (10+ including Hinglish)
   - Region (culture/context)
   - Delivery style (Soft/Balanced/Hard)
   - Persona (or General)
   - Simple language toggle
3. AI generates:
   - Opening line (exact words)
   - Time-segmented script (2–6 segments)
   - Each segment: say lines, ask lines, do notes
   - Tone guidance
   - 6 objections with responses
4. Script is saved to database (upsert on same config)
5. User views script in interactive cockpit with timer

## AI Prompt Engineering
Two parallel calls to Ollama:
1. **Core script prompt:** Methodology framing + product context + localization + output schema
2. **Objections prompt:** Methodology + product + region + language + 6 objections

### Prompt Quality Features
- Word-for-word spoken lines (not summaries)
- Coaching notes ("do" items) are silent, not spoken
- Under 22 words per line for say/ask items
- No gaps or overlaps in time segments
- JSON output with safe-parse recovery (handles truncation)

## Multi-Language Support
- Primary language always shown
- Discover other saved languages for same config
- Side-by-side comparison (up to 3 languages)
- Language switcher with missing-language indicators

## Data Model
- **Script config:** product_id + method + call_type + duration + language + region + delivery + simple + persona
- **Unique constraint:** One script per config per user (upsert)

## Files
- `app.jsx` — StudioView, ScriptCockpit, generateScript function
- `server.js` — POST /api/scripts (upsert)

## Future Enhancements
- [ ] Streaming generation (tokens appear in real-time)
- [ ] A/B variant generation (2–3 options)
- [ ] Self-improving based on outcome tracking
- [ ] Custom methodology support
