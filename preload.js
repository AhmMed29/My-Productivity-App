const { contextBridge, ipcRenderer, webFrame } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('minimize'),
  maximize: () => ipcRenderer.send('maximize'),
  close: () => ipcRenderer.send('close'),
  navigate: (page) => ipcRenderer.send('navigate', page),
  zoomIn: () => { var z = Math.min((webFrame.getZoomFactor() || 1) + 0.1, 2); webFrame.setZoomFactor(z); return z },
  zoomOut: () => { var z = Math.max((webFrame.getZoomFactor() || 1) - 0.1, 0.5); webFrame.setZoomFactor(z); return z },
  zoomReset: () => { webFrame.setZoomFactor(1); return 1 },
  setZoom: (z) => webFrame.setZoomFactor(z),
  readFile: (fp) => ipcRenderer.invoke('read-file', fp),
  writeFile: (fp, data) => ipcRenderer.invoke('write-file', fp, data),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  getDefaultPath: () => ipcRenderer.invoke('get-default-path')
})
