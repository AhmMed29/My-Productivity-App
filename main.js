const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const database = require('./database')

let win
let storagePath = null

function determineStoragePath() {
  var defaultPath = path.join(app.getPath('userData'), 'data')
  var datadirPath = path.join(defaultPath, '.datadir')
  if (fs.existsSync(datadirPath)) {
    return fs.readFileSync(datadirPath, 'utf-8').trim()
  }
  var settingsPath = path.join(defaultPath, 'settings.json')
  if (fs.existsSync(settingsPath)) {
    try {
      var settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
      if (settings.dataPath) return settings.dataPath
    } catch (e) {}
  }
  return defaultPath
}

function createWindow () {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })
  win.loadFile('src/index.html')
}

app.whenReady().then(() => {
  storagePath = determineStoragePath()
  var defaultPath = path.join(app.getPath('userData'), 'data')
  database.init(storagePath, defaultPath)
  database.migrateFromJson(storagePath)
  createWindow()
})

ipcMain.on('minimize', () => win?.minimize())
ipcMain.on('maximize', () => {
  win?.isMaximized() ? win.unmaximize() : win?.maximize()
})
ipcMain.on('close', () => win?.close())

ipcMain.on('navigate', (e, page) => {
  win?.loadFile(path.join('src', page))
})

ipcMain.handle('read-file', async (e, filePath) => {
  try {
    if (!fs.existsSync(filePath)) return null
    return fs.readFileSync(filePath, 'utf-8')
  } catch { return null }
})

ipcMain.handle('write-file', async (e, filePath, data) => {
  try {
    var dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(filePath, data, 'utf-8')
    return true
  } catch { return false }
})

ipcMain.handle('select-folder', async () => {
  var result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory']
  })
  return result.canceled ? null : result.filePaths[0]
})

ipcMain.handle('get-default-path', async () => {
  return path.join(app.getPath('userData'), 'data')
})

// ---- SQLite Database IPC ----

ipcMain.handle('db:init', async () => {
  return storagePath
})

ipcMain.on('db:get-setting', (e, key) => {
  e.returnValue = database.getSetting(key)
})

ipcMain.handle('db:set-setting', async (e, key, value) => {
  return database.setSetting(key, value)
})

ipcMain.on('db:get-all-settings', (e) => {
  e.returnValue = database.getAllSettings()
})

ipcMain.on('db:get-tags', (e) => {
  e.returnValue = database.getTags()
})

ipcMain.handle('db:save-tag', async (e, tag) => {
  return database.saveTag(tag)
})

ipcMain.handle('db:delete-tag', async (e, id) => {
  return database.deleteTag(id)
})

ipcMain.on('db:get-sessions-grouped', (e) => {
  e.returnValue = database.getAllSessionsGrouped()
})

ipcMain.handle('db:save-session', async (e, session) => {
  return database.saveSession(session)
})

ipcMain.handle('db:update-session', async (e, id, taskName, tagId, note) => {
  return database.updateSession(id, taskName, tagId, note)
})

ipcMain.on('db:get-today-stats', (e) => {
  e.returnValue = database.getTodayStats()
})

ipcMain.on('db:get-total-stats', (e) => {
  e.returnValue = database.getTotalStats()
})

ipcMain.on('db:get-path', (e) => {
  e.returnValue = database.getPath()
})

ipcMain.handle('db:set-path', async (e, newPath) => {
  var fullPath = newPath + '/MyProductivityApp/data'
  var result = database.setPath(fullPath)
  if (result) {
    storagePath = result
    var defaultPath = path.join(app.getPath('userData'), 'data')
    try {
      fs.writeFileSync(path.join(defaultPath, '.datadir'), storagePath, 'utf-8')
    } catch (e) {}
  }
  return result
})
