// stats.js - pomodoro statistics (localStorage-based, same as original)

var STATS_KEY = 'pomodoro_stats';
var DURATION_KEY = 'last_pomodoro_minutes';

window.initStats = function () {
  var stats = JSON.parse(localStorage.getItem(STATS_KEY));
  var today = new Date().toISOString().split('T')[0];
  if (!stats) {
    stats = { todayPomos: 0, todayFocusMinutes: 0, totalPomos: 0, totalFocusMinutes: 0, lastDate: today };
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } else if (stats.lastDate !== today) {
    stats.todayPomos = 0;
    stats.todayFocusMinutes = 0;
    stats.lastDate = today;
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }
};

window.getStats = function () {
  var s = localStorage.getItem(STATS_KEY);
  return s ? JSON.parse(s) : { todayPomos: 0, todayFocusMinutes: 0, totalPomos: 0, totalFocusMinutes: 0, lastDate: new Date().toISOString().split('T')[0] };
};

window.updateSidebar = function () {
  var stats = window.getStats();
  var el = function(id) { return document.getElementById(id); };
  if (el('todayPomosValue')) el('todayPomosValue').textContent = stats.todayPomos;
  if (el('todayDurationValue')) el('todayDurationValue').textContent = stats.todayFocusMinutes.toFixed(1);
  if (el('totalPomosValue')) el('totalPomosValue').textContent = stats.totalPomos;
  var totalM = stats.totalFocusMinutes;
  if (el('totalDurationHours')) el('totalDurationHours').textContent = Math.floor(totalM / 60);
  if (el('totalDurationMins')) el('totalDurationMins').textContent = Math.floor(totalM % 60);
};
