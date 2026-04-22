import path from "node:path";
import { fileURLToPath } from "node:url";
import { BrowserWindow, app } from "electron";
import { loadDesktopConfig } from "./config.js";
import { startFrontend, type FrontendHandle } from "./frontend-controller.js";
import {
  acquireSingleInstanceLock,
  installLifecycleHandlers,
  setMainWindowProvider,
  setTeardown,
} from "./lifecycle.js";
import { logger } from "./logger.js";
import { startRuntime, type RuntimeHandle } from "./runtime-controller.js";
import {
  startWorkflowRuntime,
  type WorkflowRuntimeHandle,
} from "./workflow-runtime-controller.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..", "..");

let runtime: RuntimeHandle | undefined;
let workflowRuntime: WorkflowRuntimeHandle | undefined;
let frontend: FrontendHandle | undefined;
let mainWindow: BrowserWindow | undefined;

if (!acquireSingleInstanceLock()) {
  logger.info("[desktop] another instance is already running; exiting");
  app.exit(0);
}

setMainWindowProvider(() => mainWindow);
setTeardown(async () => {
  try {
    await frontend?.stop();
  } catch (err) {
    logger.error("[desktop] frontend stop failed", err);
  }
  try {
    await workflowRuntime?.stop();
  } catch (err) {
    logger.error("[desktop] workflow-runtime stop failed", err);
  }
  try {
    await runtime?.stop();
  } catch (err) {
    logger.error("[desktop] runtime stop failed", err);
  }
});
installLifecycleHandlers();

async function bootstrap(): Promise<void> {
  const config = loadDesktopConfig(repoRoot);
  logger.info(`[desktop] mode=${config.runtimeMode}`);

  // Start both runtimes in parallel; they're independent.
  [runtime, workflowRuntime] = await Promise.all([
    startRuntime(config),
    startWorkflowRuntime(config),
  ]);
  logger.info(`[desktop] runtime ready at ${runtime.url}`);
  logger.info(`[desktop] workflow-runtime ready at ${workflowRuntime.url}`);

  frontend = await startFrontend(config, {
    runtimeUrl: runtime.url,
    workflowRuntimeUrl: workflowRuntime.url,
  });
  logger.info(`[desktop] frontend ready at ${frontend.url}`);

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
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  mainWindow.once("ready-to-show", () => mainWindow?.show());
  await mainWindow.loadURL(frontend.url);
}

app.whenReady().then(() => {
  bootstrap().catch((err) => {
    logger.error("[desktop] bootstrap failed", err);
    app.quit();
  });
});
