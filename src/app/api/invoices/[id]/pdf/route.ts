import { auth } from "@/auth";
import { db } from "@/db";
import { generateInvoicePdf } from "@/lib/generate-invoice-pdf";

export async function GET(_req: Request, ctx: RouteContext<"/api/invoices/[id]/pdf">) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return new Response("Not authorized", { status: 403 });
  }

  const { id } = await ctx.params;

  const invoice = await db.query.invoices.findFirst({
    where: (invoices, { eq }) => eq(invoices.id, id),
    with: { client: true, videos: { with: { editor: true } } },
  });

  if (!invoice) {
    return new Response("Invoice not found", { status: 404 });
  }

  const pdf = await generateInvoicePdf(invoice);

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
    },
  });
}
