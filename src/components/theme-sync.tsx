"use client";

import { useLayoutEffect } from "react";

// The inline script in <head> sets the "dark" class before first paint to
// avoid a flash, but React's Strict Mode remount in dev clears attributes it
// doesn't manage from JSX. Re-apply here so dev matches prod.
export function ThemeSync() {
  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  return null;
}
