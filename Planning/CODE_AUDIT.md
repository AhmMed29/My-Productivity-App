# Full Code Audit - My Productivity App

## 1. Project Structure

```
My-Productivity-App/
├── main.js              # Electron main process (175 lines)
├── preload.js           # Bridge between main & renderer (37 lines)
├── database.js          # SQLite database layer (269 lines)
├── package.json         # Electron + better-sqlite3 dependencies
├── update.json          # Update metadata
├── index.html           # (root - old file)
├── habits.html          # (root - old file)
├── Habit-Table-Design-page.html  # (design reference)
├── README.md
├── AGENTS.md            # Agent instructions
├── src/
│   ├── index.html       # Main SPA entry (595 lines)
│   ├── home.html        # Home page (82 lines)
│   ├── habits.html      # Standalone habits page (541 lines)
│   ├── css/
│   │   ├── pomodoro.css     # 23 lines
│   │   ├── home.css         # 22 lines
│   │   ├── habits.css       # 7 lines
│   │   └── ahmeds-styles.css # 199 lines
│   └── js/
│       ├── timer.js         # Pomodoro timer (154 lines)
│       ├── sessions.js      # Sessions & tags (765 lines)
│       ├── storage.js       # Storage path (18 lines)
│       ├── stats.js         # Stats display (23 lines)
│       └── theme.js         # Theme/colors (56 lines)
├── mobile/              # Capacitor mobile app
├── Fonts/
│   └── Noto_Sans_Arabic,Spectral/  # Font files
├── Pomo modern design/  # Reference design for Pomodoro
├── docs/                # Superpowers plans & specs
└── Planning/            # Current planning documents
```

---

## 2. main.js - Electron Main Process

### Functions

| Function | Line | Purpose |
|----------|------|---------|
| `determineStoragePath()` | 9 | Resolves data directory from `.datadir` file, `settings.json`, or default |
| `createWindow()` | 25 | Creates frameless BrowserWindow (1200x800) loading `src/index.html` |
| `versionGt(a, b)` | 39 | Semantic version comparison |
| `checkForUpdates()` | 49 | Fetches `update.json` from GitHub, sends 'update-available' event |

### App Lifecycle

```
app.whenReady() → determineStoragePath() → database.init() → database.migrateFromJson() → createWindow()
```

### IPC Channels (Main ↔ Renderer)

| Channel | Direction | Handler | Purpose |
|---------|-----------|---------|---------|
| `minimize` | renderer→main | Event | Minimize window |
| `maximize` | renderer→main | Event | Toggle maximize |
| `close` | renderer→main | Event | Close window |
| `navigate` | renderer→main | Event | Load different page file |
| `read-file` | renderer→main | Handle | Read file from disk |
| `write-file` | renderer→main | Handle | Write file to disk |
| `select-folder` | renderer→main | Handle | Open folder dialog |
| `get-default-path` | renderer→main | Handle | Get userData path |
| `db:init` | renderer→main | Handle | Returns storage path |
| `db:get-setting` | renderer→main | Event (sync) | Get setting by key |
| `db:set-setting` | renderer→main | Handle | Set setting key/value |
| `db:get-all-settings` | renderer→main | Event (sync) | Get all settings |
| `db:get-tags` | renderer→main | Event (sync) | Get all tags |
| `db:save-tag` | renderer→main | Handle | Save/update tag |
| `db:delete-tag` | renderer→main | Handle | Delete tag |
| `db:get-sessions-grouped` | renderer→main | Event (sync) | Get all sessions grouped by date |
| `db:save-session` | renderer→main | Handle | Save session |
| `db:update-session` | renderer→main | Handle | Update session metadata |
| `db:get-today-stats` | renderer→main | Event (sync) | Get today's stats |
| `db:get-total-stats` | renderer→main | Event (sync) | Get total stats |
| `db:get-path` | renderer→main | Event (sync) | Get DB path |
| `db:set-path` | renderer→main | Handle | Change storage path (copies DB) |
| `open-url` | renderer→main | Handle | Open external URL |
| `update-available` | main→renderer | Send | Notify of available update |

### Key Observations
- `db:get-setting`, `db:get-all-settings`, `db:get-tags`, `db:get-sessions-grouped`, `db:get-today-stats`, `db:get-total-stats`, `db:get-path` use **synchronous** IPC (`sendSync` / `e.returnValue`)
- `db:set-setting`, `db:save-tag`, `db:delete-tag`, `db:save-session`, `db:update-session`, `db:set-path` use **async** IPC (invoke/handle)
- No error handling for most IPC handlers (silent try/catch)
- No content security policy headers
- `navigate` channel loads full HTML files, breaking SPA state

---

## 3. database.js - SQLite Database Layer

### Configuration
- **Library**: better-sqlite3
- **Pragma**: `journal_mode = WAL`, `foreign_keys = ON`
- **File**: `<storagePath>/app.db`
- **Migrations**: Version stored in `PRAGMA user_version`

### Migrations

| Version | Function | Tables Created |
|---------|----------|----------------|
| v1 | `MIGRATIONS[0]` | `settings`, `tags`, `sessions` |

Current migration system ends at v1. `user_version` is updated to `1` after running.

### Database Functions

| Function | Line | Query | Purpose |
|----------|------|-------|---------|
| `init(storagePath, defaultPath)` | 40 | - | Opens DB, runs migrations |
| `runMigrations()` | 53 | PRAGMA user_version | Sequential migration runner |
| `getSetting(key)` | 61 | `SELECT value FROM settings WHERE key = ?` | Get single setting |
| `setSetting(key, value)` | 68 | `INSERT OR REPLACE INTO settings` | Set setting |
| `getAllSettings()` | 75 | `SELECT key, value FROM settings` | Get all settings as object |
| `getTags()` | 84 | `SELECT * FROM tags ORDER BY createdAt ASC` | Get all tags |
| `saveTag(tag)` | 89 | `INSERT OR REPLACE INTO tags` | Insert/update tag |
| `deleteTag(id)` | 96 | `DELETE FROM tags WHERE id = ?` + `UPDATE sessions SET tagId = NULL` | Delete tag (nullifies session refs) |
| `saveSession(session)` | 106 | `INSERT OR REPLACE INTO sessions` | Save session |
| `updateSession(id, taskName, tagId, note)` | 127 | `UPDATE sessions SET taskName=?, tagId=?, note=? WHERE id=?` | Update session meta |
| `getAllSessionsGrouped()` | 136 | `SELECT * FROM sessions ORDER BY startTime DESC` | Get sessions grouped by date |
| `getTodayStats()` | 150 | `SELECT COUNT(*), SUM(focusMinutes)` for today | Today's pomo count & minutes |
| `getTotalStats()` | 165 | `SELECT COUNT(*), SUM(focusMinutes)` all time | Total pomo count & minutes |
| `migrateFromJson(storagePath)` | 174 | - | JSON→SQLite migration from old format |
| `setPath(newStoragePath)` | 239 | - | Copy DB to new location, reopen |
| `getPath()` | 257 | - | Return DB directory path |
| `close()` | 259 | - | Close DB connection |

### Table Schemas

#### `settings`
```sql
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

#### `tags`
```sql
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  createdAt INTEGER NOT NULL
);
```

#### `sessions`
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

### Key Observations
- All IDs are strings (not auto-increment integers)
- `tags.id` format: `tag_<timestamp>` (e.g. `tag_1718000000000`)
- `sessions.id` format: `s_<timestamp>` (e.g. `s_1718000000000`)
- Tags use `INSERT OR REPLACE` - no auto-increment
- `deleteTag` nullifies sessions' tagId instead of cascading delete
- `migrateFromJson` imports from JSON files: `settings.json`, `pomodoro-tags.json`, `pomodoro-sessions.json`, `pomodoro-stats.json`
- Migration flag `_migrated` in settings prevents re-migration
- No indexes defined beyond primary keys
- `setPath` copies the entire DB file to new location
- All functions use try/catch with silent failures

---

## 4. preload.js - Context Bridge

### Exposed APIs

#### `window.electronAPI`
| Method | IPC Channel | Type |
|--------|-------------|------|
| `minimize()` | `minimize` | send |
| `maximize()` | `maximize` | send |
| `close()` | `close` | send |
| `navigate(page)` | `navigate` | send |
| `zoomIn()` | - | WebFrame |
| `zoomOut()` | - | WebFrame |
| `zoomReset()` | - | WebFrame |
| `setZoom(z)` | - | WebFrame |
| `readFile(fp)` | `read-file` | invoke |
| `writeFile(fp, data)` | `write-file` | invoke |
| `selectFolder()` | `select-folder` | invoke |
| `getDefaultPath()` | `get-default-path` | invoke |
| `openUrl(url)` | `open-url` | invoke |
| `onUpdateAvailable(callback)` | `update-available` | on |

#### `window.db`
| Method | IPC Channel | Type |
|--------|-------------|------|
| `init()` | `db:init` | invoke |
| `getSetting(key)` | `db:get-setting` | sendSync |
| `setSetting(key, value)` | `db:set-setting` | invoke |
| `getAllSettings()` | `db:get-all-settings` | sendSync |
| `getTags()` | `db:get-tags` | sendSync |
| `saveTag(tag)` | `db:save-tag` | invoke |
| `deleteTag(id)` | `db:delete-tag` | invoke |
| `getSessionsGrouped()` | `db:get-sessions-grouped` | sendSync |
| `saveSession(session)` | `db:save-session` | invoke |
| `updateSession(id, taskName, tagId, note)` | `db:update-session` | invoke |
| `getTodayStats()` | `db:get-today-stats` | sendSync |
| `getTotalStats()` | `db:get-total-stats` | sendSync |
| `getPath()` | `db:get-path` | sendSync |
| `setPath(newPath)` | `db:set-path` | invoke |

---

## 5. src/index.html - Main SPA (595 lines)

### Pages (SPA sections)
| ID | Visibility | Purpose |
|----|------------|---------|
| `#page-home` | `hidden` by default | Home page (currently empty) |
| `#page-pomodoro` | `flex` default | Pomodoro timer |
| `#page-habits` | `hidden` by default | Habits tracking table |
| `#page-settings` | `hidden` by default | Settings page |

### Modals/Popups
| ID | Trigger | Purpose |
|----|---------|---------|
| `#timePopup` | Click timer text | Set timer duration |
| `#endPopup` | Click End button | Confirm end session |
| `#sessionPopup` | Click session in timeline | Edit session (task name, tag, note) |
| `#newTagPopup` | "New Tag" in dropdown | Create new tag |
| `#addSessionPopup` | Add session button | Manually add session |
| `#habit-modal` | Click habit name card | View habit details/stats |
| `#add-modal` | "Add Habit" button | Create new habit |
| `#sessionTimelineModal` | Click timeline node | Edit session from timeline |
| `#updateModal` | `update-available` event | Show update notification |

### Sidebar (current)
- `#navSidebar` - 56px wide, vertical flex, blue background (`#3B82F6`)
- Buttons: Home, Pomodoro, Habits, Settings
- No text labels, icons only
- Active indicator: white vertical bar (-left-3)

### Key Inline Styles
- `.sticky-col` - Sticky right column for habit names
- `.sticky-header` - Sticky date headers
- Modal styles with `backdrop-filter: blur(4px)`, `border-radius: 20px`
- Animation: `@keyframes modalIn` (scale 0.95→1, 0.2s)
- Hover color classes: `.hvo` (violet), `.hbl` (blue), `.hcy` (cyan), `.hro` (rose), `.hin` (indigo), `.hpi` (pink), `.hor` (orange), `.hpu` (purple)

### Event Listeners (inline)

| Element | Event | Handler |
|---------|-------|---------|
| `document` | `keydown` | Ctrl+=/-/0 for zoom |
| `#main-scroll` | `wheel` | Horizontal scroll on thead hover |
| `#table-body` | `click` | Open habit detail modal |
| `#modal-close` | `click` | Close habit modal |
| `#habit-modal` | `click` | Close on backdrop click |
| `#add-habit-btn` | `click` | Open add habit modal |
| `#add-modal-close` | `click` | Close add modal |
| `#add-modal` | `click` | Close on backdrop click |

### Global Functions
| Function | Purpose |
|----------|---------|
| `showPage(name)` | Show/hide pages, update active sidebar indicator |
| `updateClock()` | Update clock and date every second |
| `showPage('pomodoro')` | Default page on load |

---

## 6. JavaScript Files

### 6a. timer.js (154 lines)

#### Variables
| Variable | Purpose |
|----------|---------|
| `DASHARRAY` | Pre-calculated circumference for SVG circle |
| `totalSeconds` | Total timer duration |
| `remainingSeconds` | Remaining time |
| `isRunning` | Timer running state |
| `timerId` | setTimeout handle |
| `expectedNext` | Expected next tick timestamp (drift compensation) |

#### Functions
| Function | Purpose |
|----------|---------|
| `formatTime(secs)` | Format seconds as MM:SS |
| `updateRing()` | Update SVG circle dashoffset |
| `stopTimer()` | Stop timer and clear timeout |
| `tick()` | Decrement remaining, update display, check completion |
| `window.openTimePopup()` | Open time-setting popup (disabled if running) |
| `window.closeTimePopup(e)` | Close time popup on backdrop click |
| `window.setTimer()` | Set new timer duration |
| `window.toggleTimer()` | Start/Pause/Continue toggle |
| `startTimer()` | Internal: start countdown |
| `saveFocusMinutes(mins)` | Save completed session (calls updateSidebar) |
| `completeTimer()` | Timer complete handler |
| `window.openEndPopup()` | Open end-session confirmation popup |
| `window.closeEndPopup(e)` | Close end popup |
| `window.confirmEnd()` | End session and save elapsed time |
| `window.cancelEnd()` | Cancel end operation |

### 6b. sessions.js (765 lines)

#### Variables
| Variable | Purpose |
|----------|---------|
| `activeSession` | Currently running session object |
| `editingSessionId` | Session being edited in popup |
| `editingTagForSession` | Tag selected for editing session |
| `addSessionTagId` | Tag selected for adding session |
| `selectedTagColor` | Currently selected tag color |

#### Functions
| Function | Purpose |
|----------|---------|
| `getTags()` | Fetch tags from DB |
| `saveTags(tags)` | Save array of tags to DB |
| `getSessions()` | Fetch grouped sessions from DB |
| `todayKey()` | Get today's date as YYYY-MM-DD |
| `formatTimeHM(ts)` | Format timestamp as "h:MM AM/PM" |
| `hexToRgb(hex)` | Convert hex color to RGB string |
| `renderTimeline()` | Render vertical session timeline (left sidebar) |
| `formatDateLabel(dateStr)` | Format date as "Mon DD" |
| `onSessionStart()` | Create active session, render timeline |
| `onSessionPause()` | Pause active session, accumulate time |
| `onSessionResume()` | Resume active session |
| `onSessionComplete(focusMin, plannedMin)` | Save session to DB |
| `onSessionCancel()` | Cancel active session |
| `window.selectSessionTag(tagId)` | Select tag for editing session |
| `window.selectAddSessionTag(tagId)` | Select tag for adding session |
| `renderTagList(listId, mode)` | Render tag dropdown list |
| `window.toggleTagDropdown(e)` | Toggle tag dropdown for editing |
| `window.toggleAddTagDropdown(e)` | Toggle tag dropdown for adding |
| `window.openSessionPopup(sessionId)` | Open session edit popup |
| `window.closeSessionPopup(e)` | Close session edit popup |
| `window.saveSessionEdit()` | Save session edits |
| `renderSessionTagDisplay()` | Show selected tag for editing |
| `window.clearSessionTag()` | Clear tag selection |
| `window.openNewTagPopup()` | Open new tag creation popup |
| `window.closeNewTagPopup(e)` | Close new tag popup |
| `renderColorPalette()` | Render color swatches |
| `window.selectTagColor(color)` | Select tag color |
| `window.saveNewTag()` | Save new tag to DB |
| `window.openAddSessionPopup()` | Open add-session popup |
| `window.closeAddSessionPopup(e)` | Close add-session popup |
| `window.saveAddSession()` | Save manually added session |
| `renderAddSessionTagDisplay()` | Show selected tag for adding |
| `window.clearAddSessionTag()` | Clear add-session tag |
| `formatDuration(minutes)` | Format minutes as human-readable |
| `getTodaySessions()` | Get today's sessions sorted |
| `renderSessionTimeline()` | Render horizontal session timeline |
| `window.openSessionTimelineModal(sessionId)` | Open timeline edit modal |
| `window.closeSessionTimelineModal()` | Close timeline modal |
| `window.saveSessionTimeline()` | Save timeline edits |
| `window.toggleTaskPopup()` | Toggle "show task popup on start" setting |

#### Patched Functions (wrapping originals)
| Original | Patched By | Hook Action |
|----------|------------|-------------|
| `window.toggleTimer` | sessions.js | Adds onSessionStart/Pause/Resume |
| `completeTimer` | sessions.js | Adds onSessionComplete |
| `window.confirmEnd` | sessions.js | Adds onSessionComplete |
| `window.setTimer` | sessions.js | Adds onSessionCancel |

#### Event Listeners
| Element | Event | Handler |
|---------|-------|---------|
| `document` | `click` | Open session popup on `[data-sid]` click in focusTimeline |
| `document` | `click` | Close sessionTimelineModal on backdrop click |
| `#sessionTimelineScroll` | `wheel` | Horizontal scroll on wheel |

### 6c. storage.js (18 lines)

| Function | Purpose |
|----------|---------|
| `STORAGE.init()` | Initialize storage path from DB |
| `STORAGE.getPath()` | Get current storage path |
| `STORAGE.setPath(newPath)` | Set new storage path |
| (IIFE) | Auto-init on load |

### 6d. stats.js (23 lines)

| Function | Purpose |
|----------|---------|
| `window.initStats()` | No-op initialization |
| `window.getStats()` | Get today + total stats from DB |
| `window.updateSidebar()` | Update sidebar stat display elements |

### 6e. theme.js (56 lines)

| Function | Purpose |
|----------|---------|
| `applyTheme()` | Apply static theme colors (blue nav, white bg) |
| `openSettings()` | Show settings page, save last page |
| `closeSettings()` | Return to last page |
| `saveSettings()` | Save and close settings |
| `cancelSettings()` | Cancel and close settings |
| `selectStoragePath()` | Open folder picker, set new storage path |

---

## 7. CSS Files

### pomodoro.css (23 lines)
- Font: Inter (Google Fonts)
- `.text-purple-brand` - Brand purple text color `#8A7CFB`
- `.bg-purple-brand`, `.bg-purple-light` - Purple backgrounds
- `.custom-scrollbar` - Thin scrollbar styling
- `.timer-circle` - Circular timer border
- `#progressRing` - Smooth 1s stroke-dashoffset transition
- `#settingsPage` - 0.25s opacity transition
- `#themeDropdown` - Popup animation
- `.tag-bubble` - Tag pill/badge style
- `#tagDropdown` - Dropdown animation
- `.color-swatch` - Color picker circle (24x24, hover/selected border)

### home.css (22 lines)
- Font: Inter (light 300, regular 400, semibold 600)
- `.home-clock` - 5rem, weight 300, letter-spacing -0.02em
- `.home-date` - 1.25rem, gray
- `.prayer-box` - Prayer times card (rounded, white bg, border, shadow)

### habits.css (7 lines)
- Font: Tajawal (Google Fonts)
- Custom scrollbar for habit table
- `.circular-progress` - CSS conic-gradient progress circle

### ahmeds-styles.css (199 lines)
- Session timeline container with fade edges
- `.session-timeline-scroll` - Horizontal scroll with thin scrollbar
- `.session-timeline-track` - Flex row for timeline nodes
- `.session-timeline-fade-left/right` - Linear gradient fog edges
- `@keyframes pulse-dot` - Pulsing animation for active session
- `#sessionTimelineModal` - Modal overlay with glassmorphism
- `.toggle-switch` - Settings toggle switch with animated knob
- `@keyframes modalIn` - Modal appear animation
- Zoom protection: restricted overflow on pomodoro page

---

## 8. Data Flow Diagrams

### Timer Flow
```
User clicks Start → toggleTimer() → startTimer() → onSessionStart()
  → tick() each second → updateRing() → formatTime()
  → remainingSeconds <= 0? → completeTimer() → onSessionComplete() → db.saveSession()

User clicks End → confirmEnd() → onSessionComplete() → db.saveSession()
```

### Session Edit Flow
```
Click session timeline node → openSessionPopup(id)
  → populate form fields → user edits → saveSessionEdit()
  → db.updateSession() → renderTimeline()
```

### Tag CRUD Flow
```
Click "New Tag" → openNewTagPopup()
  → fill name + color → saveNewTag() → db.saveTag()
  
Edit session → toggle tag dropdown → selectSessionTag(id)
  → saveSessionEdit() → db.updateSession()
```

### Habits Flow (index.html page)
```
Page load → render() → build table from hardcoded data
  → Click habit name → openModal(habit) → show stats
  → Click "Add Habit" → openAddModal() → color picker → alert (not saved to DB)
```

### Settings Flow
```
Click Settings gear → openSettings() → show settings page
  → Change storage path → selectStoragePath() → db.setPath()
  → Toggle task popup → toggleTaskPopup() → db.setSetting()
  → Save/Cancel → closeSettings() → return to last page
```

---

## 9. Known Issues & Incomplete Features

1. **Habits page (index.html)**: Habit data is hardcoded, not from DB. "Save habit" just alerts, doesn't persist to DB.
2. **Habits page (habits.html)**: Standalone page, same hardcoded data issue.
3. **No Goals feature**: Not implemented at all (will be built in this refactor).
4. **No Statistics page**: Not implemented.
5. **Sidebar icons only**: No text labels.
6. **Font licenses**: Apple fonts removed due to licensing; should use Noto_Sans_Arabic + Spectral from Fonts/ folder.
7. **Navigation**: Uses full page reload (loadFile), not SPA routing for home.html/habits.html.
8. **No RTL support**: Arabic UI (habits page) is separate HTML file.
9. **No content security policy** in Electron.
10. **sendSync IPC**: Multiple synchronous IPC calls could block the renderer.
11. **No update mechanism**: Manual update check only on app start.
12. **Habit modal "Edit"/"Delete" buttons**: Non-functional (no handlers).
13. **Session timeline modal tags**: Marked as "Coming soon".
14. **initStats()**: No-op function.
15. **Timer progress ring**: Uses hardcoded orange `#C85A17` (theme.js overrides to `#3B82F6`).

---

## 10. Dependencies Between Modules

```
main.js
  └── database.js (required)
  
src/index.html
  ├── storage.js (loaded first)
  ├── stats.js (loaded second)
  ├── timer.js (loaded third - uses updateSidebar from stats)
  ├── sessions.js (loaded fourth - patches timer functions)
  └── theme.js (loaded last - applies colors)

Dependency chain:
  storage.js → (no deps)
  stats.js → db.getTodayStats(), db.getTotalStats()
  timer.js → storage.js (for STORAGE), stats.js (for updateSidebar)
  sessions.js → timer.js (patches toggleTimer, completeTimer, etc.)
  theme.js → storage.js (for STORAGE.getPath)
```
