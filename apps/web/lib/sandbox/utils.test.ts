import { describe, expect, test } from "bun:test";

import { isSessionSandboxOperational } from "./utils";

describe("isSessionSandboxOperational", () => {
  test("allows JSON-backed runtime when sandbox_expires_at column is stale", () => {
    const future = Date.now() + 60 * 60 * 1000;
    const staleColumn = new Date(Date.now() - 60 * 60 * 1000);

    expect(
      isSessionSandboxOperational({
        sandboxState: {
          type: "vercel",
          sandboxName: "session_x",
          expiresAt: future,
        },
        sandboxExpiresAt: staleColumn,
      }),
    ).toBe(true);
  });

  test("still requires column when runtime JSON has no expiresAt (just-bash)", () => {
    const future = Date.now() + 60 * 60 * 1000;

    expect(
      isSessionSandboxOperational({
        sandboxState: {
          type: "just-bash",
          sandboxName: "session_x",
        },
        sandboxExpiresAt: new Date(future),
      }),
    ).toBe(true);

    expect(
      isSessionSandboxOperational({
        sandboxState: {
          type: "just-bash",
          sandboxName: "session_x",
        },
        sandboxExpiresAt: new Date(Date.now() - 60 * 60 * 1000),
      }),
    ).toBe(false);
  });
});
