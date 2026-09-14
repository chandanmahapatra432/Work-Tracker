"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function MonthPicker({ month }: { month: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("month", value);
    else params.delete("month");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <input
      type="month"
      value={month}
      onChange={(e) => handleChange(e.target.value)}
      className="h-9 rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
    />
  );
}
