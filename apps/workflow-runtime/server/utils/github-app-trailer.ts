let cachedTrailer: string | null | undefined;

export async function getAppCoAuthorTrailer(): Promise<string | null> {
  if (cachedTrailer !== undefined) return cachedTrailer;

  const slug = process.env.NEXT_PUBLIC_GITHUB_APP_SLUG;
  if (!slug) {
    cachedTrailer = null;
    return null;
  }

  const botName = `${slug}[bot]`;
  let botUserId: number | null = null;

  try {
    const res = await fetch(
      `https://api.github.com/users/${encodeURIComponent(botName)}`,
      { headers: { Accept: "application/vnd.github+json" } },
    );
    if (res.ok) {
      const data = (await res.json()) as { id?: number };
      botUserId = data.id ?? null;
    }
  } catch {
    botUserId = null;
  }

  const botEmail = botUserId
    ? `${botUserId}+${botName}@users.noreply.github.com`
    : `${botName}@users.noreply.github.com`;
  cachedTrailer = `Co-Authored-By: ${botName} <${botEmail}>`;
  return cachedTrailer;
}
