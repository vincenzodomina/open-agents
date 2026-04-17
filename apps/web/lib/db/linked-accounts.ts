import { nanoid } from "nanoid";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { mapLinkedAccountRow } from "./maps";
import type { LinkedAccount, NewLinkedAccount } from "./schema";

export async function createLinkedAccount(
  data: Omit<NewLinkedAccount, "id" | "createdAt" | "updatedAt">,
): Promise<LinkedAccount> {
  const id = nanoid();
  const now = new Date().toISOString();

  const { data: account, error } = await getSupabaseAdmin()
    .from("linked_accounts")
    .insert({
      id,
      user_id: data.userId,
      provider: data.provider,
      external_id: data.externalId,
      workspace_id: data.workspaceId ?? null,
      metadata: data.metadata ?? null,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }
  if (!account) {
    throw new Error("Failed to create linked account");
  }

  return mapLinkedAccountRow(account as Record<string, unknown>);
}

export async function getLinkedAccountById(
  id: string,
): Promise<LinkedAccount | undefined> {
  const { data, error } = await getSupabaseAdmin()
    .from("linked_accounts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data
    ? mapLinkedAccountRow(data as Record<string, unknown>)
    : undefined;
}

export async function getLinkedAccountsByUserId(
  userId: string,
): Promise<LinkedAccount[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("linked_accounts")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
  return (data ?? []).map((r) =>
    mapLinkedAccountRow(r as Record<string, unknown>),
  );
}

export async function getLinkedAccountByProviderAndExternalId(
  provider: LinkedAccount["provider"],
  externalId: string,
  workspaceId?: string,
): Promise<LinkedAccount | undefined> {
  let q = getSupabaseAdmin()
    .from("linked_accounts")
    .select("*")
    .eq("provider", provider)
    .eq("external_id", externalId);

  if (workspaceId !== undefined) {
    q = q.eq("workspace_id", workspaceId);
  }

  const { data, error } = await q.limit(1).maybeSingle();

  if (error) {
    throw error;
  }
  return data
    ? mapLinkedAccountRow(data as Record<string, unknown>)
    : undefined;
}

export async function updateLinkedAccount(
  id: string,
  data: Partial<Pick<LinkedAccount, "metadata">>,
): Promise<LinkedAccount | undefined> {
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (data.metadata !== undefined) {
    patch.metadata = data.metadata;
  }

  const { data: account, error } = await getSupabaseAdmin()
    .from("linked_accounts")
    .update(patch)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    throw error;
  }
  return account
    ? mapLinkedAccountRow(account as Record<string, unknown>)
    : undefined;
}

export async function deleteLinkedAccount(id: string): Promise<boolean> {
  const { data, error } = await getSupabaseAdmin()
    .from("linked_accounts")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    throw error;
  }
  return (data?.length ?? 0) > 0;
}

export async function deleteLinkedAccountsByUserId(
  userId: string,
): Promise<number> {
  const { data, error } = await getSupabaseAdmin()
    .from("linked_accounts")
    .delete()
    .eq("user_id", userId)
    .select("id");

  if (error) {
    throw error;
  }
  return data?.length ?? 0;
}
