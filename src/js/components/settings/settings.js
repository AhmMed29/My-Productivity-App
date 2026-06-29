var _pomoTheme = 'ocean';
var _customColors = { c1: null, c2: null, bg: null };

function markDirty() {
  if (!window.settingsDirty) {
    window.settingsDirty = true;
    var row = document.getElementById('settingsBtnRow');
    if (row) row.style.display = 'flex';
    var cancel = document.getElementById('settingsCancelBtn');
    if (cancel) cancel.style.display = 'none';
  }
}

function buildThemeCards() {
  var grid = document.getElementById('pomoThemeGrid');
  if (!grid) return;
  var themeKeys = Object.keys(window.shaderThemes || {});
  grid.innerHTML = '';
  themeKeys.forEach(function(key) {
    var t = window.shaderThemes[key];
    var card = document.createElement('div');
    card.className = 'rounded-xl p-3 border-2 cursor-pointer transition-all hover:shadow-md text-center min-h-[80px] flex flex-col items-center justify-center gap-1';
    card.id = 'pomoCard_' + key;
    card.style.background = t.preview[2];
    card.innerHTML = '<div class="flex gap-1.5"><span class="w-4 h-4 rounded-full inline-block" style="background:' + t.preview[0] + '"></span><span class="w-4 h-4 rounded-full inline-block" style="background:' + t.preview[1] + '"></span><span class="w-4 h-4 rounded-full inline-block border border-gray-400" style="background:' + t.preview[2] + '"></span></div><span class="text-xs font-medium" style="color:' + (t.preview[2] === '#000' ? '#ccc' : '#333') + '">' + t.label + '</span>';
    card.onclick = function() { selectPomoTheme(key); };
    grid.appendChild(card);
  });
  // Add minimal theme card (not in shader themes)
  var minCard = document.createElement('div');
  minCard.className = 'rounded-xl p-3 border-2 border-dashed cursor-pointer transition-all hover:shadow-md text-center min-h-[80px] flex flex-col items-center justify-center gap-1';
  minCard.id = 'pomoCard_minimal';
  minCard.style.background = '#f8f9ff';
  minCard.style.borderColor = '#D1D5DB';
  minCard.innerHTML = '<div style="font-size:18px;font-weight:800;color:#0b1c30;letter-spacing:1px">25:00</div><span class="text-xs font-medium" style="color:#0b1c30;font-weight:600">بسيط</span>';
  minCard.onclick = function() { selectPomoTheme('minimal'); };
  grid.appendChild(minCard);

  document.getElementById('customColor1').value = '#0088CC';
  document.getElementById('customColor2').value = '#4DA8DA';
  document.getElementById('customBgColor').value = '#000000';
}

function selectPomoTheme(id, suppressDirty) {
  _pomoTheme = id;
  _customColors = { c1: null, c2: null, bg: null };
  var themeKeys = Object.keys(window.shaderThemes || {});
  themeKeys.forEach(function(key) {
    var card = document.getElementById('pomoCard_' + key);
    if (card) card.className = 'rounded-xl p-3 border-2 cursor-pointer transition-all hover:shadow-md text-center min-h-[80px] flex flex-col items-center justify-center gap-1' + (id === key ? ' border-blue-500 ring-2 ring-blue-300' : ' border-gray-200');
  });
  var minCard = document.getElementById('pomoCard_minimal');
  if (minCard) minCard.className = 'rounded-xl p-3 border-2 border-dashed cursor-pointer transition-all hover:shadow-md text-center min-h-[80px] flex flex-col items-center justify-center gap-1' + (id === 'minimal' ? ' border-blue-500 ring-2 ring-blue-300' : ' border-gray-200');

  var colorsBox = document.getElementById('customColorsBox');
  if (id === 'minimal') {
    if (colorsBox) colorsBox.style.display = 'none';
  } else {
    if (colorsBox) colorsBox.style.display = 'block';
  }

  if (id !== 'minimal') {
    var t = window.shaderThemes[id];
    if (t) {
      document.getElementById('customColor1').value = t.preview[0];
      document.getElementById('customColor2').value = t.preview[1];
      document.getElementById('customBgColor').value = t.preview[2];
      if (window.shaderSetTheme) window.shaderSetTheme(id);
    }
  }

  // Apply minimal mode on timer page
  var circle = document.getElementById('timerCircle');
  if (circle) {
    if (id === 'minimal') {
      circle.classList.add('minimal-mode');
    } else {
      circle.classList.remove('minimal-mode');
    }
  }
  // Re-init shader if needed
  if (id !== 'minimal' && _shaderInstance === null && window.initPomoShader) {
    window.initPomoShader();
  } else if (id === 'minimal' && _shaderInstance !== null && window.destroyPomoShader) {
    window.destroyPomoShader();
  } else if (id !== 'minimal' && _shaderInstance) {
    if (window.shaderSetTheme) window.shaderSetTheme(id);
  }

  if (!suppressDirty) markDirty();
}

function applyCustomColors() {
  var c1 = document.getElementById('customColor1').value;
  var c2 = document.getElementById('customColor2').value;
  var bg = document.getElementById('customBgColor').value;
  _customColors = { c1: hexToRgb(c1), c2: hexToRgb(c2), bg: hexToRgb(bg) };
  _pomoTheme = 'custom';
  var themeKeys = Object.keys(window.shaderThemes || {});
  themeKeys.forEach(function(key) {
    var card = document.getElementById('pomoCard_' + key);
    if (card) card.className = 'rounded-xl p-3 border-2 border-gray-200 cursor-pointer transition-all hover:shadow-md text-center min-h-[80px] flex flex-col items-center justify-center gap-1';
  });
  var minCard = document.getElementById('pomoCard_minimal');
  if (minCard) minCard.className = 'rounded-xl p-3 border-2 border-dashed border-gray-200 cursor-pointer transition-all hover:shadow-md text-center min-h-[80px] flex flex-col items-center justify-center gap-1';
  if (window.shaderSetColors) window.shaderSetColors(_customColors.c1, _customColors.c2, _customColors.bg);
  var circle = document.getElementById('timerCircle');
  if (circle) circle.classList.remove('minimal-mode');
  markDirty();
}

;(async function(){
  var savedTheme = await window.db.getSetting('pomoTheme') || 'ocean';
  if (savedTheme === 'custom') {
    var cc1 = await window.db.getSetting('customColor1');
    var cc2 = await window.db.getSetting('customColor2');
    var cbg = await window.db.getSetting('customBgColor');
    if (cc1 && cc2 && cbg) {
      document.getElementById('customColor1').value = cc1;
      document.getElementById('customColor2').value = cc2;
      document.getElementById('customBgColor').value = cbg;
    }
  }
})().then(function() {
  // Load saved theme on init
  window.db.getSetting('pomoTheme').then(function(savedTheme) {
    var _savedTheme = savedTheme || 'ocean';
    if (typeof(window.shaderThemes) !== 'undefined') buildThemeCards();
    if (_savedTheme !== 'custom' && _savedTheme !== 'minimal') {
      _pomoTheme = _savedTheme;
      selectPomoTheme(_savedTheme, true);
    } else {
      _pomoTheme = _savedTheme;
      if (_savedTheme === 'minimal') {
        selectPomoTheme('minimal', true);
      } else {
        window.settingsDirty = false;
      }
    }
  });

  // Apply saved custom colors without marking dirty
  window.db.getSetting('pomoTheme').then(function(savedTheme) {
    if (savedTheme === 'custom' && window.shaderSetColors) {
      window.db.getSetting('customColor1').then(function(cc1) {
        window.db.getSetting('customColor2').then(function(cc2) {
          window.db.getSetting('customBgColor').then(function(cbg) {
            if (cc1 && cc2 && cbg) {
              _customColors = { c1: hexToRgb(cc1), c2: hexToRgb(cc2), bg: hexToRgb(cbg) };
              window.shaderSetColors(_customColors.c1, _customColors.c2, _customColors.bg);
            }
            window.settingsDirty = false;
          });
        });
      });
    } else {
      window.settingsDirty = false;
    }
  });
});

// Dirty tracking + live preview for color inputs
var _c1 = document.getElementById('customColor1');
var _c2 = document.getElementById('customColor2');
var _cbg = document.getElementById('customBgColor');
if (_c1) { _c1.addEventListener('input', function() { applyCustomColors(); }); }
if (_c2) { _c2.addEventListener('input', function() { applyCustomColors(); }); }
if (_cbg) { _cbg.addEventListener('input', function() { applyCustomColors(); }); }

// Reset dirty flag after init
setTimeout(function() {
  window.settingsDirty = false;
  var row = document.getElementById('settingsBtnRow');
  if (row) row.style.display = 'none';
}, 300);

window.toggleTaskPopup = function() {
  document.getElementById('taskPopupToggle').classList.toggle('active');
  markDirty();
};

window.togglePomoSound = function() {
  document.getElementById('pomoSoundToggle').classList.toggle('active');
  markDirty();
};

;(async function() {
  var toggle = document.getElementById('taskPopupToggle');
  if (toggle) {
    var tp = await window.db.getSetting('taskPopup');
    if (tp === 'false') toggle.classList.remove('active');
  }
  var soundToggle = document.getElementById('pomoSoundToggle');
  if (soundToggle) {
    var ps = await window.db.getSetting('playPomoSound');
    if (ps === 'false') soundToggle.classList.remove('active');
  }
})();

window.saveSettings = async function() {
  var taskPopup = document.getElementById('taskPopupToggle').classList.contains('active');
  await window.db.setSetting('taskPopup', taskPopup ? 'true' : 'false');

  var playSound = document.getElementById('pomoSoundToggle').classList.contains('active');
  await window.db.setSetting('playPomoSound', playSound ? 'true' : 'false');

  await window.db.setSetting('pomoTheme', _pomoTheme);

  if (_pomoTheme === 'custom' || (_customColors.c1 && _pomoTheme !== 'minimal')) {
    await window.db.setSetting('customColor1', document.getElementById('customColor1').value);
    await window.db.setSetting('customColor2', document.getElementById('customColor2').value);
    await window.db.setSetting('customBgColor', document.getElementById('customBgColor').value);
  }

  // Save timer durations
  var w = parseInt(document.getElementById('settingWork').value) || 25;
  var sb = parseInt(document.getElementById('settingShortBreak').value) || 5;
  var lb = parseInt(document.getElementById('settingLongBreak').value) || 15;
  if (w < 1) w = 1; if (w > 90) w = 90;
  if (sb < 1) sb = 1; if (sb > 30) sb = 30;
  if (lb < 1) lb = 1; if (lb > 60) lb = 60;
  await window.db.setSetting('workMinutes', w);
  await window.db.setSetting('shortBreakMinutes', sb);
  await window.db.setSetting('longBreakMinutes', lb);

  document.getElementById('settingWork').value = w;
  document.getElementById('settingShortBreak').value = sb;
  document.getElementById('settingLongBreak').value = lb;

  // Update shader live (if on pomodoro page)
  if (_pomoTheme === 'custom' || (_customColors.c1 && _pomoTheme !== 'minimal')) {
    var sc1 = document.getElementById('customColor1').value;
    var sc2 = document.getElementById('customColor2').value;
    var sbg = document.getElementById('customBgColor').value;
    if (window.shaderSetColors && sc1 && sc2 && sbg) {
      window.shaderSetColors(hexToRgb(sc1), hexToRgb(sc2), hexToRgb(sbg));
    }
  } else if (_pomoTheme !== 'minimal' && window.shaderSetTheme) {
    window.shaderSetTheme(_pomoTheme);
  } else if (_pomoTheme === 'minimal' && window.destroyPomoShader) {
    window.destroyPomoShader();
  }

  window.settingsDirty = false;
  var row = document.getElementById('settingsBtnRow');
  if (row) row.style.display = 'none';
  var cancel = document.getElementById('settingsCancelBtn');
  if (cancel) cancel.style.display = '';
  document.getElementById('settingsModal').style.display = 'none';
};

window.cancelSettings = async function() {
  var taskEl = document.getElementById('taskPopupToggle');
  var savedTaskPopup = await window.db.getSetting('taskPopup');
  if (savedTaskPopup === 'false') taskEl.classList.remove('active');
  else taskEl.classList.add('active');

  var soundEl = document.getElementById('pomoSoundToggle');
  var savedSound = await window.db.getSetting('playPomoSound');
  if (savedSound === 'false') soundEl.classList.remove('active');
  else soundEl.classList.add('active');

  var savedTheme = await window.db.getSetting('pomoTheme') || 'ocean';
  if (savedTheme !== 'custom' && savedTheme !== 'minimal') {
    _pomoTheme = savedTheme;
    selectPomoTheme(savedTheme, true);
  } else if (savedTheme === 'minimal') {
    _pomoTheme = 'minimal';
    selectPomoTheme('minimal', true);
  } else {
    var cc1 = await window.db.getSetting('customColor1');
    var cc2 = await window.db.getSetting('customColor2');
    var cbg = await window.db.getSetting('customBgColor');
    if (cc1 && cc2 && cbg) {
      document.getElementById('customColor1').value = cc1;
      document.getElementById('customColor2').value = cc2;
      document.getElementById('customBgColor').value = cbg;
      _customColors = { c1: hexToRgb(cc1), c2: hexToRgb(cc2), bg: hexToRgb(cbg) };
      _pomoTheme = 'custom';
      if (window.shaderSetColors) window.shaderSetColors(_customColors.c1, _customColors.c2, _customColors.bg);
    }
  }

  // Restore timer durations from DB
  var w = parseInt(await window.db.getSetting('workMinutes')) || 25;
  var sb = parseInt(await window.db.getSetting('shortBreakMinutes')) || 5;
  var lb = parseInt(await window.db.getSetting('longBreakMinutes')) || 15;
  document.getElementById('settingWork').value = w;
  document.getElementById('settingShortBreak').value = sb;
  document.getElementById('settingLongBreak').value = lb;

  window.settingsDirty = false;
  var row = document.getElementById('settingsBtnRow');
  if (row) row.style.display = 'none';
  var cancel = document.getElementById('settingsCancelBtn');
  if (cancel) cancel.style.display = '';
};

// Tab switching
window.switchSettingsTab = function(tab) {
  var tabs = document.querySelectorAll('.settings-tab-btn');
  var panes = ['general', 'pomodoro', 'storage'];
  var titleMap = { general:'General', pomodoro:'Pomodoro', storage:'Storage' };

  tabs.forEach(function(btn) {
    var isActive = btn.dataset.tab === tab;
    btn.style.background = isActive ? '#dce9ff' : 'transparent';
    btn.style.color = isActive ? '#0e58c5' : '#4B5563';
    btn.style.fontWeight = isActive ? '600' : '500';
  });

  panes.forEach(function(p) {
    var el = document.getElementById('pane' + p.charAt(0).toUpperCase() + p.slice(1));
    if (el) el.style.display = p === tab ? 'block' : 'none';
  });

  var title = document.getElementById('settingsTabTitle');
  if (title) title.textContent = titleMap[tab] || tab;
};
