import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
      <p className="text-center text-sm text-muted-foreground">
        Something went wrong while signing in.
      </p>
      <Button asChild variant="outline">
        <Link href="/auth/login">Try again</Link>
      </Button>
      <Link href="/" className="text-sm text-muted-foreground underline">
        Home
      </Link>
    </div>
  );
}
