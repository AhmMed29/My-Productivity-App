window.initStats = function () {};

window.getStats = function () {
  var todayStats = window.db.getTodayStats();
  var totalStats = window.db.getTotalStats();
  return {
    todayPomos: todayStats.todayPomos,
    todayFocusMinutes: todayStats.todayFocusMinutes,
    totalPomos: totalStats.totalPomos,
    totalFocusMinutes: totalStats.totalFocusMinutes
  };
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
