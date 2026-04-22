import { forwardToRuntime } from "@/lib/runtime-connection/proxy-handler";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function handle(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { path } = await context.params;
  const targetPath = `/${path.join("/")}`;
  return forwardToRuntime(request, targetPath);
}

export async function GET(request: Request, context: RouteContext) {
  return handle(request, context);
}

export async function POST(request: Request, context: RouteContext) {
  return handle(request, context);
}

export async function PUT(request: Request, context: RouteContext) {
  return handle(request, context);
}

export async function PATCH(request: Request, context: RouteContext) {
  return handle(request, context);
}

export async function DELETE(request: Request, context: RouteContext) {
  return handle(request, context);
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
