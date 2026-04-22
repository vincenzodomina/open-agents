"use client";

import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/use-session";

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-24" />
      <div className="rounded-xl border border-border/60 p-5">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { session, loading } = useSession();

  if (loading) {
    return <ProfileSkeleton />;
  }

  const user = session?.user;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Basic account details for this workspace.
        </p>
      </div>

      <div className="rounded-xl border border-border/60 bg-card/60 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {user?.avatar ? (
            <Image
              src={user.avatar}
              alt={user.username}
              width={64}
              height={64}
              className="rounded-full"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-lg font-semibold text-muted-foreground">
              {user?.username?.slice(0, 2).toUpperCase() ?? "OA"}
            </div>
          )}

          <div className="min-w-0 space-y-1">
            <p className="truncate text-lg font-semibold">
              {user?.name ?? user?.username ?? "Unknown user"}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              @{user?.username ?? "unknown"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border/60 p-4">
          <p className="text-sm font-medium text-foreground">Email</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {user?.email ?? "No email available"}
          </p>
        </div>
        <div className="rounded-xl border border-border/60 p-4">
          <p className="text-sm font-medium text-foreground">Auth provider</p>
          <p className="mt-2 text-sm capitalize text-muted-foreground">
            {session?.authProvider ?? "unknown"}
          </p>
        </div>
      </div>
    </div>
  );
}
