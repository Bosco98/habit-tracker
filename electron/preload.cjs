// Sandboxed preloads are CommonJS. The app is pure web — the only thing it
// needs from the shell is to know it's running inside one.
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("desktop", {
  platform: process.platform,
});
