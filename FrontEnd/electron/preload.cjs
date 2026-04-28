const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopAPI", {
  isDesktop: true,
  ping: () => ipcRenderer.invoke("app:ping"),
  wifi: {
    getCurrent: () => ipcRenderer.invoke("wifi:current"),
  },
});
