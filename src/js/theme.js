function applyTheme() {
  document.body.style.backgroundColor = '#FAFAFA';
  var nav = document.getElementById('navSidebar');
  if (nav) nav.style.backgroundColor = '#3B82F6';
  var tb = document.getElementById('titlebar');
  if (tb) tb.style.backgroundColor = '#FFFFFF';
  var startBtn = document.getElementById('startBtn');
  if (startBtn) startBtn.style.backgroundColor = '#3B82F6';
  var endBtn = document.getElementById('endBtn');
  if (endBtn) endBtn.style.backgroundColor = '#EF4444';
  var main = document.getElementById('mainArea');
  if (main) main.style.backgroundColor = '#FFFFFF';
  var aside = document.getElementById('asideArea');
  if (aside) aside.style.backgroundColor = '#FFFFFF';
  document.querySelectorAll('#asideArea .grid > div').forEach(function(el) { el.style.backgroundColor = '#F5F6F8'; });
  var bg = document.getElementById('progressBg');
  if (bg) bg.style.stroke = '#F3F4F6';
}

function openSettings() {
  var pages = ['home', 'pomodoro', 'habits'];
  for (var i = 0; i < pages.length; i++) {
    var el = document.getElementById('page-' + pages[i]);
    if (el && !el.classList.contains('hidden')) {
      window.db.setSetting('lastPage', pages[i]);
      break;
    }
  }
  showPage('settings');
  var spd = document.getElementById('storagePathDisplay');
  if (spd && typeof STORAGE !== 'undefined' && STORAGE.getPath) spd.textContent = STORAGE.getPath();
}

function closeSettings() {
  var prev = window.db.getSetting('lastPage') || 'pomodoro';
  showPage(prev);
}

function saveSettings() { closeSettings(); }

function cancelSettings() { closeSettings(); }

function selectStoragePath() {
  if (typeof STORAGE === 'undefined' || !STORAGE.getPath) return;
  window.electronAPI.selectFolder().then(function(newPath) {
    if (newPath) {
      STORAGE.setPath(newPath);
      var spd = document.getElementById('storagePathDisplay');
      if (spd) spd.textContent = newPath;
    }
  });
}

applyTheme();
