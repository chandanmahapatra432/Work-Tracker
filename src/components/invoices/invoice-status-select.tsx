"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateInvoiceStatus } from "@/app/actions/work";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INVOICE_STATUSES, type Invoice } from "@/db/schema";
import { INVOICE_STATUS_BADGE_STYLES } from "@/lib/work-styles";
import { cn } from "@/lib/utils";

export function InvoiceStatusSelect({ id, status }: { id: string; status: Invoice["status"] }) {
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string) {
    startTransition(async () => {
      const result = await updateInvoiceStatus(id, value);
      if (result.error) toast.error(result.error);
      else toast.success("Invoice updated");
    });
  }

  return (
    <Select value={status} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger
        size="sm"
        className={cn(
          "h-7 w-fit border-transparent font-normal shadow-none",
          INVOICE_STATUS_BADGE_STYLES[status]
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {INVOICE_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {s}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
