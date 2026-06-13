// storage.js - file-based persistence layer
// Handles settings, migration from localStorage, and user-chosen data path

var STORAGE = {
  path: null
};

STORAGE.init = async function () {
  var defaultPath = await window.electronAPI.getDefaultPath();
  var settingsRaw = await window.electronAPI.readFile(defaultPath + '/settings.json');

  if (settingsRaw) {
    var settings = JSON.parse(settingsRaw);
    STORAGE.path = settings.dataPath || defaultPath;
  } else {
    STORAGE.path = defaultPath;
    // First run: migrate data from localStorage to files
    await STORAGE.migrate();
  }
};

STORAGE.migrate = async function () {
  var items = {};
  var keys = ['pomodoro_stats', 'pomodoro_sessions', 'pomodoro_tags', 'app_theme', 'last_pomodoro_minutes', 'zoom_factor'];
  for (var i = 0; i < keys.length; i++) {
    var val = localStorage.getItem(keys[i]);
    if (val) items[keys[i]] = val;
  }

  var mapping = {
    'pomodoro_stats': 'pomodoro-stats.json',
    'pomodoro_sessions': 'pomodoro-sessions.json',
    'pomodoro_tags': 'pomodoro-tags.json'
  };
  for (var key in mapping) {
    if (items[key]) {
      await window.electronAPI.writeFile(STORAGE.path + '/' + mapping[key], items[key]);
    }
  }

  var settings = {
    theme: items['app_theme'] || 'light',
    zoom: parseFloat(items['zoom_factor'] || '1'),
    timerMinutes: parseInt(items['last_pomodoro_minutes'] || '50'),
    dataPath: STORAGE.path
  };
  await window.electronAPI.writeFile(STORAGE.path + '/settings.json', JSON.stringify(settings, null, 2));
};

STORAGE.get = async function (filename) {
  var raw = await window.electronAPI.readFile(STORAGE.path + '/' + filename);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
};

STORAGE.set = async function (filename, data) {
  return await window.electronAPI.writeFile(STORAGE.path + '/' + filename, JSON.stringify(data, null, 2));
};

STORAGE.getPath = function () { return STORAGE.path; };

STORAGE.setPath = async function (newPath) {
  STORAGE.path = newPath;
  var settings = await STORAGE.get('settings.json') || {};
  settings.dataPath = newPath;
  await STORAGE.set('settings.json', settings);
};

// Run init automatically
(async function() {
  try { await STORAGE.init(); } catch(e) {}
})();
