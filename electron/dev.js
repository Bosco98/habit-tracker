/**
 * Boots Vite in-process, then launches Electron against it — one command,
 * no port guessing, and the dev server dies with the app.
 */
import { spawn } from "node:child_process";
import electron from "electron";
import { createServer } from "vite";

const server = await createServer({ server: { port: 5173 } });
await server.listen();

const url = server.resolvedUrls?.local?.[0];
if (!url) throw new Error("Vite did not report a local URL");
server.printUrls();

// VS Code's integrated terminal exports ELECTRON_RUN_AS_NODE=1, which would
// make Electron boot as plain Node and never open a window.
const env = { ...process.env, VITE_DEV_SERVER_URL: url };
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(electron, ["."], { stdio: "inherit", env });

child.on("close", async () => {
  await server.close();
  process.exit(0);
});
