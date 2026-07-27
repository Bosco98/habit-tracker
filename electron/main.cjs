// CommonJS: Electron's main process module doesn't expose reliable named ESM
// exports, and the CJS path is the supported one.
const { app, BrowserWindow, net, protocol, session, shell } = require("electron");
const { existsSync, statSync } = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const DIST = path.join(__dirname, "..", "dist");
const DEV_URL = process.env.VITE_DEV_SERVER_URL || null;
const isMac = process.platform === "darwin";

/**
 * Production is served from a custom scheme rather than file://.
 * file:// is an opaque origin, so IndexedDB there is unreliable — and for a
 * local-first app, storage that can be evicted is data loss.
 */
protocol.registerSchemesAsPrivileged([
  {
    scheme: "app",
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
  },
]);

const CSP = [
  "default-src 'self' app:",
  // Jazz's crypto core is WebAssembly.
  "script-src 'self' app: 'wasm-unsafe-eval'",
  "style-src 'self' app: 'unsafe-inline'",
  "img-src 'self' app: data: blob:",
  "font-src 'self' app: data:",
  // Jazz ships its WASM crypto core as a data: URL and fetches it at startup.
  "connect-src 'self' app: data: blob: wss://cloud.jazz.tools https://cloud.jazz.tools",
].join("; ");

function serveApp() {
  protocol.handle("app", (request) => {
    const { pathname } = new URL(request.url);
    const requested = path.join(DIST, decodeURIComponent(pathname));
    // Never serve outside dist, whatever the URL claims.
    const withinDist = path.resolve(requested).startsWith(path.resolve(DIST));
    const isFile = withinDist && existsSync(requested) && statSync(requested).isFile();
    // Anything else is a client route — hand back the shell.
    const target = isFile ? requested : path.join(DIST, "index.html");
    return net.fetch(pathToFileURL(target).toString());
  });
}

function createWindow() {
  const window = new BrowserWindow({
    width: 460,
    height: 900,
    minWidth: 380,
    minHeight: 560,
    show: false,
    // Matches --background so there's no white flash before first paint.
    backgroundColor: "#f0eee9",
    titleBarStyle: isMac ? "hiddenInset" : "default",
    trafficLightPosition: isMac ? { x: 16, y: 18 } : undefined,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.once("ready-to-show", () => window.show());

  // Invite links and anything external belong in the real browser.
  window.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });
  window.webContents.on("will-navigate", (event, url) => {
    const internal = DEV_URL ? url.startsWith(DEV_URL) : url.startsWith("app://");
    if (!internal) {
      event.preventDefault();
      void shell.openExternal(url);
    }
  });

  void window.loadURL(DEV_URL ?? "app://habits/");
  return window;
}

void app.whenReady().then(() => {
  if (!DEV_URL) {
    serveApp();
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: { ...details.responseHeaders, "Content-Security-Policy": [CSP] },
      });
    });
  }

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (!isMac) app.quit();
});
