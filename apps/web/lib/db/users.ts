import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function userExists(userId: string): Promise<boolean> {
  const { data, error } = await getSupabaseAdmin()
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data != null;
}

export async function upsertUser(userData: {
  supabaseUserId: string;
  username: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
}): Promise<string> {
  const sb = getSupabaseAdmin();
  const { supabaseUserId } = userData;

  const { data: existing, error: findErr } = await sb
    .from("users")
    .select("id")
    .eq("id", supabaseUserId)
    .maybeSingle();

  if (findErr) {
    throw findErr;
  }

  if (existing?.id) {
    const { error: updErr } = await sb
      .from("users")
      .update({
        username: userData.username,
        email: userData.email ?? null,
        name: userData.name ?? null,
        avatar_url: userData.avatarUrl ?? null,
        updated_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (updErr) {
      throw updErr;
    }
    return existing.id;
  }

  const userId = supabaseUserId;
  const now = new Date().toISOString();
  const { error: insErr } = await sb.from("users").insert({
    id: userId,
    username: userData.username,
    email: userData.email ?? null,
    name: userData.name ?? null,
    avatar_url: userData.avatarUrl ?? null,
    created_at: now,
    updated_at: now,
    last_login_at: now,
  });

  if (insErr) {
    throw insErr;
  }
  return userId;
}
