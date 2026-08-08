# Database Schema

## Entity Relationship Diagram
```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    users    │       │  products   │       │   scripts   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │──┐    │ id (PK)     │◄──────│ id (PK)     │
│ email       │  │    │ user_id (FK)│       │ user_id (FK)│
│ password    │  └────│ name        │       │ product_id  │
│ company_name│       │ category    │       │ method      │
│ created_at  │       │ one_liner   │       │ call_type   │
└─────────────┘       │ description │       │ duration    │
                      │ ideal_cust  │       │ language    │
┌─────────────┐       │ pain_points │       │ region      │
│    staff    │       │ differentiators     │ delivery    │
├─────────────┤       │ price_model │       │ simple      │
│ id (PK)     │       │ proof_points│       │ persona     │
│ user_id (FK)│───────│ competitors │       │ opening     │
│ name        │       │ created_at  │       │ tone_level  │
│ role        │       └─────────────┘       │ tone_guidance│
│ languages   │                              │ segments_json│
│ created_at  │                              │ objections_json│
└─────────────┘                              │ saved_at    │
                                             │ created_at  │
                                             └─────────────┘
```

## Table Definitions

### users
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTOINCREMENT | User ID |
| email | TEXT | UNIQUE, NOT NULL | Login email |
| password_hash | TEXT | NOT NULL | bcrypt hash |
| company_name | TEXT | | Display name |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Registration time |

### products
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTOINCREMENT | Product ID |
| user_id | INTEGER | NOT NULL, FK users.id | Owner |
| name | TEXT | NOT NULL | Product name |
| category | TEXT | | Category |
| one_liner | TEXT | | Short pitch |
| description | TEXT | | Full description |
| ideal_customer | TEXT | | Target buyer |
| pain_points | TEXT | | Problems solved |
| differentiators | TEXT | | Unique value |
| price_model | TEXT | | Pricing info |
| proof_points | TEXT | | Evidence/case studies |
| competitors | TEXT | | Main competitors |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Created time |

### staff
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTOINCREMENT | Staff ID |
| user_id | INTEGER | NOT NULL, FK users.id | Owner |
| name | TEXT | NOT NULL | Person name |
| role | TEXT | | Job title |
| languages | TEXT | | JSON array of language IDs |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Created time |

### scripts
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTOINCREMENT | Script ID |
| user_id | INTEGER | NOT NULL, FK users.id | Owner |
| product_id | INTEGER | NOT NULL, FK products.id | Related product |
| method | TEXT | NOT NULL | Methodology ID |
| call_type | TEXT | NOT NULL | Call type ID |
| duration | INTEGER | NOT NULL | Minutes |
| language | TEXT | NOT NULL | Language ID |
| region | TEXT | NOT NULL | Region ID |
| delivery | TEXT | NOT NULL | Delivery style ID |
| simple | INTEGER | NOT NULL, DEFAULT 0 | Simple language flag |
| persona | TEXT | NOT NULL, DEFAULT 'general' | Buyer persona |
| opening | TEXT | | First line of script |
| tone_level | TEXT | | Consultative/Assertive/etc |
| tone_guidance | TEXT | | When to push vs pull |
| segments_json | TEXT | | JSON array of segments |
| objections_json | TEXT | | JSON array of objections |
| saved_at | INTEGER | | Unix timestamp |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Created time |

## Indexes
```sql
-- Unique index prevents duplicate scripts for same config
CREATE UNIQUE INDEX idx_scripts_config ON scripts (
  user_id, product_id, method, call_type, duration,
  language, region, delivery, simple, persona
);
```

## Migration History
| Date | Change | Applied |
|------|--------|---------|
| 2026-07-25 | Initial schema | ✅ |
| 2026-07-25 | Added idx_scripts_config | ✅ |

## Future Migrations (Planned)
```sql
-- Script outcome tracking
ALTER TABLE scripts ADD COLUMN outcome TEXT; -- 'won'|'lost'|'pending'
ALTER TABLE scripts ADD COLUMN notes TEXT;
ALTER TABLE scripts ADD COLUMN used_at INTEGER;

-- Workspaces (Phase 4)
CREATE TABLE workspaces (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  owner_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE users ADD COLUMN workspace_id INTEGER;

-- Script sharing
ALTER TABLE products ADD COLUMN workspace_shared INTEGER DEFAULT 0;
ALTER TABLE scripts ADD COLUMN workspace_shared INTEGER DEFAULT 0;

-- Audit trail (Phase 7)
CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id INTEGER,
  details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```
