import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session/get-server-session";
import { HomePage } from "./home-page";

function hasSupabaseAuthCookie(
  names: { name: string; value: string }[],
): boolean {
  return names.some((c) => /^sb-[^-]+-auth-token$/.test(c.name));
}

export default async function Home() {
  const session = await getServerSession();
  if (session?.user) {
    redirect("/sessions");
  }

  const store = await cookies();
  const hasSessionCookie = hasSupabaseAuthCookie(store.getAll());

  return <HomePage hasSessionCookie={hasSessionCookie} />;
}
