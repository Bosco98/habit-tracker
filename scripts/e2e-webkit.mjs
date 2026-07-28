/**
 * The desktop shell runs the frontend in WKWebView under the CSP declared in
 * src-tauri/tauri.conf.json — neither of which the Chromium dev-server e2e
 * exercises. This serves the production `dist/` with that exact CSP into
 * Playwright's WebKit engine, so a CSP mistake or a WebKit-only failure
 * (notably Jazz's WASM crypto) is caught in CI rather than on someone's Mac.
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { webkit } from "playwright";

const DIST = path.resolve("dist");
const CONF = JSON.parse(await readFile("src-tauri/tauri.conf.json", "utf8"));
const CSP = CONF.app.security.csp;
const PORT = 4319;

const TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".wasm": "application/wasm",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".json": "application/json",
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const requested = path.join(DIST, decodeURIComponent(url.pathname));
  const isFile =
    path.resolve(requested).startsWith(DIST) &&
    existsSync(requested) &&
    statSync(requested).isFile();
  const target = isFile ? requested : path.join(DIST, "index.html");
  res.writeHead(200, {
    "Content-Type": TYPES[path.extname(target)] ?? "application/octet-stream",
    // Tauri injects the configured policy the same way.
    "Content-Security-Policy": CSP,
  });
  res.end(await readFile(target));
});
await new Promise((r) => server.listen(PORT, r));

const errors = [];
const browser = await webkit.launch();
const page = await browser.newPage({ viewport: { width: 460, height: 900 } });
page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 200)));
page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));

const wasm = [];
page.on("response", (r) => r.url().endsWith(".wasm") && wasm.push(r.status()));

await page.goto(`http://localhost:${PORT}/`, { waitUntil: "networkidle" });
await page.waitForTimeout(3000);

// Creating and persisting a habit exercises the WASM crypto end to end.
await page.getByRole("button", { name: "Create a habit" }).click();
await page.getByPlaceholder("Habit name").fill("WebKit smoke");
await page.getByRole("button", { name: "Create habit" }).click();
await page.waitForTimeout(1200);
await page.getByRole("button", { name: /Mark WebKit smoke done/ }).click();
await page.waitForTimeout(1000);
await page.screenshot({ path: `${process.env.SHOT_DIR ?? "e2e-shots"}/40-webkit.png` });

await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(3000);
const persisted = (await page.getByText("WebKit smoke").count()) > 0;

// A client route must resolve through the SPA fallback.
await page.getByRole("link", { name: "Insights" }).click();
await page.waitForTimeout(1500);
const routed = page.url().endsWith("/insights");

console.log("\nRESULT (WebKit + Tauri CSP):");
console.log("  wasm fetched:", wasm.length ? wasm.join(",") : "NONE");
console.log("  data persisted:", persisted);
console.log("  client routing:", routed);
console.log("  console errors:", errors.length ? errors.slice(0, 5) : "none");

await browser.close();
server.close();
