// preload.js
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  listarPlacas: () => ipcRenderer.invoke('arduino:listBoards'),
  subirCodigo: (placa, codigo) =>
    ipcRenderer.invoke('arduino:uploadCode', { placa, codigo })
})
