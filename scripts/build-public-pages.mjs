import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const dist = fileURLToPath(new URL("../dist", import.meta.url));
const indexPath = `${dist}/index.html`;
const index = await readFile(indexPath, "utf8");

const installDescription =
  "Safely install Habits on macOS or Windows, including first-launch help for Gatekeeper and Windows SmartScreen.";
const installSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to install Habits on macOS or Windows",
  description: installDescription,
  totalTime: "PT5M",
  step: [
    {
      "@type": "HowToStep",
      name: "Choose the correct Mac download",
      text: "Choose the Apple Silicon DMG, Intel DMG, or Windows x64 setup file.",
    },
    {
      "@type": "HowToStep",
      name: "Move Habits to Applications",
      text: "On Mac, move Habits to Applications. On Windows, run the setup file.",
    },
    {
      "@type": "HowToStep",
      name: "Confirm the first launch",
      text: "Use the documented Gatekeeper or SmartScreen confirmation for the verified download.",
    },
  ],
};

const install = index
  .replace(
    /<meta name="description" content="[^"]*" \/>/,
    `<meta name="description" content="${installDescription}" />`,
  )
  .replace(
    '<link rel="canonical" href="https://habit-tracker.fun/" />',
    '<link rel="canonical" href="https://habit-tracker.fun/install/" />',
  )
  .replace(
    '<meta property="og:title" content="Habits — Keep the promise. Together." />',
    '<meta property="og:title" content="How to Install Habits" />',
  )
  .replace(
    /<meta property="og:description" content="[^"]*" \/>/,
    `<meta property="og:description" content="${installDescription}" />`,
  )
  .replace(
    '<meta property="og:url" content="https://habit-tracker.fun/" />',
    '<meta property="og:url" content="https://habit-tracker.fun/install/" />',
  )
  .replace(
    '<meta name="twitter:title" content="Habits — Keep the promise. Together." />',
    '<meta name="twitter:title" content="How to Install Habits" />',
  )
  .replace(
    /<meta name="twitter:description" content="[^"]*" \/>/,
    `<meta name="twitter:description" content="${installDescription}" />`,
  )
  .replace(
    "<title>Habits — Private Habit Tracker for You and Your Circle</title>",
    "<title>How to Install Habits on Mac or Windows — Habits</title>",
  )
  .replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script type="application/ld+json">\n${JSON.stringify(installSchema, null, 2)}\n    </script>`,
  );

await mkdir(`${dist}/app`, { recursive: true });
await mkdir(`${dist}/install`, { recursive: true });
await writeFile(`${dist}/app/index.html`, index);
await writeFile(`${dist}/install/index.html`, install);
await writeFile(`${dist}/404.html`, index);
await writeFile(`${dist}/.nojekyll`, "");
