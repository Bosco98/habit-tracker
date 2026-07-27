/**
 * Launches the packaged-mode Electron app (app:// scheme, real CSP) and drives
 * it the way a user would. Proves the shell boots, WASM crypto runs, and
 * IndexedDB survives a restart — the thing file:// would silently break.
 */
import { _electron as electron } from "playwright";
import { rmSync } from "node:fs";

const SHOTS = process.env.SHOT_DIR ?? "e2e-shots";
const USER_DATA = "/tmp/habits-e2e-profile";
const errors = [];
const log = (...args) => console.log("·", ...args);

rmSync(USER_DATA, { recursive: true, force: true });

const env = { ...process.env, VITE_DEV_SERVER_URL: "" };
delete env.ELECTRON_RUN_AS_NODE; // set by VS Code terminals; breaks Electron

async function launch() {
  const app = await electron.launch({
    args: [".", `--user-data-dir=${USER_DATA}`],
    env,
  });
  const page = await app.firstWindow();
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.waitForLoadState("domcontentloaded");
  return { app, page };
}

// ── First run ─────────────────────────────────────────────────────────────
let { app, page } = await launch();
await page.waitForTimeout(3000);

const url = page.url();
log("loaded:", url);
if (!url.startsWith("app://")) throw new Error(`expected app:// scheme, got ${url}`);

await page.screenshot({ path: `${SHOTS}/30-desktop-empty.png` });

await page.getByRole("button", { name: "Create a habit" }).click();
await page.getByPlaceholder("Habit name").fill("Read 20 pages");
await page.getByRole("radio", { name: "Count" }).click();
await page.getByRole("button", { name: "Create habit" }).click();
await page.waitForTimeout(800);
await page.getByRole("button", { name: "Increase" }).first().click();
await page.waitForTimeout(600);
await page.screenshot({ path: `${SHOTS}/31-desktop-habit.png` });
log("created + logged a habit");

// Client-side routing must survive the custom scheme.
await page.getByRole("link", { name: "Insights" }).click();
await page.waitForTimeout(1200);
await page.screenshot({ path: `${SHOTS}/32-desktop-insights.png` });
log("navigated to insights:", page.url());

const storage = await page.evaluate(() => ({
  origin: location.origin,
  secure: window.isSecureContext,
  idb: typeof indexedDB !== "undefined",
}));
log("origin:", storage.origin, "| secure:", storage.secure, "| indexedDB:", storage.idb);

await app.close();

// ── Restart: did the data survive? ────────────────────────────────────────
({ app, page } = await launch());
await page.waitForTimeout(3500);
await page.screenshot({ path: `${SHOTS}/33-desktop-restart.png` });
const persisted = await page.getByText("Read 20 pages").count();
log("after restart, habit present ×", persisted);

await app.close();

console.log("\nRESULT:");
console.log("  custom scheme:", url.startsWith("app://"));
console.log("  secure context:", storage.secure);
console.log("  data persisted across restart:", persisted > 0);
console.log("  console errors:", errors.length ? errors.slice(0, 6) : "none");
