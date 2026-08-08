# ADR 001: SQLite over PostgreSQL

## Status
Accepted

## Context
We needed a database for the script generator backend. Options:
1. SQLite (file-based, zero-config)
2. PostgreSQL (full RDBMS, requires setup)
3. MongoDB (document store)
4. Supabase/Firebase (hosted)

## Decision
Use **SQLite with better-sqlite3**.

## Rationale
- **Zero configuration:** No server to install, no connection strings, no Docker
- **Single file:** `database.sqlite` is portable — move the project folder, the DB moves with it
- **Sufficient for current scale:** Single user / small team. SQLite handles this effortlessly
- **Fast reads:** better-sqlite3 is synchronous and extremely fast for read-heavy workloads
- **No network overhead:** In-process, no TCP connections
- **Easy backup:** Copy the file

## Trade-offs
- **Single writer:** Concurrent writes block. Not an issue for single-user use.
- **No built-in user management:** We handle auth in application layer (JWT + bcrypt)
- **Scaling ceiling:** If we hit 100+ concurrent users, migrate to PostgreSQL

## Migration Path
If we need to scale:
1. Add PostgreSQL option via `DATABASE_URL` env var
2. Abstract DB layer into `src/db/` with SQLite and PostgreSQL adapters
3. Migration script copies SQLite → PostgreSQL
4. Keep SQLite as the default for new users

## Consequences
- Simpler setup for users
- Simpler deployment
- Lower hosting costs
- May need migration later if we go multi-tenant with high concurrency
