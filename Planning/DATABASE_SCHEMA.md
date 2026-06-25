# Database Schema Documentation

## Overview
- **Engine**: SQLite via better-sqlite3
- **File**: `<storagePath>/app.db`
- **Pragma**: `journal_mode = WAL`, `foreign_keys = ON`
- **Migration Version**: Stored in `PRAGMA user_version`

---

## Migration History

| Version | Schema Change | Status |
|---------|--------------|--------|
| v0 (pre-migration) | No tables exist | Initial state |
| v1 | settings, tags, sessions tables created | Current |
| v2 | (planned) Goals table | Future |
| v3 | (planned) Goal Progress table | Future |
| v4 | (planned) Additional indexes | Future |

**Current version: 1** (only v1 migration exists)

---

## Current Schema (v1)

### Table: `settings`
```sql
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| key | TEXT | PRIMARY KEY | Setting identifier |
| value | TEXT | NOT NULL | Setting value (always stringified) |

**Known keys**: `timerMinutes`, `showTaskPopupOnStart`, `lastPage`, `dataPath`, `_migrated`, `lastDate`

---

### Table: `tags`
```sql
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  createdAt INTEGER NOT NULL
);
```

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | TEXT | PRIMARY KEY | Format: `tag_<timestamp>` |
| name | TEXT | NOT NULL | Tag display name |
| color | TEXT | NOT NULL | Hex color (e.g. `#3B82F6`) |
| createdAt | INTEGER | NOT NULL | Unix timestamp in ms |

**Indexes**: None (only implicit PRIMARY KEY index)

---

### Table: `sessions`
```sql
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  startTime INTEGER NOT NULL,
  endTime INTEGER NOT NULL,
  plannedMinutes REAL NOT NULL,
  focusMinutes REAL NOT NULL,
  taskName TEXT DEFAULT '',
  note TEXT DEFAULT '',
  tagId TEXT,
  createdAt INTEGER NOT NULL,
  FOREIGN KEY (tagId) REFERENCES tags(id)
);
```

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | TEXT | PRIMARY KEY | Format: `s_<timestamp>` |
| startTime | INTEGER | NOT NULL | Unix timestamp in ms |
| endTime | INTEGER | NOT NULL | Unix timestamp in ms |
| plannedMinutes | REAL | NOT NULL | Planned duration in minutes |
| focusMinutes | REAL | NOT NULL | Actual focus duration in minutes |
| taskName | TEXT | DEFAULT '' | Session task description |
| note | TEXT | DEFAULT '' | Session notes |
| tagId | TEXT | FK → tags(id) | Foreign key to tags table |
| createdAt | INTEGER | NOT NULL | Unix timestamp in ms |

**Indexes**: None (only implicit PRIMARY KEY index)
**Foreign Key**: `tagId` → `tags(id)` with ON DELETE NO ACTION (default)

---

## Entity Relationship Diagram

```
┌──────────┐       ┌────────────┐
│  tags    │       │  settings  │
├──────────┤       ├────────────┤
│ id (PK)  │◄────┐ │ key (PK)   │
│ name     │     │ │ value      │
│ color    │     │ └────────────┘
│ createdAt│     │
└──────────┘     │
                 │
┌────────────────┴──┐
│    sessions       │
├───────────────────┤
│ id (PK)           │
│ startTime         │
│ endTime           │
│ plannedMinutes    │
│ focusMinutes      │
│ taskName          │
│ note              │
│ tagId (FK) ───────┘
│ createdAt         │
└───────────────────┘
```

### Relationships
- **tags → sessions**: One-to-many (one tag can have many sessions)
- **sessions → tags**: Many-to-one (each session can have one tag, or null)
- **settings**: Standalone key-value store

---

## Existing Indexes
- None defined beyond implicit PRIMARY KEY indexes

## Missing Indexes (Performance Concerns)
- `sessions(startTime)` - Used in `getTodayStats` and `getAllSessionsGrouped` (ORDER BY)
- `sessions(tagId)` - Used in `deleteTag` (UPDATE WHERE tagId = ?)
- `tags(name)` - Not currently used but would help future features

---

## Data Types Used
- **IDs**: TEXT (strings with prefixes, not auto-increment integers)
- **Timestamps**: INTEGER (Unix milliseconds)
- **Durations**: REAL (minutes with decimal)
- **Colors**: TEXT (hex format `#RRGGBB`)
- **Booleans**: TEXT ('true'/'false') stored in settings

---

## Migration System
```javascript
const MIGRATIONS = [
  function v1(db) { /* creates settings, tags, sessions */ }
];

function runMigrations() {
  var version = db.pragma('user_version', { simple: true });
  for (var i = version; i < MIGRATIONS.length; i++) {
    MIGRATIONS[i](db);
    db.pragma('user_version = ' + (i + 1));
  }
}
```

- Version tracking uses SQLite's `PRAGMA user_version`
- Migrations are sequential (v1, v2, v3...)
- Each migration function receives the db instance
- No rollback mechanism exists

---

## JSON Import Migration (legacy)
The `migrateFromJson()` function imports from JSON files:
| Source File | Target Table | Notes |
|-------------|-------------|-------|
| `settings.json` | settings | All keys except `dataPath` |
| `pomodoro-tags.json` | tags | Uses `saveTag()` helper |
| `pomodoro-sessions.json` | sessions | Groups by date, uses `saveSession()` |
| `pomodoro-stats.json` | settings | Saves `lastDate` into settings |

Migration flag `_migrated` prevents re-running.

---

## Path Migration
`setPath()` copies the entire `app.db` file to a new directory:
1. Close current DB connection
2. Copy file to new path
3. Open new DB connection
4. Re-run migrations
5. Write `.datadir` file with new path
