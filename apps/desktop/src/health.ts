export type WaitOptions = {
  url: string;
  timeoutMs?: number;
  intervalMs?: number;
  label?: string;
};

export async function waitForHttp(options: WaitOptions): Promise<void> {
  const timeoutMs = options.timeoutMs ?? 30_000;
  const intervalMs = options.intervalMs ?? 250;
  const label = options.label ?? options.url;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const res = await fetch(options.url, { method: "GET" });
      if (res.ok || res.status === 204 || res.status === 401) {
        return;
      }
    } catch {
      // still starting
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error(`Timed out waiting for ${label} at ${options.url}`);
}
