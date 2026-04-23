type WorkflowBundle = {
  POST: (req: Request) => Promise<Response>;
  GET?: (req: Request) => Promise<Response>;
};

let cached: {
  step: WorkflowBundle;
  flow: WorkflowBundle;
  webhook: WorkflowBundle;
} | null = null;

async function loadBundles() {
  if (cached) {
    return cached;
  }
  const base = "./.well-known/workflow/v1/";
  const [step, flow, webhook] = (await Promise.all([
    import(`${base}step.mjs`),
    import(`${base}flow.mjs`),
    import(`${base}webhook.mjs`),
  ])) as [WorkflowBundle, WorkflowBundle, WorkflowBundle];
  cached = { step, flow, webhook };
  return cached;
}

export async function handleWorkflowControlPlane(
  request: Request,
  url: URL,
): Promise<Response> {
  const bundles = await loadBundles();
  if (url.pathname === "/.well-known/workflow/v1/step") {
    if (request.method === "POST") {
      return bundles.step.POST(request);
    }
    return new Response(null, { status: 405 });
  }
  if (url.pathname === "/.well-known/workflow/v1/flow") {
    if (request.method === "POST") {
      return bundles.flow.POST(request);
    }
    return new Response(null, { status: 405 });
  }
  if (url.pathname.startsWith("/.well-known/workflow/v1/webhook/")) {
    if (request.method === "POST") {
      return bundles.webhook.POST(request);
    }
    if (request.method === "GET" && bundles.webhook.GET) {
      return bundles.webhook.GET(request);
    }
    return new Response(null, { status: 405 });
  }
  return Response.json({ error: "not_found" }, { status: 404 });
}
