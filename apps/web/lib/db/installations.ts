import { nanoid } from "nanoid";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { mapGitHubInstallationRow } from "./maps";
import type { GitHubInstallation, NewGitHubInstallation } from "./schema";

export interface UpsertInstallationInput {
  userId: string;
  installationId: number;
  accountLogin: string;
  accountType: "User" | "Organization";
  repositorySelection: "all" | "selected";
  installationUrl?: string | null;
}

export async function upsertInstallation(
  data: UpsertInstallationInput,
): Promise<GitHubInstallation> {
  const sb = getSupabaseAdmin();

  const { data: existingRows, error: findErr } = await sb
    .from("github_installations")
    .select("id")
    .eq("user_id", data.userId)
    .or(
      `installation_id.eq.${data.installationId},account_login.eq.${data.accountLogin}`,
    )
    .limit(1);

  if (findErr) {
    throw findErr;
  }

  const existing = existingRows?.[0] as { id: string } | undefined;
  const now = new Date().toISOString();

  if (existing) {
    const { data: updated, error } = await sb
      .from("github_installations")
      .update({
        installation_id: data.installationId,
        account_login: data.accountLogin,
        account_type: data.accountType,
        repository_selection: data.repositorySelection,
        installation_url: data.installationUrl ?? null,
        updated_at: now,
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) {
      throw error;
    }
    if (!updated) {
      throw new Error("Failed to update GitHub installation");
    }
    return mapGitHubInstallationRow(updated as Record<string, unknown>);
  }

  const installation: NewGitHubInstallation = {
    id: nanoid(),
    userId: data.userId,
    installationId: data.installationId,
    accountLogin: data.accountLogin,
    accountType: data.accountType,
    repositorySelection: data.repositorySelection,
    installationUrl: data.installationUrl ?? null,
    createdAt: new Date(now),
    updatedAt: new Date(now),
  };

  const { data: created, error } = await sb
    .from("github_installations")
    .insert({
      id: installation.id,
      user_id: installation.userId,
      installation_id: installation.installationId,
      account_login: installation.accountLogin,
      account_type: installation.accountType,
      repository_selection: installation.repositorySelection,
      installation_url: installation.installationUrl,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }
  if (!created) {
    throw new Error("Failed to create GitHub installation");
  }

  return mapGitHubInstallationRow(created as Record<string, unknown>);
}

export async function getInstallationsByUserId(
  userId: string,
): Promise<GitHubInstallation[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("github_installations")
    .select("*")
    .eq("user_id", userId)
    .order("account_login", { ascending: true });

  if (error) {
    throw error;
  }
  return (data ?? []).map((r) =>
    mapGitHubInstallationRow(r as Record<string, unknown>),
  );
}

export async function getInstallationByAccountLogin(
  userId: string,
  accountLogin: string,
): Promise<GitHubInstallation | undefined> {
  const { data, error } = await getSupabaseAdmin()
    .from("github_installations")
    .select("*")
    .eq("user_id", userId)
    .eq("account_login", accountLogin)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data
    ? mapGitHubInstallationRow(data as Record<string, unknown>)
    : undefined;
}

export async function getInstallationByUserAndId(
  userId: string,
  installationId: number,
): Promise<GitHubInstallation | undefined> {
  const { data, error } = await getSupabaseAdmin()
    .from("github_installations")
    .select("*")
    .eq("user_id", userId)
    .eq("installation_id", installationId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data
    ? mapGitHubInstallationRow(data as Record<string, unknown>)
    : undefined;
}

export async function getInstallationsByInstallationId(
  installationId: number,
): Promise<GitHubInstallation[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("github_installations")
    .select("*")
    .eq("installation_id", installationId);

  if (error) {
    throw error;
  }
  return (data ?? []).map((r) =>
    mapGitHubInstallationRow(r as Record<string, unknown>),
  );
}

export async function deleteInstallationByInstallationId(
  installationId: number,
): Promise<number> {
  const { data, error } = await getSupabaseAdmin()
    .from("github_installations")
    .delete()
    .eq("installation_id", installationId)
    .select("id");

  if (error) {
    throw error;
  }
  return data?.length ?? 0;
}

export async function deleteInstallationsByUserId(
  userId: string,
): Promise<number> {
  const { data, error } = await getSupabaseAdmin()
    .from("github_installations")
    .delete()
    .eq("user_id", userId)
    .select("id");

  if (error) {
    throw error;
  }
  return data?.length ?? 0;
}

export async function deleteInstallationsNotInList(
  userId: string,
  installationIds: number[],
): Promise<number> {
  if (installationIds.length === 0) {
    return deleteInstallationsByUserId(userId);
  }

  const sb = getSupabaseAdmin();
  const { data: rows, error: selErr } = await sb
    .from("github_installations")
    .select("id, installation_id")
    .eq("user_id", userId);

  if (selErr) {
    throw selErr;
  }

  const keep = new Set(installationIds);
  const toRemove = (rows ?? [])
    .filter(
      (r) =>
        !keep.has(Number((r as { installation_id: number }).installation_id)),
    )
    .map((r) => (r as { id: string }).id);

  if (toRemove.length === 0) {
    return 0;
  }

  const { data: deleted, error } = await sb
    .from("github_installations")
    .delete()
    .in("id", toRemove)
    .select("id");

  if (error) {
    throw error;
  }
  return deleted?.length ?? 0;
}

export async function updateInstallationsByInstallationId(
  installationId: number,
  updates: {
    accountLogin?: string;
    accountType?: "User" | "Organization";
    repositorySelection?: "all" | "selected";
    installationUrl?: string | null;
  },
): Promise<number> {
  if (
    updates.accountLogin === undefined &&
    updates.accountType === undefined &&
    updates.repositorySelection === undefined &&
    updates.installationUrl === undefined
  ) {
    return 0;
  }

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (updates.accountLogin !== undefined) {
    patch.account_login = updates.accountLogin;
  }
  if (updates.accountType !== undefined) {
    patch.account_type = updates.accountType;
  }
  if (updates.repositorySelection !== undefined) {
    patch.repository_selection = updates.repositorySelection;
  }
  if (updates.installationUrl !== undefined) {
    patch.installation_url = updates.installationUrl;
  }

  const { data, error } = await getSupabaseAdmin()
    .from("github_installations")
    .update(patch)
    .eq("installation_id", installationId)
    .select("id");

  if (error) {
    throw error;
  }
  return data?.length ?? 0;
}
