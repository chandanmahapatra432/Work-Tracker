import Link from "next/link";
import { Download } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { InvoiceStatusSelect } from "./invoice-status-select";
import { DeleteInvoiceButton } from "./delete-invoice-button";
import type { Client, Invoice } from "@/db/schema";
import { formatCurrency } from "@/lib/currency";

type InvoiceWithClient = Invoice & { client: Client };

export function InvoiceList({ invoices }: { invoices: InvoiceWithClient[] }) {
  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Invoice</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Issued</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-0" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={7} className="h-28 text-center text-muted-foreground">
                No invoices yet.
              </TableCell>
            </TableRow>
          ) : (
            invoices.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                <TableCell>{inv.client.name}</TableCell>
                <TableCell>
                  {inv.periodStart} – {inv.periodEnd}
                </TableCell>
                <TableCell>{inv.issueDate}</TableCell>
                <TableCell>{formatCurrency(inv.subtotal)}</TableCell>
                <TableCell>
                  <InvoiceStatusSelect id={inv.id} status={inv.status} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon-sm" asChild>
                      <Link href={`/api/invoices/${inv.id}/pdf`} target="_blank">
                        <Download className="size-4" />
                      </Link>
                    </Button>
                    <DeleteInvoiceButton id={inv.id} invoiceNumber={inv.invoiceNumber} />
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
