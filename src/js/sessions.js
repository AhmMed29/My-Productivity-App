// sessions.js - sessions and tags management (localStorage-based)

var SESSIONS_KEY = 'pomodoro_sessions';
var TAGS_KEY = 'pomodoro_tags';
var activeSession = null;
var editingSessionId = null;
var editingTagForSession = null;
var addSessionTagId = null;
var selectedTagColor = '#3B82F6';

function getTags() {
  var s = localStorage.getItem(TAGS_KEY);
  return s ? JSON.parse(s) : [];
}

function saveTags(tags) {
  localStorage.setItem(TAGS_KEY, JSON.stringify(tags));
}

function getSessions() {
  var s = localStorage.getItem(SESSIONS_KEY);
  return s ? JSON.parse(s) : {};
}

function saveSessions(sessions) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

function todayKey() {
  return new Date().toISOString().split('T')[0];
}

function formatTimeHM(ts) {
  var d = new Date(ts);
  var h = d.getHours(), m = d.getMinutes();
  var ampm = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return h + ':' + (m < 10 ? '0' : '') + m + ' ' + ampm;
}

function hexToRgb(hex) {
  var r = parseInt(hex.slice(1,3), 16);
  var g = parseInt(hex.slice(3,5), 16);
  var b = parseInt(hex.slice(5,7), 16);
  return r + ',' + g + ',' + b;
}

function renderTimeline() {
  var container = document.getElementById('focusTimeline');
  if (!container) return;
  var sessions = getSessions();
  var html = '<div class="absolute left-4 top-2 bottom-0 w-px bg-gray-100"></div>';

  var activeSessionHtml = '';

  if (activeSession) {
    var now = Date.now();
    var elapsedInCurrentRun = activeSession.lastResumeTime ? now - activeSession.lastResumeTime : 0;
    var totalElapsed = activeSession.accumulatedMs + elapsedInCurrentRun;
    var totalFocusMin = totalElapsed / 60000;
    var estimatedEnd = now + remainingSeconds * 1000;
    var timeRange = formatTimeHM(activeSession.startTime) + ' - ' + formatTimeHM(estimatedEnd);
    var durationText = totalFocusMin < 1 ? (Math.round(totalFocusMin * 60) + 's') : totalFocusMin.toFixed(1) + 'm';
    var tagHtml = '';
    if (activeSession.tagId) {
      var allTags = getTags();
      var tag = allTags.find(function(t) { return t.id === activeSession.tagId; });
      if (tag) {
        tagHtml = '<span class="tag-bubble" style="background:' + 'rgba(' + hexToRgb(tag.color) + ',0.12);color:' + tag.color + ';border:1px solid rgba(' + hexToRgb(tag.color) + ',0.25)">#' + tag.name + '</span>';
      }
    }

    activeSessionHtml += '<div class="flex items-start mb-4 relative z-10 group cursor-pointer" data-sid="' + activeSession.id + '">';
    activeSessionHtml += '<div class="w-6 h-6 rounded-full bg-purple-light flex items-center justify-center text-purple-brand mt-0.5 border-2 border-white relative -ml-1.5 opacity-70">';
    activeSessionHtml += '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z"></path></svg>';
    activeSessionHtml += '</div>';
    activeSessionHtml += '<div class="ml-3 flex-1">';
    activeSessionHtml += '<div class="flex justify-between items-baseline">';
    activeSessionHtml += '<span class="text-xs text-gray-400">' + timeRange + '</span>';
    activeSessionHtml += '<span class="text-xs text-gray-400">' + durationText + '</span>';
    activeSessionHtml += '</div>';
    if (activeSession.taskName) {
      activeSessionHtml += '<p class="text-sm text-gray-600 mt-0.5">' + activeSession.taskName + '</p>';
    }
    if (tagHtml) {
      activeSessionHtml += '<div class="mt-1">' + tagHtml + '</div>';
    }
    activeSessionHtml += '</div></div>';
  }

  var dates = Object.keys(sessions).sort().reverse();
  var today = todayKey();
  var todayRendered = false;

  for (var di = 0; di < dates.length; di++) {
    var dateStr = dates[di];
    var entries = sessions[dateStr];
    if (!entries || entries.length === 0) continue;
    var label = dateStr === today ? 'Today' : formatDateLabel(dateStr);
    html += '<div class="mb-6 relative">';
    html += '<div class="text-sm font-medium text-gray-400 mb-3 bg-white inline-block pr-2 relative z-10 -ml-3">' + label + '</div>';
    if (label === 'Today' && activeSessionHtml) {
      html += activeSessionHtml;
      todayRendered = true;
    }
    for (var ei = 0; ei < entries.length; ei++) {
      var e = entries[ei];
      var timeRange2 = formatTimeHM(e.startTime) + ' - ' + formatTimeHM(e.endTime);
      var durMin = e.focusMinutes;
      var durText = durMin < 1 ? (Math.round(durMin * 60) + 's') : (durMin < 10 ? durMin.toFixed(1) : Math.round(durMin)) + 'm';
      var tagHtml2 = '';
      if (e.tagId) {
        var allTags2 = getTags();
        var tag2 = allTags2.find(function(t) { return t.id === e.tagId; });
        if (tag2) {
          tagHtml2 = '<span class="tag-bubble" style="background:' + tag2.color + '20;color:' + tag2.color + ';border:1px solid ' + tag2.color + '40">#' + tag2.name + '</span>';
        }
      }
      html += '<div class="flex items-start mb-4 relative z-10 group cursor-pointer" data-sid="' + e.id + '">';
      html += '<div class="w-6 h-6 rounded-full bg-purple-light flex items-center justify-center text-purple-brand mt-0.5 border-2 border-white relative -ml-1.5">';
      html += '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z"></path></svg>';
      html += '</div>';
      html += '<div class="ml-3 flex-1">';
      html += '<div class="flex justify-between items-baseline">';
      html += '<span class="text-xs text-gray-400">' + timeRange2 + '</span>';
      html += '<span class="text-xs text-gray-400">' + durText + '</span>';
      html += '</div>';
      if (e.taskName) {
        html += '<p class="text-sm text-gray-600 mt-0.5">' + e.taskName + '</p>';
      }
      if (tagHtml2) {
        html += '<div class="mt-1">' + tagHtml2 + '</div>';
      }
      html += '</div></div>';
    }
    html += '</div>';
  }

  if (activeSessionHtml && !todayRendered) {
    html += '<div class="mb-6 relative">';
    html += '<div class="text-sm font-medium text-gray-400 mb-3 bg-white inline-block pr-2 relative z-10 -ml-3">Today</div>';
    html += activeSessionHtml;
    html += '</div>';
  }

  if (!activeSession && dates.length === 0) {
    html += '<div class="text-sm text-gray-400 text-center py-8">No sessions yet</div>';
  }

  container.innerHTML = html;
}

function formatDateLabel(dateStr) {
  var d = new Date(dateStr + 'T00:00:00');
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return months[d.getMonth()] + ' ' + d.getDate();
}

// Session event hooks
function onSessionStart() {
  if (activeSession) {
    activeSession = null;
  }
  activeSession = {
    id: 's_' + Date.now(),
    startTime: Date.now(),
    accumulatedMs: 0,
    lastResumeTime: Date.now(),
    taskName: '',
    tagId: null,
    status: 'running'
  };
  renderTimeline();
}

function onSessionPause() {
  if (!activeSession || !activeSession.lastResumeTime) return;
  activeSession.accumulatedMs += Date.now() - activeSession.lastResumeTime;
  activeSession.lastResumeTime = null;
  activeSession.status = 'paused';
  renderTimeline();
}

function onSessionResume() {
  if (!activeSession) return;
  activeSession.lastResumeTime = Date.now();
  activeSession.status = 'running';
  renderTimeline();
}

function onSessionComplete(focusMinutes) {
  if (!activeSession) return;
  if (activeSession.lastResumeTime) {
    activeSession.accumulatedMs += Date.now() - activeSession.lastResumeTime;
  }
  if (focusMinutes === undefined) {
    focusMinutes = activeSession.accumulatedMs / 60000;
  }
  var endTime = Date.now();
  var session = {
    id: activeSession.id,
    startTime: activeSession.startTime,
    endTime: endTime,
    focusMinutes: focusMinutes,
    taskName: activeSession.taskName || '',
    tagId: activeSession.tagId || null
  };
  var sessions = getSessions();
  var key = todayKey();
  if (!sessions[key]) sessions[key] = [];
  sessions[key].push(session);
  saveSessions(sessions);
  activeSession = null;
  renderTimeline();
}

function onSessionCancel() {
  if (!activeSession) return;
  activeSession = null;
  renderTimeline();
}

renderTimeline();

// Event delegation for timeline entries
document.addEventListener('click', function(e) {
  var el = e.target.closest('[data-sid]');
  if (el && document.getElementById('focusTimeline') && document.getElementById('focusTimeline').contains(el)) {
    var sid = el.getAttribute('data-sid');
    if (sid) window.openSessionPopup(sid);
  }
});

// Patch timer functions to hook into session tracking
var _origToggleTimer = window.toggleTimer;
window.toggleTimer = function() {
  if (remainingSeconds <= 0) { window.openTimePopup(); return; }
  if (isRunning) {
    _origToggleTimer();
    onSessionPause();
  } else {
    var isFresh = remainingSeconds === totalSeconds;
    _origToggleTimer();
    if (isFresh) onSessionStart(); else onSessionResume();
  }
};

var _origCompleteTimer = completeTimer;
completeTimer = function() {
  var sp = document.getElementById('sessionPopup');
  if (sp) sp.classList.add('hidden');
  var td = document.getElementById('tagDropdown');
  if (td) td.classList.add('hidden');
  var elapsedSec = totalSeconds - remainingSeconds;
  if (activeSession && activeSession.lastResumeTime) {
    activeSession.accumulatedMs += Date.now() - activeSession.lastResumeTime;
    activeSession.lastResumeTime = null;
  }
  _origCompleteTimer();
  onSessionComplete(elapsedSec / 60);
};

var _origConfirmEnd = window.confirmEnd;
window.confirmEnd = function() {
  var sp = document.getElementById('sessionPopup');
  if (sp) sp.classList.add('hidden');
  var td = document.getElementById('tagDropdown');
  if (td) td.classList.add('hidden');
  var elapsedSec = totalSeconds - remainingSeconds;
  if (activeSession && activeSession.lastResumeTime) {
    activeSession.accumulatedMs += Date.now() - activeSession.lastResumeTime;
    activeSession.lastResumeTime = null;
  }
  _origConfirmEnd();
  onSessionComplete(elapsedSec / 60);
};

var _origSetTimer = window.setTimer;
window.setTimer = function() {
  _origSetTimer();
  onSessionCancel();
};

// Tag selection functions
window.selectSessionTag = function(tagId) {
  editingTagForSession = tagId;
  renderSessionTagDisplay();
  var td = document.getElementById('tagDropdown');
  if (td) td.classList.add('hidden');
};

window.selectAddSessionTag = function(tagId) {
  addSessionTagId = tagId;
  renderAddSessionTagDisplay();
  var td = document.getElementById('addTagDropdown');
  if (td) td.classList.add('hidden');
};

function renderTagList(listId, mode) {
  var container = document.getElementById(listId);
  if (!container) return;
  var tags = getTags();
  if (tags.length === 0) {
    container.innerHTML = '<div class="text-xs text-gray-400 px-3 py-2">No tags yet</div>';
    return;
  }
  var html = '';
  var fn = mode === 'edit' ? 'selectSessionTag' : 'selectAddSessionTag';
  for (var i = 0; i < tags.length; i++) {
    var t = tags[i];
    html += '<div class="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer text-sm" onclick="window.' + fn + '(\'' + t.id + '\')">';
    html += '<span class="w-3 h-3 rounded-full" style="background:' + t.color + '"></span>';
    html += '<span class="text-gray-700">' + t.name + '</span>';
    html += '</div>';
  }
  container.innerHTML = html;
}

window.toggleTagDropdown = function(e) {
  e.stopPropagation();
  var dd = document.getElementById('tagDropdown');
  if (!dd) return;
  dd.classList.toggle('hidden');
  if (!dd.classList.contains('hidden')) {
    renderTagList('tagList', 'edit');
  }
};

window.toggleAddTagDropdown = function(e) {
  e.stopPropagation();
  var dd = document.getElementById('addTagDropdown');
  if (!dd) return;
  dd.classList.toggle('hidden');
  if (!dd.classList.contains('hidden')) {
    renderTagList('addTagList', 'add');
  }
};

window.openSessionPopup = function(sessionId) {
  editingSessionId = sessionId;
  var session = null;
  if (activeSession && activeSession.id === sessionId) {
    session = activeSession;
  } else {
    var sessions = getSessions();
    var keys = Object.keys(sessions);
    for (var k = 0; k < keys.length; k++) {
      for (var e = 0; e < sessions[keys[k]].length; e++) {
        if (sessions[keys[k]][e].id === sessionId) {
          session = sessions[keys[k]][e];
          break;
        }
      }
      if (session) break;
    }
  }
  if (!session) return;
  var input = document.getElementById('sessionTaskInput');
  if (input) input.value = session.taskName || '';
  editingTagForSession = session.tagId || null;
  renderSessionTagDisplay();
  var popup = document.getElementById('sessionPopup');
  if (popup) popup.classList.remove('hidden');
};

window.closeSessionPopup = function(e) {
  if (!e || e.target === e.currentTarget) {
    var popup = document.getElementById('sessionPopup');
    if (popup) popup.classList.add('hidden');
    var td = document.getElementById('tagDropdown');
    if (td) td.classList.add('hidden');
  }
};

window.saveSessionEdit = function() {
  var taskName = (document.getElementById('sessionTaskInput').value || '').trim();
  if (activeSession && activeSession.id === editingSessionId) {
    activeSession.taskName = taskName;
    activeSession.tagId = editingTagForSession;
    renderTimeline();
    var popup = document.getElementById('sessionPopup');
    if (popup) popup.classList.add('hidden');
    return;
  }
  var sessions = getSessions();
  var keys = Object.keys(sessions);
  for (var k = 0; k < keys.length; k++) {
    for (var e = 0; e < sessions[keys[k]].length; e++) {
      if (sessions[keys[k]][e].id === editingSessionId) {
        sessions[keys[k]][e].taskName = taskName;
        sessions[keys[k]][e].tagId = editingTagForSession;
        saveSessions(sessions);
        renderTimeline();
        var popup = document.getElementById('sessionPopup');
        if (popup) popup.classList.add('hidden');
        return;
      }
    }
  }
};

function renderSessionTagDisplay() {
  var container = document.getElementById('sessionTagDisplay');
  if (!container) return;
  if (editingTagForSession) {
    var tags = getTags();
    var tag = tags.find(function(t) { return t.id === editingTagForSession; });
    if (tag) {
      container.innerHTML = '<span class="tag-bubble" style="background:' + 'rgba(' + hexToRgb(tag.color) + ',0.12);color:' + tag.color + ';border:1px solid rgba(' + hexToRgb(tag.color) + ',0.25)">#' + tag.name + ' <span style="cursor:pointer;margin-left:4px" onclick="window.clearSessionTag()">✕</span></span>';
      return;
    }
  }
  container.innerHTML = '<span class="text-xs text-gray-400">None selected</span>';
}

window.clearSessionTag = function() {
  editingTagForSession = null;
  renderSessionTagDisplay();
  var td = document.getElementById('tagDropdown');
  if (td) td.classList.add('hidden');
};

// New Tag Popup
var PALETTE = ['#3B82F6','#8A7CFB','#EC4899','#EF4444','#F59E0B','#10B981','#14B8A6','#6366F1','#84CC16','#06B4D0'];

window.openNewTagPopup = function() {
  var td1 = document.getElementById('tagDropdown');
  if (td1) td1.classList.add('hidden');
  var td2 = document.getElementById('addTagDropdown');
  if (td2) td2.classList.add('hidden');
  var inp = document.getElementById('newTagNameInput');
  if (inp) inp.value = '';
  selectedTagColor = PALETTE[0];
  renderColorPalette();
  var popup = document.getElementById('newTagPopup');
  if (popup) popup.classList.remove('hidden');
  setTimeout(function() { var inp2 = document.getElementById('newTagNameInput'); if (inp2) inp2.focus(); }, 100);
};

window.closeNewTagPopup = function(e) {
  if (!e || e.target === e.currentTarget) {
    var popup = document.getElementById('newTagPopup');
    if (popup) popup.classList.add('hidden');
  }
};

function renderColorPalette() {
  var container = document.getElementById('colorPalette');
  if (!container) return;
  var html = '';
  for (var i = 0; i < PALETTE.length; i++) {
    html += '<div class="color-swatch' + (PALETTE[i] === selectedTagColor ? ' selected' : '') + '" style="background:' + PALETTE[i] + '" onclick="window.selectTagColor(\'' + PALETTE[i] + '\')"></div>';
  }
  container.innerHTML = html;
}

window.selectTagColor = function(color) {
  selectedTagColor = color;
  renderColorPalette();
};

window.saveNewTag = function() {
  var name = (document.getElementById('newTagNameInput').value || '').trim();
  if (!name) return;
  var tags = getTags();
  var newTag = { id: 'tag_' + Date.now(), name: name, color: selectedTagColor };
  tags.push(newTag);
  saveTags(tags);
  var popup = document.getElementById('newTagPopup');
  if (popup) popup.classList.add('hidden');
};

// Add Session Popup
window.openAddSessionPopup = function() {
  var inp1 = document.getElementById('addSessionTaskInput');
  var inp2 = document.getElementById('addSessionDurationInput');
  if (inp1) inp1.value = '';
  if (inp2) inp2.value = '25';
  addSessionTagId = null;
  renderAddSessionTagDisplay();
  var popup = document.getElementById('addSessionPopup');
  if (popup) popup.classList.remove('hidden');
};

window.closeAddSessionPopup = function(e) {
  if (!e || e.target === e.currentTarget) {
    var popup = document.getElementById('addSessionPopup');
    if (popup) popup.classList.add('hidden');
    var td = document.getElementById('addTagDropdown');
    if (td) td.classList.add('hidden');
  }
};

window.saveAddSession = function() {
  var taskName = (document.getElementById('addSessionTaskInput').value || '').trim();
  var duration = parseFloat(document.getElementById('addSessionDurationInput').value) || 25;
  var now = Date.now();
  var session = {
    id: 's_' + now,
    startTime: now - duration * 60000,
    endTime: now,
    focusMinutes: duration,
    taskName: taskName,
    tagId: addSessionTagId || null
  };
  var sessions = getSessions();
  var key = todayKey();
  if (!sessions[key]) sessions[key] = [];
  sessions[key].push(session);
  saveSessions(sessions);
  renderTimeline();
  var popup = document.getElementById('addSessionPopup');
  if (popup) popup.classList.add('hidden');
};

function renderAddSessionTagDisplay() {
  var container = document.getElementById('addSessionTagDisplay');
  if (!container) return;
  if (addSessionTagId) {
    var tags = getTags();
    var tag = tags.find(function(t) { return t.id === addSessionTagId; });
    if (tag) {
      container.innerHTML = '<span class="tag-bubble" style="background:' + 'rgba(' + hexToRgb(tag.color) + ',0.12);color:' + tag.color + ';border:1px solid rgba(' + hexToRgb(tag.color) + ',0.25)">#' + tag.name + ' <span style="cursor:pointer;margin-left:4px" onclick="window.clearAddSessionTag()">✕</span></span>';
      return;
    }
  }
  container.innerHTML = '<span class="text-xs text-gray-400">None selected</span>';
}

window.clearAddSessionTag = function() {
  addSessionTagId = null;
  renderAddSessionTagDisplay();
  var td = document.getElementById('addTagDropdown');
  if (td) td.classList.add('hidden');
};

renderTimeline();
