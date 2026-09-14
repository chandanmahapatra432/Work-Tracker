import Link from "next/link";
import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { AddUserForm } from "@/components/admin/add-user-form";
import { RemoveUserButton } from "@/components/admin/remove-user-button";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    redirect("/");
  }

  const allUsers = await db.query.users.findMany({ orderBy: [asc(users.email)] });

  return (
    <div className="mx-auto max-w-2xl w-full px-6 py-10 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-medium text-muted-foreground">Manage access</h1>
          <p className="text-xs text-muted-foreground/70">Who can sign in and use this tracker</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/">
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </Button>
      </div>

      <AddUserForm />

      <div className="rounded-xl border bg-card shadow-sm divide-y">
        {allUsers.map((u) => (
          <div key={u.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium">{u.name ?? u.email}</p>
              <p className="text-xs text-muted-foreground">
                {u.email}
                {u.isAdmin ? " · Admin" : ""}
              </p>
            </div>
            {u.id !== session.user.id && <RemoveUserButton id={u.id} email={u.email} />}
          </div>
        ))}
      </div>
    </div>
  );
}
