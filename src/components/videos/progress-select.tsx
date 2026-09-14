"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateVideoProgress } from "@/app/actions/work";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WORK_PROGRESS_VALUES, type Video } from "@/db/schema";
import { PROGRESS_BADGE_STYLES } from "@/lib/work-styles";
import { cn } from "@/lib/utils";

export function ProgressSelect({
  id,
  progress,
  disabled,
}: {
  id: string;
  progress: Video["progress"];
  disabled?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string) {
    startTransition(async () => {
      const result = await updateVideoProgress(id, value);
      if (result.error) toast.error(result.error);
      else toast.success("Progress updated");
    });
  }

  return (
    <Select value={progress} onValueChange={handleChange} disabled={disabled || isPending}>
      <SelectTrigger
        size="sm"
        className={cn(
          "h-7 w-fit border-transparent font-normal shadow-none",
          PROGRESS_BADGE_STYLES[progress]
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {WORK_PROGRESS_VALUES.map((p) => (
          <SelectItem key={p} value={p}>
            {p}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
