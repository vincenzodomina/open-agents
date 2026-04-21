import { describe, expect, test } from "bun:test";
import { resolveSupabaseServerUrl } from "./server-config";

describe("resolveSupabaseServerUrl", () => {
  test("keeps the browser url when not running in Docker", () => {
    expect(
      resolveSupabaseServerUrl({
        browserUrl: "http://127.0.0.1:54321",
        isRunningInDocker: false,
      }),
    ).toBe("http://127.0.0.1:54321");
  });

  test("rewrites loopback urls to the Docker host automatically", () => {
    expect(
      resolveSupabaseServerUrl({
        browserUrl: "http://127.0.0.1:54321",
        isRunningInDocker: true,
      }),
    ).toBe("http://host.docker.internal:54321/");
  });

  test("preserves non-loopback urls in Docker", () => {
    expect(
      resolveSupabaseServerUrl({
        browserUrl: "https://project.supabase.co",
        isRunningInDocker: true,
      }),
    ).toBe("https://project.supabase.co");
  });

  test("still honors an explicit internal override in Docker", () => {
    expect(
      resolveSupabaseServerUrl({
        browserUrl: "http://127.0.0.1:54321",
        internalUrl: "http://supabase.internal:54321",
        isRunningInDocker: true,
      }),
    ).toBe("http://supabase.internal:54321");
  });
});
