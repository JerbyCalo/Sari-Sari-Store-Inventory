const { contextBridge, ipcRenderer } = require("electron");

const api = {
  list: () => ipcRenderer.invoke("inventory:list"),
  add: (item) => ipcRenderer.invoke("inventory:add", item),
  delete: (payload) => ipcRenderer.invoke("inventory:delete", payload),
  sell: (payload) => ipcRenderer.invoke("inventory:sell", payload),
  reset: () => ipcRenderer.invoke("inventory:reset"),
  update: (payload) => ipcRenderer.invoke("inventory:update", payload),
  getSalesHistory: () => ipcRenderer.invoke("sales:history"),
};

contextBridge.exposeInMainWorld("inventoryAPI", api);
