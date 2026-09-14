import type { WORK_PROGRESS_VALUES, INVOICE_STATUSES } from "@/db/schema";

export const PROGRESS_BADGE_STYLES: Record<(typeof WORK_PROGRESS_VALUES)[number], string> = {
  Pending: "bg-muted text-muted-foreground",
  "In Progress": "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  Completed: "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400",
  Paid: "bg-primary/10 text-primary",
};

export const INVOICE_STATUS_BADGE_STYLES: Record<(typeof INVOICE_STATUSES)[number], string> = {
  Draft: "bg-muted text-muted-foreground",
  Sent: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  Paid: "bg-primary/10 text-primary",
};
