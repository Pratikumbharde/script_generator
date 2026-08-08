# Feature 03: Database Backend

## Status
✅ Implemented

## Overview
SQLite database with Express API providing CRUD operations for users, products, staff, and scripts. All data is user-scoped and persisted server-side.

## Why SQLite?
See `../decisions/001-sqlite-over-postgres.md`

## Schema
See `../docs/database-schema.md`

## API Endpoints
See `../docs/api-reference.md`

## Key Design Decisions

### Upsert for Scripts
Scripts have a unique index on the full configuration:
```sql
(user_id, product_id, method, call_type, duration, language, region, delivery, simple, persona)
```
This means generating a script with the same config updates the existing one instead of creating duplicates.

### JSON Columns
- `staff.languages` — JSON array of language IDs
- `scripts.segments_json` — JSON array of segment objects
- `scripts.objections_json` — JSON array of objection objects

SQLite doesn't have a native JSON type, so we store as TEXT and parse/stringify in application code.

### Soft Deletes
Currently hard deletes. Future: add `deleted_at` for soft deletes with a cleanup job.

### Cascade Behavior
- Delete product → cascade delete related scripts (implemented in server.js)
- Delete user → should cascade (not implemented yet, foreign keys not enforced)

## Files
- `server.js` — All backend logic
- `database.sqlite` — SQLite file (auto-created, gitignored)

## Migration Strategy
Since SQLite doesn't have a built-in migration system, we use:
1. Schema creation in server.js startup (CREATE TABLE IF NOT EXISTS)
2. Index creation (CREATE INDEX IF NOT EXISTS)
3. Future migrations: check schema version, apply ALTER TABLE statements

### Current Migrations Applied
```sql
-- Initial schema (users, products, staff, scripts)
-- Unique index on scripts config
```

## Future Enhancements
- [ ] Schema versioning table
- [ ] Migration runner
- [ ] Backup/restore endpoint
- [ ] Data export (CSV/JSON)
- [ ] Connection pooling (if migrating to PostgreSQL)
