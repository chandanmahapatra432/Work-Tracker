import { db } from "@/db";

/** Sequential, human-readable invoice numbers: INV-2026-0001, INV-2026-0002, ... */
export async function nextInvoiceNumber(year: number): Promise<string> {
  const prefix = `INV-${year}-`;
  const rows = await db.query.invoices.findMany({
    columns: { invoiceNumber: true },
  });
  const seqs = rows
    .map((r) => r.invoiceNumber)
    .filter((n) => n.startsWith(prefix))
    .map((n) => Number(n.slice(prefix.length)))
    .filter((n) => Number.isInteger(n));
  const next = (seqs.length ? Math.max(...seqs) : 0) + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}
