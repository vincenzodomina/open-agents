import path from "node:path";
import { fileURLToPath } from "node:url";
import { BrowserWindow, app } from "electron";
import { loadDesktopConfig } from "./config.js";
import { startFrontend, type FrontendHandle } from "./frontend-controller.js";
import { startRuntime, type RuntimeHandle } from "./runtime-controller.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..", "..");

let runtime: RuntimeHandle | undefined;
let frontend: FrontendHandle | undefined;
let mainWindow: BrowserWindow | undefined;
let shuttingDown = false;

async function bootstrap(): Promise<void> {
  const config = loadDesktopConfig(repoRoot);
  console.log(`[desktop] mode=${config.runtimeMode}`);

  runtime = await startRuntime(config);
  console.log(`[desktop] runtime ready at ${runtime.url}`);

  frontend = await startFrontend(config, runtime.url);
  console.log(`[desktop] frontend ready at ${frontend.url}`);

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  });
  mainWindow.once("ready-to-show", () => mainWindow?.show());
  await mainWindow.loadURL(frontend.url);
}

async function shutdown(): Promise<void> {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  console.log("[desktop] shutting down");
  try {
    await frontend?.stop();
  } catch (err) {
    console.error("[desktop] frontend stop failed", err);
  }
  try {
    await runtime?.stop();
  } catch (err) {
    console.error("[desktop] runtime stop failed", err);
  }
}

app.whenReady().then(() => {
  bootstrap().catch((err) => {
    console.error("[desktop] bootstrap failed", err);
    app.quit();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", async (event) => {
  if (shuttingDown) {
    return;
  }
  event.preventDefault();
  await shutdown();
  app.exit(0);
});

process.on("SIGTERM", () => {
  shutdown().finally(() => process.exit(0));
});
process.on("SIGINT", () => {
  shutdown().finally(() => process.exit(0));
});
