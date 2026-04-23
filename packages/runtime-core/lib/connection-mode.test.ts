import { describe, expect, test } from "bun:test";
import {
  parseConnectionMode,
  resolveConnectionConfig,
} from "./connection-mode.ts";

describe("parseConnectionMode", () => {
  test("defaults to embedded when undefined", () => {
    expect(parseConnectionMode(undefined)).toBe("embedded");
  });

  test("accepts lowercase and uppercase", () => {
    expect(parseConnectionMode("http")).toBe("http");
    expect(parseConnectionMode("HTTP")).toBe("http");
    expect(parseConnectionMode("ssh")).toBe("ssh");
  });

  test("throws on unknown mode", () => {
    expect(() => parseConnectionMode("grpc")).toThrow(/Invalid/);
  });
});

describe("resolveConnectionConfig", () => {
  test("embedded uses a default url when none provided", () => {
    const config = resolveConnectionConfig({ mode: "embedded" });
    expect(config.mode).toBe("embedded");
    expect(config.url).toMatch(/^http:\/\/127\.0\.0\.1/);
  });

  test("http requires a url", () => {
    expect(() => resolveConnectionConfig({ mode: "http" })).toThrow(
      /SERVER_CONNECTION_URL/,
    );
  });

  test("ssh requires a url", () => {
    expect(() => resolveConnectionConfig({ mode: "ssh" })).toThrow(
      /SERVER_CONNECTION_URL/,
    );
  });

  test("http honors provided url", () => {
    const config = resolveConnectionConfig({
      mode: "http",
      url: "https://runtime.example.com",
    });
    expect(config).toEqual({
      mode: "http",
      url: "https://runtime.example.com",
    });
  });
});
