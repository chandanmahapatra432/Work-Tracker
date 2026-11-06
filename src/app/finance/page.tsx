import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, gte, lte, and } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { UserMenu } from "@/components/auth/user-menu";
import { OwedList } from "@/components/finance/owed-list";
import { MonthPicker } from "@/components/finance/month-picker";
import { StatTile } from "@/components/finance/stat-tile";
import { formatCurrency } from "@/lib/currency";

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    redirect("/");
  }

  const params = await searchParams;
  const monthParam = typeof params.month === "string" ? params.month : undefined;
  const month = monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : currentMonth();
  const [year, mon] = month.split("-").map(Number);
  const monthStart = `${month}-01`;
  const monthEnd = new Date(Date.UTC(year, mon, 0)).toISOString().slice(0, 10);

  const monthLabel = new Date(Date.UTC(year, mon - 1, 1)).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const [unpaid, monthVideos] = await Promise.all([
    db.query.videos.findMany({
      where: and(
        eq(videos.editorPaid, false),
        gte(videos.date, monthStart),
        lte(videos.date, monthEnd)
      ),
      with: { editor: true },
    }),
    db.query.videos.findMany({
      where: and(gte(videos.date, monthStart), lte(videos.date, monthEnd)),
    }),
  ]);

  const owedByEditor = new Map<string, { name: string; amount: number }>();
  for (const v of unpaid) {
    const entry = owedByEditor.get(v.editorId) ?? { name: v.editor.name, amount: 0 };
    entry.amount += v.editorPayout;
    owedByEditor.set(v.editorId, entry);
  }
  const owedRows = Array.from(owedByEditor.entries())
    .map(([editorId, v]) => ({ editorId, ...v }))
    .sort((a, b) => b.amount - a.amount);
  const totalOwed = owedRows.reduce((sum, r) => sum + r.amount, 0);

  const billed = monthVideos.reduce((sum, v) => sum + v.price, 0);
  const payouts = monthVideos.reduce((sum, v) => sum + v.editorPayout, 0);
  const profit = billed - payouts;

  return (
    <div className="mx-auto max-w-4xl w-full px-6 py-10 md:px-10 space-y-8">
      <div className="flex justify-end">
        <UserMenu />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-medium text-muted-foreground">Finance</h1>
          <p className="text-xs text-muted-foreground/70">What you owe, and how the month&apos;s shaping up</p>
        </div>
        <div className="flex items-center gap-2">
          <MonthPicker month={month} />
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="size-4" />
              Work tracker
            </Link>
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-medium">You owe</h2>
          <p className="text-xs text-muted-foreground">
            Unpaid editor payouts for {monthLabel}, total {formatCurrency(totalOwed)}
          </p>
        </div>
        <OwedList rows={owedRows} month={month} />
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-medium">{monthLabel}</h2>
          <p className="text-xs text-muted-foreground">Billed vs. paid out to editors</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <StatTile label="Billed" value={formatCurrency(billed)} />
          <StatTile label="Payouts" value={formatCurrency(payouts)} />
          <StatTile
            label="Profit"
            value={formatCurrency(profit)}
            tone={profit >= 0 ? "good" : "critical"}
          />
        </div>
      </div>
    </div>
  );
}
