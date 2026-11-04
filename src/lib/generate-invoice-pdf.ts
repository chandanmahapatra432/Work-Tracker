import PDFDocument from "pdfkit";
import type { Client, Editor, Invoice, Video } from "@/db/schema";
import { formatCurrency } from "./currency";
import { BUSINESS_INFO } from "./business-info";

type InvoiceData = Invoice & { client: Client; videos: (Video & { editor: Editor })[] };

const COLUMNS = [
  { key: "name", label: "Video", x: 50, width: 200 },
  { key: "editor", label: "Editor", x: 250, width: 120 },
  { key: "date", label: "Date", x: 370, width: 90 },
  { key: "price", label: "Price", x: 460, width: 90 },
] as const;

export function generateInvoicePdf(invoice: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("INVOICE", 400, 50, { width: 160, align: "right" });
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(invoice.invoiceNumber, 400, 75, { width: 160, align: "right" })
      .text(`Issued ${invoice.issueDate}`, 400, 90, { width: 160, align: "right" });

    doc.moveDown(3);
    const infoTop = 130;

    doc.fontSize(10).font("Helvetica-Bold").text("From", 50, infoTop);
    doc
      .font("Helvetica")
      .text(BUSINESS_INFO.name, 50, infoTop + 15)
      .text(BUSINESS_INFO.email, 50, infoTop + 30);

    doc.font("Helvetica-Bold").text("Bill to", 300, infoTop);
    doc.font("Helvetica").text(invoice.client.name, 300, infoTop + 15);
    let billToY = infoTop + 30;
    if (invoice.client.company) {
      doc.text(invoice.client.company, 300, billToY);
      billToY += 15;
    }
    if (invoice.client.email) {
      doc.text(invoice.client.email, 300, billToY);
      billToY += 15;
    }
    if (invoice.client.address) {
      doc.text(invoice.client.address, 300, billToY, { width: 250 });
    }

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`Billing period: ${invoice.periodStart} to ${invoice.periodEnd}`, 50, 210);

    let y = 245;
    doc.font("Helvetica-Bold");
    for (const col of COLUMNS) {
      doc.text(col.label, col.x, y, { width: col.width, align: col.key === "price" ? "right" : "left" });
    }
    y += 18;
    doc.moveTo(50, y).lineTo(550, y).strokeColor("#cccccc").stroke();
    y += 8;

    doc.font("Helvetica");
    for (const video of invoice.videos) {
      if (y > 720) {
        doc.addPage();
        y = 50;
      }
      doc.text(video.name, COLUMNS[0].x, y, { width: COLUMNS[0].width });
      doc.text(video.editor.name, COLUMNS[1].x, y, { width: COLUMNS[1].width });
      doc.text(video.date, COLUMNS[2].x, y, { width: COLUMNS[2].width });
      doc.text(formatCurrency(video.price), COLUMNS[3].x, y, { width: COLUMNS[3].width, align: "right" });
      y += 20;
    }

    y += 10;
    doc.moveTo(350, y).lineTo(550, y).strokeColor("#cccccc").stroke();
    y += 10;
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .text("Total", 370, y, { width: 90 })
      .text(formatCurrency(invoice.subtotal), 460, y, { width: 90, align: "right" });

    if (invoice.notes) {
      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#666666")
        .text(invoice.notes, 50, y + 40, { width: 500 });
    }

    doc.end();
  });
}
