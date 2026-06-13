const { contextBridge, ipcRenderer, webFrame } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('minimize'),
  maximize: () => ipcRenderer.send('maximize'),
  close: () => ipcRenderer.send('close'),
  zoomIn: () => { var z = Math.min((webFrame.getZoomFactor() || 1) + 0.1, 2); webFrame.setZoomFactor(z); return z },
  zoomOut: () => { var z = Math.max((webFrame.getZoomFactor() || 1) - 0.1, 0.5); webFrame.setZoomFactor(z); return z },
  zoomReset: () => { webFrame.setZoomFactor(1); return 1 },
  setZoom: (z) => webFrame.setZoomFactor(z)
})
