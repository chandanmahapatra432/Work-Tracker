import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "critical";
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-xl font-semibold",
          tone === "good" && "text-emerald-600 dark:text-emerald-400",
          tone === "critical" && "text-destructive"
        )}
      >
        {value}
      </p>
    </div>
  );
}
