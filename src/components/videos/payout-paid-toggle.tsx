"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateVideoPayoutPaid } from "@/app/actions/work";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function PayoutPaidToggle({ id, paid }: { id: string; paid: boolean }) {
  const [isPending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      const result = await updateVideoPayoutPaid(id, !paid);
      if (result.error) toast.error(result.error);
    });
  }

  return (
    <button type="button" onClick={toggle} disabled={isPending} className="cursor-pointer disabled:opacity-50">
      <Badge
        variant="secondary"
        className={cn(
          "font-normal",
          paid
            ? "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400"
            : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
        )}
      >
        {paid ? "Paid" : "Unpaid"}
      </Badge>
    </button>
  );
}
