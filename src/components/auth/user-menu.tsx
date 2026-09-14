import Link from "next/link";
import { LogOut, Shield } from "lucide-react";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export async function UserMenu() {
  const session = await auth();
  if (!session?.user) return null;

  return (
    <div className="flex items-center gap-2">
      {session.user.isAdmin && (
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin">
            <Shield className="size-4" />
            Manage access
          </Link>
        </Button>
      )}
      <span className="hidden text-xs text-muted-foreground sm:inline">
        {session.user.email}
      </span>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <Button type="submit" variant="ghost" size="sm">
          <LogOut className="size-4" />
          Sign out
        </Button>
      </form>
    </div>
  );
}
