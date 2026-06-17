export type RuntimeConfig = {
  host: string;
  port: number;
  supabaseUrl: string;
  supabaseAnonKey: string;
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export function loadRuntimeConfig(): RuntimeConfig {
  return {
    host: process.env.RUNTIME_HOST?.trim() || "127.0.0.1",
    port: Number.parseInt(process.env.RUNTIME_PORT?.trim() || "3001", 10),
    supabaseUrl: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseAnonKey: requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}
