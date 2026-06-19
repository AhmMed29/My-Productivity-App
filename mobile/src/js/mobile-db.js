/* mobile-db.js - Database layer for mobile (placeholder: localStorage)
   Same API as desktop window.db, swappable to @capacitor-community/sqlite later */

function getStore(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') } catch(e) { return null }
}
function setStore(key, val) { localStorage.setItem(key, JSON.stringify(val)) }

function todayKey() { return new Date().toISOString().split('T')[0] }

window.db = {
  init: function() { return Promise.resolve('local') },
  setPath: function() { return false },
  getPath: function() { return 'local' },
  getSetting: function(key) {
    var all = getStore('settings') || {};
    return all[key] !== undefined ? String(all[key]) : null;
  },
  setSetting: function(key, value) {
    var all = getStore('settings') || {};
    all[key] = value;
    setStore('settings', all);
  },
  getAllSettings: function() {
    return getStore('settings') || {};
  },
  getTags: function() {
    return getStore('tags') || [];
  },
  saveTag: function(tag) {
    var tags = getStore('tags') || [];
    var idx = -1;
    for (var i = 0; i < tags.length; i++) {
      if (tags[i].id === tag.id) { idx = i; break; }
    }
    if (idx >= 0) tags[idx] = tag; else tags.push(tag);
    setStore('tags', tags);
  },
  deleteTag: function(id) {
    var tags = getStore('tags') || [];
    setStore('tags', tags.filter(function(t) { return t.id !== id; }));
  },
  getSessionsGrouped: function() {
    return getStore('sessionsGrouped') || {};
  },
  saveSession: function(session) {
    var grouped = getStore('sessionsGrouped') || {};
    var key = new Date(session.startTime).toISOString().split('T')[0];
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(session);
    setStore('sessionsGrouped', grouped);
  },
  updateSession: function(id, taskName, tagId, note) {
    var grouped = getStore('sessionsGrouped') || {};
    var keys = Object.keys(grouped);
    for (var k = 0; k < keys.length; k++) {
      for (var i = 0; i < grouped[keys[k]].length; i++) {
        if (grouped[keys[k]][i].id === id) {
          if (taskName !== undefined && taskName !== null) grouped[keys[k]][i].taskName = taskName;
          if (tagId !== undefined) grouped[keys[k]][i].tagId = tagId;
          if (note !== undefined) grouped[keys[k]][i].note = note;
          setStore('sessionsGrouped', grouped);
          return;
        }
      }
    }
  },
  getTodayStats: function() {
    var grouped = getStore('sessionsGrouped') || {};
    var key = todayKey();
    var list = grouped[key] || [];
    var minutes = 0;
    for (var i = 0; i < list.length; i++) {
      minutes += list[i].focusMinutes || 0;
    }
    return { todayPomos: list.length, todayFocusMinutes: minutes };
  },
  getTotalStats: function() {
    var grouped = getStore('sessionsGrouped') || {};
    var minutes = 0;
    var pomos = 0;
    var keys = Object.keys(grouped);
    for (var k = 0; k < keys.length; k++) {
      for (var i = 0; i < grouped[keys[k]].length; i++) {
        minutes += grouped[keys[k]][i].focusMinutes || 0;
        pomos++;
      }
    }
    return { totalPomos: pomos, totalFocusMinutes: minutes };
  }
};
