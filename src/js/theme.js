// theme.js - theme system

var currentTheme = localStorage.getItem('app_theme') || 'light';
var previewTheme = currentTheme;

var themeColors = {
  light: { body: '#FAFAFA', sidebar: '#D4CDFB', main: '#FFFFFF', aside: '#FFFFFF', card: '#F5F6F8', titlebar: '#FFFFFF', ring: '#3B82F6', bgRing: '#F3F4F6' },
  night: { body: '#FFF5D6', sidebar: '#A898E0', main: '#FFF8E0', aside: '#FFF8E0', card: '#FFF0C0', titlebar: '#FFF8E0', ring: '#8A7CFB', bgRing: '#E8E0C8' },
  offwhite: { body: '#F0F0F0', sidebar: '#D1D1D1', main: '#F5F5F5', aside: '#F5F5F5', card: '#E8E8E8', titlebar: '#F5F5F5', ring: '#3B82F6', bgRing: '#E0E0E0' },
  classic: { body: '#FFFFFF', sidebar: '#1A1A1A', main: '#FFFFFF', aside: '#FFFFFF', card: '#F5F5F5', titlebar: '#FFFFFF', ring: '#000000', bgRing: '#E5E5E5' }
};
var themeNames = { light: 'Light', night: 'Night', offwhite: 'OffWhite', classic: 'Classic' };

function applyTheme(name) {
  var c = themeColors[name];
  if (!c) return;
  document.body.style.backgroundColor = c.body;
  var nav = document.getElementById('navSidebar');
  if (nav) nav.style.backgroundColor = c.sidebar;
  var main = document.getElementById('mainArea');
  if (main) main.style.backgroundColor = c.main;
  var aside = document.getElementById('asideArea');
  if (aside) aside.style.backgroundColor = c.aside;
  var tb = document.getElementById('titlebar');
  if (tb) tb.style.backgroundColor = c.titlebar;
  document.querySelectorAll('#asideArea .grid > div').forEach(function(el) { el.style.backgroundColor = c.card; });
  var ring = document.getElementById('progressRing');
  if (ring) ring.style.stroke = c.ring;
  var bg = document.getElementById('progressBg');
  if (bg) bg.style.stroke = c.bgRing || '#F3F4F6';
}

function openSettings() {
  previewTheme = currentTheme;
  var pc = document.getElementById('pomodoroContent');
  if (pc) pc.classList.add('hidden');
  var sc = document.getElementById('settingsContent');
  if (sc) sc.classList.remove('hidden');
  applyTheme(previewTheme);
  var stn = document.getElementById('selectedThemeName');
  if (stn) stn.textContent = themeNames[previewTheme];
  var spd = document.getElementById('storagePathDisplay');
  if (spd && typeof STORAGE !== 'undefined' && STORAGE.getPath) spd.textContent = STORAGE.getPath();
}

function closeSettings() {
  var sc = document.getElementById('settingsContent');
  if (sc) sc.classList.add('hidden');
  var pc = document.getElementById('pomodoroContent');
  if (pc) pc.classList.remove('hidden');
  applyTheme(currentTheme);
}

function toggleThemeDropdown() {
  var dd = document.getElementById('themeDropdown');
  if (dd) dd.classList.toggle('hidden');
}

function selectTheme(name) {
  previewTheme = name;
  var stn = document.getElementById('selectedThemeName');
  if (stn) stn.textContent = themeNames[name];
  var dd = document.getElementById('themeDropdown');
  if (dd) dd.classList.add('hidden');
  applyTheme(name);
}

function saveSettings() {
  currentTheme = previewTheme;
  localStorage.setItem('app_theme', currentTheme);
  closeSettings();
}

function cancelSettings() {
  closeSettings();
}

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

applyTheme(currentTheme);
