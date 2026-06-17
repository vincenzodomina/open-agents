import { gateway } from "@open-harness/agent";
import { connectSandbox, type SandboxState } from "@open-harness/sandbox";
import { generateText } from "ai";
import { z } from "zod";

const FALLBACK_MESSAGE = "chore: update repository changes";
const MAX_MESSAGE_LENGTH = 72;
const MAX_DIFF_CHARS = 8000;
const COMMIT_MODEL = "openai/gpt-5.4";

const requestSchema = z.object({
  sandboxState: z.unknown().refine((v) => v !== undefined, {
    message: "sandboxState is required",
  }),
  sessionTitle: z.string().optional(),
});

const DIFF_COMMAND =
  "git diff HEAD --stat && echo '---DIFF---' && git diff HEAD";
const DIFF_TIMEOUT_MS = 30_000;
const DIFF_MARKER = "---DIFF---";

const prompt = (diff: string, sessionTitle: string) =>
  `Generate a concise git commit message for these changes. Use conventional commit format (e.g., "feat:", "fix:", "refactor:"). One line only, max 72 characters.

Session context: ${sessionTitle}

Diff:
${diff.slice(0, MAX_DIFF_CHARS)}

Respond with ONLY the commit message, nothing else.`;

export async function handleGenerateCommitMessage(
  request: Request,
): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Missing required field: sandboxState" },
      { status: 400 },
    );
  }

  const sandbox = await connectSandbox(
    parsed.data.sandboxState as SandboxState,
  );
  const diffResult = await sandbox.exec(
    DIFF_COMMAND,
    sandbox.workingDirectory,
    DIFF_TIMEOUT_MS,
  );
  const diff = diffResult.stdout;
  if (!diff.trim() || !diff.includes(DIFF_MARKER)) {
    return Response.json({ message: FALLBACK_MESSAGE });
  }

  const message = await generateCommitMessageFromDiff({
    diff,
    sessionTitle: parsed.data.sessionTitle ?? "",
  });
  return Response.json({ message });
}

export async function generateCommitMessageFromDiff(args: {
  diff: string;
  sessionTitle: string;
}): Promise<string> {
  try {
    const result = await generateText({
      model: gateway(COMMIT_MODEL),
      prompt: prompt(args.diff, args.sessionTitle),
    });
    const generated = result.text.trim().split("\n")[0]?.trim();
    if (generated && generated.length > 0) {
      return generated.slice(0, MAX_MESSAGE_LENGTH);
    }
    return FALLBACK_MESSAGE;
  } catch (error) {
    console.error("[runtime:generate-commit-message] failed", error);
    return FALLBACK_MESSAGE;
  }
}
