import { beforeEach, describe, expect, mock, test } from "bun:test";

let currentAuthSession: { user: { id: string } } | null = {
  user: { id: "user-1" },
};

let chatRecord: {
  sessionId: string;
  activeStreamId: string | null;
} | null = {
  sessionId: "session-1",
  activeStreamId: "wrun_active-123",
};

let sessionRecord: {
  id: string;
  userId: string;
} | null = {
  id: "session-1",
  userId: "user-1",
};

type WorkflowFetchResult =
  | { kind: "response"; status: number; body?: BodyInit | null }
  | { kind: "throw" };

let workflowFetchResult: WorkflowFetchResult = {
  kind: "response",
  status: 200,
  body: "streaming chunks",
};

const spies = {
  updateChatActiveStreamId: mock(() => Promise.resolve()),
  workflowFetch: mock((_path: string) => {
    if (workflowFetchResult.kind === "throw") {
      throw new Error("workflow-runtime unreachable");
    }
    return Promise.resolve(
      new Response(workflowFetchResult.body ?? null, {
        status: workflowFetchResult.status,
      }),
    );
  }),
};

mock.module("@/lib/runtime-connection/workflow-client", () => ({
  getWorkflowClient: () => ({
    baseUrl: "http://workflow-runtime",
    fetch: (path: string) => spies.workflowFetch(path),
    health: async () => ({ ok: true, status: 200 }),
  }),
}));

mock.module("@/lib/session/get-server-session", () => ({
  getServerSession: async () => currentAuthSession,
}));

mock.module("@/lib/db/sessions", () => ({
  getChatById: async () => chatRecord,
  getSessionById: async () => sessionRecord,
  updateChatActiveStreamId: spies.updateChatActiveStreamId,
}));

const routeModulePromise = import("./route");

function createStreamRequest() {
  return new Request("http://localhost/api/chat/chat-1/stream", {
    method: "GET",
    headers: { cookie: "session=abc" },
  });
}

const routeContext = {
  params: Promise.resolve({ chatId: "chat-1" }),
};

beforeEach(() => {
  currentAuthSession = { user: { id: "user-1" } };
  sessionRecord = { id: "session-1", userId: "user-1" };
  chatRecord = {
    sessionId: "session-1",
    activeStreamId: "wrun_active-123",
  };
  workflowFetchResult = {
    kind: "response",
    status: 200,
    body: "streaming chunks",
  };
  Object.values(spies).forEach((s) => s.mockClear());
});

describe("GET /api/chat/[chatId]/stream", () => {
  test("returns 401 when not authenticated", async () => {
    currentAuthSession = null;
    const { GET } = await routeModulePromise;

    const response = await GET(createStreamRequest(), routeContext);
    expect(response.status).toBe(401);
  });

  test("returns 404 when chat not found", async () => {
    chatRecord = null;
    const { GET } = await routeModulePromise;

    const response = await GET(createStreamRequest(), routeContext);
    expect(response.status).toBe(404);
  });

  test("returns 403 when session not owned by user", async () => {
    sessionRecord = { id: "session-1", userId: "user-2" };
    const { GET } = await routeModulePromise;

    const response = await GET(createStreamRequest(), routeContext);
    expect(response.status).toBe(403);
  });

  test("returns 204 when no active stream", async () => {
    chatRecord = { sessionId: "session-1", activeStreamId: null };
    const { GET } = await routeModulePromise;

    const response = await GET(createStreamRequest(), routeContext);
    expect(response.status).toBe(204);
    expect(spies.workflowFetch).not.toHaveBeenCalled();
    expect(spies.updateChatActiveStreamId).not.toHaveBeenCalled();
  });

  test("forwards runtime response when workflow is running", async () => {
    const { GET } = await routeModulePromise;

    const response = await GET(createStreamRequest(), routeContext);
    expect(response.status).toBe(200);
    expect(spies.workflowFetch).toHaveBeenCalledWith(
      "/api/chat/runs/wrun_active-123/stream",
    );
    expect(spies.updateChatActiveStreamId).not.toHaveBeenCalled();
  });

  test("clears stale ID and returns 204 when runtime reports not running", async () => {
    workflowFetchResult = { kind: "response", status: 204 };
    const { GET } = await routeModulePromise;

    const response = await GET(createStreamRequest(), routeContext);
    expect(response.status).toBe(204);
    expect(spies.updateChatActiveStreamId).toHaveBeenCalledWith("chat-1", null);
  });

  test("clears stale ID and returns 204 when runtime is unreachable", async () => {
    workflowFetchResult = { kind: "throw" };
    const { GET } = await routeModulePromise;

    const response = await GET(createStreamRequest(), routeContext);
    expect(response.status).toBe(204);
    expect(spies.updateChatActiveStreamId).toHaveBeenCalledWith("chat-1", null);
  });
});
