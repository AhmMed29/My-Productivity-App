const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let db = null;
let dbPath = null;
var fallbackPath = null;

const MIGRATIONS = [
  function v1(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        createdAt INTEGER NOT NULL
      );

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
    `);
  }
];

function init(storagePath, defaultPath) {
  fallbackPath = defaultPath || storagePath;
  dbPath = path.join(storagePath, 'app.db');
  var dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  runMigrations();
}

function runMigrations() {
  var version = db.pragma('user_version', { simple: true });
  for (var i = version; i < MIGRATIONS.length; i++) {
    MIGRATIONS[i](db);
    db.pragma('user_version = ' + (i + 1));
  }
}

function getSetting(key) {
  try {
    var row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    return row ? row.value : null;
  } catch (e) { return null; }
}

function setSetting(key, value) {
  try {
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
    return true;
  } catch (e) { return false; }
}

function getAllSettings() {
  try {
    var rows = db.prepare('SELECT key, value FROM settings').all();
    var result = {};
    for (var i = 0; i < rows.length; i++) result[rows[i].key] = rows[i].value;
    return result;
  } catch (e) { return {}; }
}

function getTags() {
  try { return db.prepare('SELECT * FROM tags ORDER BY createdAt ASC').all(); }
  catch (e) { return []; }
}

function saveTag(tag) {
  try {
    db.prepare('INSERT OR REPLACE INTO tags (id, name, color, createdAt) VALUES (?, ?, ?, ?)').run(
      tag.id, tag.name, tag.color, tag.createdAt || Date.now()
    );
    return true;
  } catch (e) { return false; }
}

function deleteTag(id) {
  try {
    db.prepare('DELETE FROM tags WHERE id = ?').run(id);
    db.prepare('UPDATE sessions SET tagId = NULL WHERE tagId = ?').run(id);
    return true;
  } catch (e) { return false; }
}

function saveSession(session) {
  try {
    db.prepare(`
      INSERT OR REPLACE INTO sessions
      (id, startTime, endTime, plannedMinutes, focusMinutes, taskName, note, tagId, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      session.id,
      session.startTime,
      session.endTime,
      session.plannedMinutes,
      session.focusMinutes,
      session.taskName || '',
      session.note || '',
      session.tagId || null,
      session.createdAt || Date.now()
    );
    return true;
  } catch (e) { return false; }
}

function updateSession(id, taskName, tagId, note) {
  try {
    db.prepare('UPDATE sessions SET taskName = ?, tagId = ?, note = ? WHERE id = ?').run(
      taskName || '', tagId || null, note || '', id
    );
    return true;
  } catch (e) { return false; }
}

function getAllSessionsGrouped() {
  try {
    var rows = db.prepare('SELECT * FROM sessions ORDER BY startTime DESC').all();
    var grouped = {};
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var dateKey = new Date(r.startTime).toISOString().split('T')[0];
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(r);
    }
    return grouped;
  } catch (e) { return {}; }
}

function getTodayStats() {
  try {
    var today = new Date().toISOString().split('T')[0];
    var startMs = new Date(today).getTime();
    var endMs = new Date(today + 'T23:59:59.999').getTime();

    var row = db.prepare(`
      SELECT COUNT(*) as pomos, COALESCE(SUM(focusMinutes), 0) as minutes
      FROM sessions WHERE startTime >= ? AND startTime <= ?
    `).get(startMs, endMs);

    return { todayPomos: row.pomos, todayFocusMinutes: row.minutes };
  } catch (e) { return { todayPomos: 0, todayFocusMinutes: 0 }; }
}

function getTotalStats() {
  try {
    var row = db.prepare(`
      SELECT COUNT(*) as pomos, COALESCE(SUM(focusMinutes), 0) as minutes FROM sessions
    `).get();
    return { totalPomos: row.pomos, totalFocusMinutes: row.minutes };
  } catch (e) { return { totalPomos: 0, totalFocusMinutes: 0 }; }
}

function migrateFromJson(storagePath) {
  if (getSetting('_migrated') === 'true') return;

  var srcPath = storagePath;
  if (fallbackPath && fallbackPath !== storagePath) {
    if (fs.existsSync(path.join(fallbackPath, 'settings.json')) || fs.existsSync(path.join(fallbackPath, 'pomodoro-sessions.json'))) {
      srcPath = fallbackPath;
    }
  }

  var settingsPath = path.join(srcPath, 'settings.json');
  if (fs.existsSync(settingsPath)) {
    try {
      var data = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      for (var key in data) {
        if (key !== 'dataPath') setSetting(key, typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]));
      }
    } catch (e) {}
  }

  var tagsPath = path.join(srcPath, 'pomodoro-tags.json');
  if (fs.existsSync(tagsPath)) {
    try {
      var tags = JSON.parse(fs.readFileSync(tagsPath, 'utf-8'));
      for (var i = 0; i < tags.length; i++) {
        saveTag({ id: tags[i].id, name: tags[i].name, color: tags[i].color, createdAt: Date.now() });
      }
    } catch (e) {}
  }

  var sessionsPath = path.join(srcPath, 'pomodoro-sessions.json');
  if (fs.existsSync(sessionsPath)) {
    try {
      var grouped = JSON.parse(fs.readFileSync(sessionsPath, 'utf-8'));
      for (var dateKey in grouped) {
        var arr = grouped[dateKey];
        for (var j = 0; j < arr.length; j++) {
          var s = arr[j];
          saveSession({
            id: s.id,
            startTime: s.startTime,
            endTime: s.endTime,
            plannedMinutes: s.focusMinutes,
            focusMinutes: s.focusMinutes,
            taskName: s.taskName || '',
            note: s.note || '',
            tagId: s.tagId || null,
            createdAt: s.startTime
          });
        }
      }
    } catch (e) {}
  }

  var statsPath = path.join(srcPath, 'pomodoro-stats.json');
  if (fs.existsSync(statsPath)) {
    try {
      var stats = JSON.parse(fs.readFileSync(statsPath, 'utf-8'));
      if (stats.lastDate) setSetting('lastDate', stats.lastDate);
    } catch (e) {}
  }

  setSetting('_migrated', 'true');
}

function setPath(newStoragePath) {
  try {
    var oldDbPath = dbPath;
    var newDbPath = path.join(newStoragePath, 'app.db');
    var dir = path.dirname(newDbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    if (db) db.close();
    fs.copyFileSync(oldDbPath, newDbPath);
    dbPath = newDbPath;
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    runMigrations();
    return newStoragePath;
  } catch (e) { return null; }
}

function getPath() { return dbPath ? path.dirname(dbPath) : null; }

function close() {
  if (db) { try { db.close(); } catch (e) {} db = null; }
}

module.exports = {
  init, close, getSetting, setSetting, getAllSettings,
  getTags, saveTag, deleteTag,
  saveSession, updateSession, getAllSessionsGrouped,
  getTodayStats, getTotalStats,
  migrateFromJson, setPath, getPath
};
