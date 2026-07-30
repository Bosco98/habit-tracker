import { chromium } from "playwright";

const SHOTS = process.env.SHOT_DIR ?? "e2e-shots";
const ORIGIN = "http://localhost:5173";
const BASE = `${ORIGIN}/app`;
const errors = [];
const log = (...args) => console.log("·", ...args);

function watch(page, tag) {
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`[${tag}] ${m.text()}`);
  });
  page.on("pageerror", (e) => errors.push(`[${tag}] ${String(e)}`));
}

const browser = await chromium.launch();

// ── Public landing: crawlable promise + working app/download CTAs ─────────
const landingContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const landing = await landingContext.newPage();
watch(landing, "landing");
await landing.goto(ORIGIN, { waitUntil: "networkidle" });
await landing.getByRole("heading", { name: "Keep the promise. Together." }).waitFor();
const landingAppHref = await landing
  .getByRole("link", { name: /Start in your browser/ })
  .getAttribute("href");
const landingDownloadHref = await landing
  .getByRole("link", { name: /Download desktop/ })
  .getAttribute("href");
const canonical = await landing.locator('link[rel="canonical"]').getAttribute("href");
const ogImage = await landing
  .locator('meta[property="og:image"]')
  .getAttribute("content");
const softwareSchema = JSON.parse(
  await landing.locator('script[type="application/ld+json"]').textContent(),
);
if (landingAppHref !== "/app") throw new Error(`bad web app CTA: ${landingAppHref}`);
if (!landingDownloadHref?.includes("/releases/latest")) {
  throw new Error(`bad download CTA: ${landingDownloadHref}`);
}
if (canonical !== "https://habit-tracker.fun/") {
  throw new Error(`bad canonical URL: ${canonical}`);
}
if (
  ogImage !== "https://habit-tracker.fun/og-image.png" ||
  softwareSchema.softwareVersion !== "2.0.0"
) {
  throw new Error("landing SEO metadata is incomplete");
}
await landing.screenshot({ path: `${SHOTS}/00-landing.png`, fullPage: true });
await landing.goto(`${ORIGIN}/install/`, { waitUntil: "networkidle" });
await landing
  .getByRole("heading", { name: "Install Habits without the mystery." })
  .waitFor();
const installCoversBothPlatforms =
  (await landing.getByRole("heading", { name: /Installing on Windows/ }).count()) ===
    1 &&
  (await landing.getByRole("heading", { name: /Choose the right installer/ }).count()) ===
    1;
if (!installCoversBothPlatforms) {
  throw new Error("desktop install guide does not cover Mac and Windows");
}
await landing.screenshot({ path: `${SHOTS}/01-install-guide.png`, fullPage: true });
await landingContext.close();
log("Landing: SEO, CTAs, and desktop install guide verified");

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

// Read it the way a user would — via the copy button (Download is the other path).
await A.getByRole("button", { name: "Copy", exact: true }).click();
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
await A.getByPlaceholder("Weeknights").fill("Gym buddies");
await A.getByRole("button", { name: "Create circle" }).click();
await A.waitForTimeout(1200);
await A.screenshot({ path: `${SHOTS}/12-circles.png` });
log("A: circle created");

// Open it, add a shared habit
await A.getByRole("link", { name: /Gym buddies/ }).click();
await A.waitForTimeout(800);
await A.getByRole("button", { name: "Shared habit", exact: true }).click();
await A.getByPlaceholder("Habit name").fill("Pushups");
await A.getByRole("radio", { name: "Count" }).click();
await A.getByLabel("Every").fill("1");
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
if (!inviteLink?.startsWith(`${BASE}#/invite/circle/`)) {
  throw new Error(`bad invite link: ${inviteLink}`);
}
log("A: invite link created");

// Log some shared check-ins
await A.getByRole("link", { name: "Home" }).click();
await A.waitForTimeout(800);
for (let i = 0; i < 3; i++) {
  await A.getByRole("button", { name: "Increase" }).first().click();
  await A.waitForTimeout(150);
}
const trophyCelebration = A.getByText("Trophy unlocked", { exact: true });
await trophyCelebration.waitFor({ state: "visible", timeout: 5000 });
await A.waitForTimeout(700);
const celebrationHasConfetti =
  (await A.locator("[data-trophy-confetti]").count()) === 44;
await A.screenshot({ path: `${SHOTS}/14-trophy-celebration.png` });
await trophyCelebration.waitFor({ state: "hidden", timeout: 5000 });

// A trophy is celebrated at award time, but must not replay on refresh.
await A.reload({ waitUntil: "networkidle" });
await A.waitForTimeout(800);
const trophyDidNotReplay =
  (await A.getByText("Trophy unlocked", { exact: true }).count()) === 0;
await A.screenshot({ path: `${SHOTS}/14-home-shared.png` });
log("A: logged shared habit + trophy celebration verified");

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
await A.getByRole("button", { name: "Pushups", exact: true }).click();
await A.waitForTimeout(1200);
await A.screenshot({ path: `${SHOTS}/19-peer-compare.png` });
const peerText = await A.locator("[role=dialog]").innerText();
log("A: detail sheet mentions Alex?", peerText.includes("Alex"));
await A.keyboard.press("Escape");
await A.waitForTimeout(500);

// Circle screen: the shared shelf + feed
await A.getByRole("link", { name: "Circles" }).click();
await A.waitForTimeout(600);
await A.getByRole("link", { name: /Gym buddies/ }).click();
await A.waitForTimeout(2000);
await A.screenshot({ path: `${SHOTS}/20-circle-shelf.png`, fullPage: true });
log("A: circle detail rendered");
const canDelete = await A.getByRole("button", { name: "Delete circle" }).first().isVisible();
const circleIsReadOnly =
  (await A.getByRole("button", { name: /Open Pushups details/ }).count()) === 1 &&
  (await A.getByRole("button", { name: /Punch|increment|decrement|start timer/i }).count()) === 0;
const circleHasPulse = (await A.getByText("Circle pulse", { exact: true }).count()) === 1;

// React to the partner's check-in
const reactBtn = A.getByRole("button", { name: /React 👏/ }).first();
if ((await reactBtn.count()) > 0) {
  await reactBtn.click();
  await A.waitForTimeout(800);
  await A.screenshot({ path: `${SHOTS}/21-reacted.png` });
  log("A: reacted to partner check-in");
}

// You: profile, rolling tracks, and trophies only
await A.getByRole("link", { name: "You" }).click();
await A.waitForTimeout(1500);
const youStartsAtTop = (await A.evaluate(() => window.scrollY)) === 0;
await A.screenshot({ path: `${SHOTS}/22-you.png`, fullPage: true });
const profileUsesRollingWindow =
  (await A.getByText(/· last 30 days$/).count()) === 4 &&
  (await A.getByText("All-time trophies", { exact: true }).count()) === 1;
if (!profileUsesRollingWindow) {
  throw new Error("profile track cards are not consistently scoped to 30 days");
}
const youIsProfileOnly =
  (await A.getByText("Trophy cabinet", { exact: true }).count()) === 1 &&
  (await A.getByText("30-day habit spider", { exact: true }).count()) === 0;
log("A: You profile rendered");

// Insights: analytics controls, charts, and habit detail only
await A.getByRole("link", { name: "Insights" }).click();
await A.waitForTimeout(1500);
await A.screenshot({ path: `${SHOTS}/23-insights.png`, fullPage: true });
const insightsHasMultipleGraphs =
  (await A.getByText("30-day habit spider", { exact: true }).count()) === 1 &&
  (await A.getByText("Habit strength", { exact: true }).count()) === 1;
const insightsIsAnalyticsOnly =
  (await A.getByText("Trophy cabinet", { exact: true }).count()) === 0;
if (!youIsProfileOnly || !insightsIsAnalyticsOnly) {
  throw new Error("You and Insights are not separate destinations");
}
log("A: Insights rendered");

// Insights controls, shared member detail, and exclusive expansion
await A.getByRole("radio", { name: "30d" }).click();
await A.getByRole("radio", { name: /Shared/ }).click();
await A.getByRole("button", { name: /Pushups/ }).click();
await A.waitForTimeout(300);
const insightHasAlex = (await A.getByText("Alex", { exact: true }).count()) > 0;
await A.screenshot({ path: `${SHOTS}/22-insights-expanded.png`, fullPage: true });

await A.getByRole("radio", { name: /All/ }).click();
await A.getByRole("button", { name: /Morning run/ }).click();
await A.getByRole("button", { name: /Pushups/ }).click();
const oneInsightOpen = (await A.locator('button[aria-expanded="true"]').count()) === 1;

await A.getByRole("radio", { name: /Personal/ }).click();
const personalFilterHidesShared = (await A.getByText("Pushups", { exact: true }).count()) === 0;
log(
  `insights: shared member ${insightHasAlex}, exclusive expansion ${oneInsightOpen}, personal filter ${personalFilterHidesShared}`,
);

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

// ── Desktop viewport: the rail replaces the pill, cards go multi-column ───
await A.setViewportSize({ width: 1280, height: 800 });
await A.goto(BASE, { waitUntil: "networkidle" });
await A.waitForTimeout(1500);
const railVisible = await A.locator("nav.side-rail").isVisible();
const pillVisible = await A.locator("nav:not(.side-rail)").isVisible();
const columns = await A.evaluate(() => {
  const grid = document.querySelector("main section > div.grid");
  return grid ? getComputedStyle(grid).gridTemplateColumns.split(" ").length : 0;
});
await A.screenshot({ path: `${SHOTS}/25-desktop-home.png`, fullPage: true });
await A.getByRole("link", { name: "Circles" }).click();
await A.waitForTimeout(800);
await A.screenshot({ path: `${SHOTS}/26-desktop-circles.png`, fullPage: true });
await A.getByRole("link", { name: "Insights" }).click();
await A.waitForTimeout(500);
await A.screenshot({ path: `${SHOTS}/27-desktop-insights.png`, fullPage: true });
await A.getByRole("link", { name: "You" }).click();
await A.waitForTimeout(500);
await A.screenshot({ path: `${SHOTS}/27-desktop-you.png`, fullPage: true });
log(`desktop: rail ${railVisible}, bottom pill ${pillVisible}, habit columns ${columns}`);

// Dark mode sweep
await A.setViewportSize({ width: 390, height: 844 });
await A.emulateMedia({ colorScheme: "dark" });
await A.evaluate(() => localStorage.setItem("habit-tracker-theme", "dark"));
await A.goto(`${BASE}/circles`, { waitUntil: "networkidle" });
await A.waitForTimeout(1500);
await A.getByRole("link", { name: /Gym buddies/ }).click();
await A.waitForTimeout(1500);
await A.screenshot({ path: `${SHOTS}/24-dark-circle.png`, fullPage: true });
await A.getByRole("link", { name: "Insights" }).click();
await A.waitForTimeout(500);
await A.screenshot({ path: `${SHOTS}/28-dark-insights.png`, fullPage: true });
await A.getByRole("link", { name: "You" }).click();
await A.waitForTimeout(500);
await A.screenshot({ path: `${SHOTS}/29-dark-you.png`, fullPage: true });

console.log("\nRESULT:");
console.log("  invite accepted:", bUrl.includes("/circle/"));
console.log("  B saw shared habit:", bSeesShared > 0);
console.log("  C restored from phrase:", cHasRun > 0);
console.log("  creator can delete the circle:", canDelete);
console.log("  circle habit list is read-only:", circleIsReadOnly);
console.log("  circle pulse rendered:", circleHasPulse);
console.log("  You route starts at the top:", youStartsAtTop);
console.log("  You and Insights are separate:", youIsProfileOnly && insightsIsAnalyticsOnly);
console.log("  desktop rail replaces pill:", railVisible && !pillVisible);
console.log("  habits go multi-column:", columns > 1);
console.log("  insights show shared members:", insightHasAlex);
console.log("  insights keep one row open:", oneInsightOpen);
console.log("  insights filters apply:", personalFilterHidesShared);
console.log("  insights show multiple graphs:", insightsHasMultipleGraphs);
console.log("  profile tracks use rolling 30 days:", profileUsesRollingWindow);
console.log("  trophy celebration has confetti:", celebrationHasConfetti);
console.log("  trophy celebration does not replay:", trophyDidNotReplay);
console.log("  console errors:", errors.length ? errors.slice(0, 8) : "none");

await browser.close();
