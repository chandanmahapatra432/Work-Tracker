"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WORK_PROGRESS_VALUES, type Client, type Editor } from "@/db/schema";

const ALL = "__all__";

export function WorkFiltersBar({
  clients,
  editors,
  filters,
  isAdmin,
}: {
  clients: Client[];
  editors: Editor[];
  filters: { client?: string; editor?: string; progress?: string; month?: string };
  isAdmin: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === ALL || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={filters.client ?? ALL} onValueChange={(v) => update("client", v)}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Client" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All clients</SelectItem>
          {clients.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isAdmin && (
        <Select value={filters.editor ?? ALL} onValueChange={(v) => update("editor", v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Editor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All editors</SelectItem>
            {editors.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select value={filters.progress ?? ALL} onValueChange={(v) => update("progress", v)}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Progress" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All progress</SelectItem>
          {WORK_PROGRESS_VALUES.map((p) => (
            <SelectItem key={p} value={p}>
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <input
        type="month"
        value={filters.month ?? ""}
        onChange={(e) => update("month", e.target.value)}
        className="h-9 rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
      />
    </div>
  );
}
