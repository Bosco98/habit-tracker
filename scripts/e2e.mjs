import { chromium } from "playwright";

const SHOTS = process.env.SHOT_DIR ?? "e2e-shots";
const BASE = "http://localhost:5173";
const errors = [];
const log = (...args) => console.log("·", ...args);

function watch(page, tag) {
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`[${tag}] ${m.text()}`);
  });
  page.on("pageerror", (e) => errors.push(`[${tag}] ${String(e)}`));
}

const browser = await chromium.launch();

// ── Device A: sign up, create habits, make a circle ───────────────────────
const ctxA = await browser.newContext({
  viewport: { width: 390, height: 844 },
  permissions: ["clipboard-read", "clipboard-write"],
});
const A = await ctxA.newPage();
watch(A, "A");
await A.goto(BASE, { waitUntil: "networkidle" });
await A.waitForTimeout(1500);

// Create a personal habit
await A.getByRole("button", { name: "Create a habit" }).click();
await A.getByPlaceholder("Habit name").fill("Morning run");
await A.getByRole("button", { name: "Create habit" }).click();
await A.waitForTimeout(500);
await A.getByRole("button", { name: /Mark Morning run done/ }).click();
await A.waitForTimeout(400);
log("A: personal habit created + checked in");

// Sign up (upgrade the anonymous account)
await A.getByRole("button", { name: "Settings" }).click();
await A.waitForTimeout(400);
await A.getByRole("button", { name: "Create account" }).click();
await A.waitForTimeout(400);
await A.getByLabel("Display name").fill("Bosco");
await A.screenshot({ path: `${SHOTS}/10-signup.png` });
await A.getByRole("button", { name: "Create account" }).click();
await A.waitForTimeout(2500);
await A.screenshot({ path: `${SHOTS}/11-passphrase.png` });

// Read it the way a user would — via the copy button.
await A.getByRole("button", { name: "Copy phrase" }).click();
await A.waitForTimeout(400);
const passphrase = (await A.evaluate(() => navigator.clipboard.readText())).trim();
const words = passphrase.split(/\s+/);
if (words.length < 12) throw new Error(`expected a recovery phrase, got "${passphrase}"`);
log(`A: signed up, ${words.length}-word phrase copied`);

await A.getByRole("checkbox").check();
await A.getByRole("button", { name: "Done" }).click();
await A.waitForTimeout(1500);

// Create a circle
await A.getByRole("link", { name: "Circles" }).click();
await A.waitForTimeout(500);
await A.getByRole("button", { name: "Create a circle" }).click();
await A.getByPlaceholder("Circle name").fill("Gym buddies");
await A.getByPlaceholder("Loser buys coffee").fill("buys coffee");
await A.getByRole("button", { name: "Create circle" }).click();
await A.waitForTimeout(1200);
await A.screenshot({ path: `${SHOTS}/12-circles.png` });
log("A: circle created");

// Open it, add a shared habit
await A.getByRole("link", { name: /Gym buddies/ }).click();
await A.waitForTimeout(800);
await A.getByRole("button", { name: "Shared habit" }).click();
await A.getByPlaceholder("Habit name").fill("Pushups");
await A.getByRole("radio", { name: "Count" }).click();
await A.getByRole("button", { name: "Create habit" }).click();
await A.waitForTimeout(1200);
log("A: shared habit created");

// Grab an invite link
await A.getByRole("button", { name: "Invite someone" }).click();
await A.waitForTimeout(1500);
await A.screenshot({ path: `${SHOTS}/13-invite.png` });
const inviteLink = await A.evaluate(async () => {
  const btn = [...document.querySelectorAll("button")].find((b) =>
    b.textContent?.includes("Copy link"),
  );
  btn?.click();
  await new Promise((r) => setTimeout(r, 300));
  return navigator.clipboard.readText();
});
if (!inviteLink?.includes("#/invite/")) throw new Error(`bad invite link: ${inviteLink}`);
log("A: invite link created");

// Log some shared check-ins
await A.getByRole("link", { name: "Home" }).click();
await A.waitForTimeout(800);
for (let i = 0; i < 3; i++) {
  await A.getByRole("button", { name: "Increase" }).first().click();
  await A.waitForTimeout(150);
}
await A.waitForTimeout(600);
await A.screenshot({ path: `${SHOTS}/14-home-shared.png` });
log("A: logged shared habit");

// ── Device B: accept the invite as a different account ────────────────────
const ctxB = await browser.newContext({ viewport: { width: 390, height: 844 } });
const B = await ctxB.newPage();
watch(B, "B");
await B.goto(BASE, { waitUntil: "networkidle" });
await B.waitForTimeout(1500);

// B signs up first so it has a syncing account
await B.getByRole("button", { name: "Settings" }).click();
await B.waitForTimeout(400);
await B.getByRole("button", { name: "Create account" }).click();
await B.waitForTimeout(400);
await B.getByLabel("Display name").fill("Alex");
await B.getByRole("button", { name: "Create account" }).click();
await B.waitForTimeout(2500);
await B.getByRole("checkbox").check();
await B.getByRole("button", { name: "Done" }).click();
await B.waitForTimeout(1500);
log("B: signed up as Alex");

await B.goto(inviteLink, { waitUntil: "networkidle" });
await B.waitForTimeout(4000);
await B.screenshot({ path: `${SHOTS}/15-b-joined.png` });
const bUrl = B.url();
log("B: after invite, url =", bUrl.replace(BASE, ""));

// B logs the shared habit too
await B.getByRole("link", { name: "Home" }).click();
await B.waitForTimeout(2500);
await B.screenshot({ path: `${SHOTS}/16-b-home.png` });

const bSeesShared = await B.getByText("Pushups").count();
log("B: sees shared habit ×", bSeesShared);
if (bSeesShared > 0) {
  for (let i = 0; i < 2; i++) {
    await B.getByRole("button", { name: "Increase" }).first().click();
    await B.waitForTimeout(150);
  }
  await B.waitForTimeout(1500);
  await B.screenshot({ path: `${SHOTS}/17-b-logged.png` });
  log("B: logged shared habit");
}

// ── Back on A: partner data should have arrived ───────────────────────────
await A.reload({ waitUntil: "networkidle" });
await A.waitForTimeout(4000);
await A.screenshot({ path: `${SHOTS}/18-a-sees-partner.png` });

// Habit detail (peer compare)
await A.getByRole("button", { name: /Open Pushups/ }).click();
await A.waitForTimeout(1200);
await A.screenshot({ path: `${SHOTS}/19-peer-compare.png` });
const peerText = await A.locator("[role=dialog]").innerText();
log("A: detail sheet mentions Alex?", peerText.includes("Alex"));
await A.keyboard.press("Escape");
await A.waitForTimeout(500);

// Circle screen: duel + feed
await A.getByRole("link", { name: "Circles" }).click();
await A.waitForTimeout(600);
await A.getByRole("link", { name: /Gym buddies/ }).click();
await A.waitForTimeout(2000);
await A.screenshot({ path: `${SHOTS}/20-circle-duel.png`, fullPage: true });
log("A: circle detail rendered");

// React to the partner's check-in
const reactBtn = A.getByRole("button", { name: /React 👏/ }).first();
if ((await reactBtn.count()) > 0) {
  await reactBtn.click();
  await A.waitForTimeout(800);
  await A.screenshot({ path: `${SHOTS}/21-reacted.png` });
  log("A: reacted to partner check-in");
}

// Insights
await A.getByRole("link", { name: "Insights" }).click();
await A.waitForTimeout(1500);
await A.screenshot({ path: `${SHOTS}/22-insights.png`, fullPage: true });
log("A: insights rendered");

// ── Device C: log in on a "new device" with A's phrase ────────────────────
const ctxC = await browser.newContext({ viewport: { width: 390, height: 844 } });
const C = await ctxC.newPage();
watch(C, "C");
await C.goto(BASE, { waitUntil: "networkidle" });
await C.waitForTimeout(1500);
await C.getByRole("button", { name: "Settings" }).click();
await C.waitForTimeout(400);
await C.getByRole("button", { name: "Log in" }).click();
await C.waitForTimeout(400);
await C.getByLabel("Recovery phrase").fill(passphrase);
await C.getByRole("button", { name: "Log in" }).click();
await C.waitForTimeout(5000);
await C.screenshot({ path: `${SHOTS}/23-new-device.png` });
const cHasRun = await C.getByText("Morning run").count();
log("C: sees 'Morning run' after phrase login ×", cHasRun);

// Dark mode sweep
await A.emulateMedia({ colorScheme: "dark" });
await A.evaluate(() => localStorage.setItem("habit-tracker-theme", "dark"));
await A.goto(`${BASE}/circles`, { waitUntil: "networkidle" });
await A.waitForTimeout(1500);
await A.getByRole("link", { name: /Gym buddies/ }).click();
await A.waitForTimeout(1500);
await A.screenshot({ path: `${SHOTS}/24-dark-circle.png`, fullPage: true });

console.log("\nRESULT:");
console.log("  invite accepted:", bUrl.includes("/circle/"));
console.log("  B saw shared habit:", bSeesShared > 0);
console.log("  C restored from phrase:", cHasRun > 0);
console.log("  console errors:", errors.length ? errors.slice(0, 8) : "none");

await browser.close();
