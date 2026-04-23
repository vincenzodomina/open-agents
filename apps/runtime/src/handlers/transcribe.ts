import { elevenlabs } from "@ai-sdk/elevenlabs";
import { experimental_transcribe as transcribe } from "ai";
import { z } from "zod";

const MAX_BASE64_LENGTH = 10 * 1024 * 1024;

const requestSchema = z.object({
  audio: z.string().min(1),
  mimeType: z.string().optional(),
});

export async function handleTranscribe(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Missing required field: audio" },
      { status: 400 },
    );
  }

  const { audio } = parsed.data;
  if (audio.length > MAX_BASE64_LENGTH) {
    return Response.json(
      { error: "Audio file too large. Maximum size is approximately 7.5MB." },
      { status: 413 },
    );
  }

  try {
    const result = await transcribe({
      model: elevenlabs.transcription("scribe_v1"),
      audio,
      providerOptions: {
        elevenlabs: {
          tagAudioEvents: false,
          numSpeakers: 1,
          languageCode: "eng",
        },
      },
    });
    return Response.json({ text: result.text });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[runtime:transcribe] failed", message);
    return Response.json(
      { error: "Transcription failed", details: message },
      { status: 500 },
    );
  }
}
