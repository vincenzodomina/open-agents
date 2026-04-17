import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

function LoginFormFallback() {
  return (
    <div className="mx-auto w-full max-w-md rounded-lg border border-border bg-card p-8 text-card-foreground shadow-sm">
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  );
}

export default function AuthLoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <Suspense fallback={<LoginFormFallback />}>
        <LoginForm className="w-full max-w-md" />
      </Suspense>
    </div>
  );
}
