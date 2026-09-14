"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { markEditorPayoutsPaid } from "@/app/actions/work";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";

type OwedRow = { editorId: string; name: string; amount: number };

export function OwedList({ rows }: { rows: OwedRow[] }) {
  const [isPending, startTransition] = useTransition();

  function handleMarkPaid(editorId: string) {
    startTransition(async () => {
      const result = await markEditorPayoutsPaid(editorId);
      if (result.error) toast.error(result.error);
      else toast.success("Marked as paid");
    });
  }

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Nothing owed right now.</p>;
  }

  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div
          key={r.editorId}
          className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
        >
          <div>
            <p className="text-sm font-medium">{r.name}</p>
            <p className="text-xs text-muted-foreground">{formatCurrency(r.amount)} owed</p>
          </div>
          <Button size="sm" variant="outline" disabled={isPending} onClick={() => handleMarkPaid(r.editorId)}>
            Mark as paid
          </Button>
        </div>
      ))}
    </div>
  );
}
