import { app, type BrowserWindow } from "electron";
import { logger } from "./logger.js";

export type TeardownFn = () => Promise<void>;

type LifecycleState = {
  teardown: TeardownFn | undefined;
  getMainWindow: (() => BrowserWindow | undefined) | undefined;
  shuttingDown: boolean;
};

const state: LifecycleState = {
  teardown: undefined,
  getMainWindow: undefined,
  shuttingDown: false,
};

export function setTeardown(fn: TeardownFn): void {
  state.teardown = fn;
}

export function setMainWindowProvider(
  fn: () => BrowserWindow | undefined,
): void {
  state.getMainWindow = fn;
}

async function runShutdown(reason: string): Promise<void> {
  if (state.shuttingDown) {
    return;
  }
  state.shuttingDown = true;
  logger.info(`[desktop] shutting down (${reason})`);
  if (!state.teardown) {
    return;
  }
  try {
    await state.teardown();
  } catch (err) {
    logger.error("[desktop] teardown failed", err);
  }
}

export function acquireSingleInstanceLock(): boolean {
  const gotLock = app.requestSingleInstanceLock();
  if (!gotLock) {
    return false;
  }
  app.on("second-instance", () => {
    const win = state.getMainWindow?.();
    if (!win) {
      return;
    }
    if (win.isMinimized()) {
      win.restore();
    }
    win.focus();
  });
  return true;
}

export function installLifecycleHandlers(): void {
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("before-quit", (event) => {
    if (state.shuttingDown) {
      return;
    }
    event.preventDefault();
    runShutdown("before-quit").finally(() => app.exit(0));
  });

  for (const signal of ["SIGTERM", "SIGINT"] as const) {
    process.on(signal, () => {
      runShutdown(signal).finally(() => process.exit(0));
    });
  }
}
