import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function getLastRepoByUserId(userId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("sessions")
    .select("repo_owner, repo_name")
    .eq("user_id", userId)
    .not("repo_owner", "is", null)
    .not("repo_name", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const row = data as { repo_owner: string; repo_name: string } | null;
  if (!row?.repo_owner || !row?.repo_name) {
    return null;
  }

  return {
    owner: row.repo_owner,
    repo: row.repo_name,
  };
}
