import Link from "next/link";
import { redirect } from "next/navigation";
import { asc, desc } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { clients, invoices } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { UserMenu } from "@/components/auth/user-menu";
import { GenerateInvoiceDialog } from "@/components/invoices/generate-invoice-dialog";
import { InvoiceList } from "@/components/invoices/invoice-list";

export default async function InvoicesPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    redirect("/");
  }

  const [rows, allClients] = await Promise.all([
    db.query.invoices.findMany({
      orderBy: [desc(invoices.issueDate)],
      with: { client: true },
    }),
    db.query.clients.findMany({ orderBy: [asc(clients.name)] }),
  ]);

  return (
    <div className="mx-auto max-w-7xl w-full px-6 py-10 md:px-10 space-y-8">
      <div className="flex justify-end">
        <UserMenu />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-medium text-muted-foreground">Invoices</h1>
          <p className="text-xs text-muted-foreground/70">
            {rows.length} invoice{rows.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="size-4" />
              Work tracker
            </Link>
          </Button>
          <GenerateInvoiceDialog clients={allClients} />
        </div>
      </div>

      <InvoiceList invoices={rows} />
    </div>
  );
}
