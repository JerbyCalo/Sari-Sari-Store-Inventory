const { contextBridge, ipcRenderer } = require("electron");

const api = {
  list: () => ipcRenderer.invoke("inventory:list"),
  add: (item) => ipcRenderer.invoke("inventory:add", item),
  delete: (payload) => ipcRenderer.invoke("inventory:delete", payload),
  sell: (payload) => ipcRenderer.invoke("inventory:sell", payload),
  reset: () => ipcRenderer.invoke("inventory:reset"),
};

contextBridge.exposeInMainWorld("inventoryAPI", api);
