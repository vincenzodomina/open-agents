import { beforeEach, describe, expect, mock, test } from "bun:test";

let currentSession: { user: { id: string } } | null = {
  user: { id: "user-1" },
};
let botVerification: { isBot: boolean } = { isBot: false };
const forwardCalls: Array<{ targetPath: string }> = [];
let forwardResponse: Response = Response.json({ title: "ok" });

mock.module("@/lib/session/get-server-session", () => ({
  getServerSession: async () => currentSession,
}));

mock.module("@/lib/botid-server", () => ({
  verifyBotIdRequest: async () => botVerification,
}));

mock.module("@/lib/runtime-connection/proxy-handler", () => ({
  forwardToRuntime: async (_req: Request, targetPath: string) => {
    forwardCalls.push({ targetPath });
    return forwardResponse;
  },
}));

const routeModulePromise = import("./route");

function createRequest(body: unknown): Request {
  return new Request("http://localhost/api/generate-title", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("/api/generate-title (proxy)", () => {
  beforeEach(() => {
    currentSession = { user: { id: "user-1" } };
    botVerification = { isBot: false };
    forwardResponse = Response.json({ title: "ok" });
    forwardCalls.length = 0;
  });

  test("returns 401 when not authenticated and does not proxy", async () => {
    currentSession = null;
    const { POST } = await routeModulePromise;

    const res = await POST(createRequest({ message: "hello" }));
    const body = (await res.json()) as { error: string };
    expect(res.status).toBe(401);
    expect(body.error).toBe("Not authenticated");
    expect(forwardCalls).toHaveLength(0);
  });

  test("returns 403 when bot verification fails and does not proxy", async () => {
    botVerification = { isBot: true };
    const { POST } = await routeModulePromise;

    const res = await POST(createRequest({ message: "hello" }));
    const body = (await res.json()) as { error: string };
    expect(res.status).toBe(403);
    expect(body.error).toBe("Access denied");
    expect(forwardCalls).toHaveLength(0);
  });

  test("forwards to runtime when session + bot gates pass", async () => {
    forwardResponse = Response.json({ title: "Fix API" }, { status: 200 });
    const { POST } = await routeModulePromise;

    const res = await POST(createRequest({ message: "fix the api" }));
    const body = (await res.json()) as { title: string };
    expect(res.status).toBe(200);
    expect(body.title).toBe("Fix API");
    expect(forwardCalls).toEqual([{ targetPath: "/v1/generate-title" }]);
  });

  test("preserves upstream status codes from the runtime", async () => {
    forwardResponse = Response.json(
      { error: "Failed to generate title" },
      { status: 500 },
    );
    const { POST } = await routeModulePromise;

    const res = await POST(createRequest({ message: "hello" }));
    expect(res.status).toBe(500);
  });
});
