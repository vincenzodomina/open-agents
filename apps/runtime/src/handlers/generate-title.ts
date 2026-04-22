import { gateway } from "@open-harness/agent";
import { generateText } from "ai";
import { z } from "zod";

const requestSchema = z.object({
  message: z.string().trim().min(1),
});

const MAX_MESSAGE_LENGTH = 2000;
const MAX_TITLE_LENGTH = 60;
const TITLE_MODEL = "openai/gpt-5.4";

const TITLE_PROMPT = (message: string) =>
  `You are a developer tool that names coding sessions. Generate a concise title (max 5 words) for a coding session based on the user's first message below. The title should help the user quickly identify what this session is about at a glance. Do NOT use quotes or punctuation around the title. Respond with ONLY the title, nothing else.

User message:
${message}`;

export async function generateSessionTitle(
  message: string,
): Promise<string | null> {
  const trimmed = message.trim().slice(0, MAX_MESSAGE_LENGTH);
  if (trimmed.length === 0) {
    return null;
  }

  try {
    const result = await generateText({
      model: gateway(TITLE_MODEL),
      prompt: TITLE_PROMPT(trimmed),
    });
    const title = result.text.trim().split("\n")[0]?.trim();
    if (title && title.length > 0) {
      return title.slice(0, MAX_TITLE_LENGTH);
    }
    return null;
  } catch (error) {
    console.error("[runtime:generate-title] failed", error);
    return null;
  }
}

export async function handleGenerateTitle(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Missing required field: message" },
      { status: 400 },
    );
  }

  const title = await generateSessionTitle(parsed.data.message);
  if (!title) {
    return Response.json(
      { error: "Failed to generate title" },
      { status: 500 },
    );
  }
  return Response.json({ title });
}
