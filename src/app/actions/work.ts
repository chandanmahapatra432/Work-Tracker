"use server";

import { revalidatePath } from "next/cache";
import { and, asc, eq, gte, inArray, isNull, lte } from "drizzle-orm";
import { db } from "@/db";
import { clients, editors, invoices, videos, INVOICE_STATUSES, WORK_PROGRESS_VALUES } from "@/db/schema";
import { nextInvoiceNumber } from "@/lib/invoice";
import { auth } from "@/auth";

export type ActionResult = { error?: string };

function str(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") return null;
  return value.trim();
}

async function isAdmin(): Promise<boolean> {
  const session = await auth();
  return !!session?.user?.isAdmin;
}

/** The editor profile linked to the signed-in account, if any. */
async function currentEditorId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const [editor] = await db
    .select({ id: editors.id })
    .from(editors)
    .where(eq(editors.userId, session.user.id));
  return editor?.id ?? null;
}

// --- Videos (work items) ---
// Price and everything invoice-related is admin-only: readVideoInput leaves
// price unset when the field wasn't submitted (non-admins never see the
// field), and callers below ignore any submitted price for non-admins so a
// crafted request can't set it either.
//
// A non-admin account is scoped to whichever editor profile it's linked to
// (editors.userId): they can only see, add to, and modify videos under that
// editor, regardless of what a crafted request claims.

function readVideoInput(formData: FormData) {
  const name = str(formData, "name");
  if (!name) return { error: "Video name is required." } as const;

  // Required for admins (who pick from a dropdown); non-admins never submit
  // this field at all — their own linked editor is substituted by the caller.
  const editorId = str(formData, "editorId");

  const clientId = str(formData, "clientId");
  if (!clientId) return { error: "Client is required." } as const;

  const date = str(formData, "date");
  if (!date) return { error: "Date is required." } as const;

  const progress = str(formData, "progress") ?? "Pending";
  if (!WORK_PROGRESS_VALUES.includes(progress as (typeof WORK_PROGRESS_VALUES)[number])) {
    return { error: "Invalid progress value." } as const;
  }

  const priceRaw = str(formData, "price");
  let price: number | null = null;
  if (priceRaw !== null) {
    const parsed = Number(priceRaw);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return { error: "Price must be a non-negative number." } as const;
    }
    price = parsed;
  }

  const payoutRaw = str(formData, "editorPayout");
  let editorPayout: number | null = null;
  if (payoutRaw !== null) {
    const parsed = Number(payoutRaw);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return { error: "Editor payout must be a non-negative number." } as const;
    }
    editorPayout = parsed;
  }

  return {
    data: {
      name,
      editorId,
      clientId,
      date,
      price,
      editorPayout,
      progress: progress as (typeof WORK_PROGRESS_VALUES)[number],
      notes: str(formData, "notes"),
    },
  } as const;
}

export async function createVideo(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const result = readVideoInput(formData);
  if ("error" in result) return { error: result.error };

  const admin = await isAdmin();
  const { price, editorPayout, editorId, ...rest } = result.data;

  let ownEditorId: string;
  if (admin) {
    if (!editorId) return { error: "Editor is required." };
    ownEditorId = editorId;
  } else {
    const own = await currentEditorId();
    if (!own) return { error: "Your account isn't linked to an editor profile. Ask your admin." };
    ownEditorId = own;
  }

  await db.insert(videos).values({
    ...rest,
    editorId: ownEditorId,
    price: admin ? (price ?? 0) : 0,
    editorPayout: admin ? (editorPayout ?? 0) : 0,
  });
  revalidatePath("/");
  return {};
}

export async function updateVideo(
  id: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const result = readVideoInput(formData);
  if ("error" in result) return { error: result.error };

  const [current] = await db
    .select({
      invoiceId: videos.invoiceId,
      price: videos.price,
      editorPayout: videos.editorPayout,
      editorId: videos.editorId,
    })
    .from(videos)
    .where(eq(videos.id, id));
  if (current?.invoiceId) {
    return { error: "This video is already on an invoice and can't be edited." };
  }

  const admin = await isAdmin();
  const { price, editorPayout, editorId, ...rest } = result.data;

  let ownEditorId: string;
  if (admin) {
    if (!editorId) return { error: "Editor is required." };
    ownEditorId = editorId;
  } else {
    const own = await currentEditorId();
    if (!own || current?.editorId !== own) return { error: "Not authorized." };
    ownEditorId = own;
  }

  const nextPrice = admin ? (price ?? current?.price ?? 0) : (current?.price ?? 0);
  const nextPayout = admin ? (editorPayout ?? current?.editorPayout ?? 0) : (current?.editorPayout ?? 0);

  await db
    .update(videos)
    .set({ ...rest, editorId: ownEditorId, price: nextPrice, editorPayout: nextPayout, updatedAt: new Date() })
    .where(eq(videos.id, id));

  revalidatePath("/");
  return {};
}

export async function updateVideoProgress(id: string, progress: string): Promise<ActionResult> {
  if (!WORK_PROGRESS_VALUES.includes(progress as (typeof WORK_PROGRESS_VALUES)[number])) {
    return { error: "Invalid progress value." };
  }

  if (!(await isAdmin())) {
    const [current] = await db.select({ editorId: videos.editorId }).from(videos).where(eq(videos.id, id));
    const own = await currentEditorId();
    if (!own || current?.editorId !== own) return { error: "Not authorized." };
  }

  await db
    .update(videos)
    .set({ progress: progress as (typeof WORK_PROGRESS_VALUES)[number], updatedAt: new Date() })
    .where(eq(videos.id, id));
  revalidatePath("/");
  return {};
}

export async function deleteVideo(id: string): Promise<ActionResult> {
  const [current] = await db
    .select({ invoiceId: videos.invoiceId, editorId: videos.editorId })
    .from(videos)
    .where(eq(videos.id, id));
  if (current?.invoiceId) {
    return { error: "This video is already on an invoice and can't be deleted." };
  }

  if (!(await isAdmin())) {
    const own = await currentEditorId();
    if (!own || current?.editorId !== own) return { error: "Not authorized." };
  }

  await db.delete(videos).where(eq(videos.id, id));
  revalidatePath("/");
  return {};
}

/** Toggle whether one video's editor payout has been settled. Admin-only. */
export async function updateVideoPayoutPaid(id: string, paid: boolean): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: "Not authorized." };

  await db.update(videos).set({ editorPaid: paid, updatedAt: new Date() }).where(eq(videos.id, id));
  revalidatePath("/");
  revalidatePath("/finance");
  return {};
}

/** Marks every currently-unpaid video for one editor as paid in one go. Admin-only. */
export async function markEditorPayoutsPaid(editorId: string): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: "Not authorized." };

  await db
    .update(videos)
    .set({ editorPaid: true, updatedAt: new Date() })
    .where(and(eq(videos.editorId, editorId), eq(videos.editorPaid, false)));
  revalidatePath("/");
  revalidatePath("/finance");
  return {};
}

// --- Clients ---

function readClientInput(formData: FormData) {
  const name = str(formData, "name");
  if (!name) return { error: "Client name is required." } as const;

  return {
    data: {
      name,
      company: str(formData, "company"),
      email: str(formData, "email"),
      address: str(formData, "address"),
      notes: str(formData, "notes"),
    },
  } as const;
}

export async function createClient(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: "Not authorized." };

  const result = readClientInput(formData);
  if ("error" in result) return { error: result.error };

  await db.insert(clients).values(result.data);
  revalidatePath("/");
  return {};
}

export async function updateClient(
  id: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: "Not authorized." };

  const result = readClientInput(formData);
  if ("error" in result) return { error: result.error };

  await db.update(clients).set(result.data).where(eq(clients.id, id));
  revalidatePath("/");
  return {};
}

export async function deleteClient(id: string): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: "Not authorized." };

  const [video] = await db
    .select({ id: videos.id })
    .from(videos)
    .where(eq(videos.clientId, id))
    .limit(1);
  if (video) {
    return { error: "This client has videos on file and can't be deleted." };
  }
  await db.delete(clients).where(eq(clients.id, id));
  revalidatePath("/");
  return {};
}

// --- Editors ---

export async function createEditor(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: "Not authorized." };

  const name = str(formData, "name");
  if (!name) return { error: "Editor name is required." };
  const userId = str(formData, "userId");

  await db.insert(editors).values({ name, userId });
  revalidatePath("/");
  return {};
}

export async function updateEditor(
  id: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: "Not authorized." };

  const name = str(formData, "name");
  if (!name) return { error: "Editor name is required." };
  const userId = str(formData, "userId");

  await db.update(editors).set({ name, userId }).where(eq(editors.id, id));
  revalidatePath("/");
  return {};
}

export async function deleteEditor(id: string): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: "Not authorized." };

  const [video] = await db
    .select({ id: videos.id })
    .from(videos)
    .where(eq(videos.editorId, id))
    .limit(1);
  if (video) {
    return { error: "This editor has videos on file and can't be deleted." };
  }
  await db.delete(editors).where(eq(editors.id, id));
  revalidatePath("/");
  return {};
}

// --- Invoices ---

/** Videos for a client, in a date range, not yet on an invoice. */
export async function getInvoiceableVideos(clientId: string, periodStart: string, periodEnd: string) {
  if (!(await isAdmin())) return [];

  return db.query.videos.findMany({
    where: and(
      eq(videos.clientId, clientId),
      isNull(videos.invoiceId),
      gte(videos.date, periodStart),
      lte(videos.date, periodEnd)
    ),
    orderBy: [asc(videos.date)],
  });
}

export async function generateInvoice(formData: FormData): Promise<ActionResult & { id?: string }> {
  if (!(await isAdmin())) return { error: "Not authorized." };

  const clientId = str(formData, "clientId");
  const periodStart = str(formData, "periodStart");
  const periodEnd = str(formData, "periodEnd");
  if (!clientId || !periodStart || !periodEnd) {
    return { error: "Client and period are required." };
  }

  const eligible = await getInvoiceableVideos(clientId, periodStart, periodEnd);
  if (eligible.length === 0) {
    return { error: "No unbilled videos for this client in that period." };
  }

  const subtotal = eligible.reduce((sum, v) => sum + v.price, 0);
  const issueDate = new Date().toISOString().slice(0, 10);
  const invoiceNumber = await nextInvoiceNumber(new Date().getFullYear());

  const [invoice] = await db
    .insert(invoices)
    .values({
      invoiceNumber,
      clientId,
      periodStart,
      periodEnd,
      issueDate,
      subtotal,
    })
    .returning({ id: invoices.id });

  await db
    .update(videos)
    .set({ invoiceId: invoice.id, updatedAt: new Date() })
    .where(
      inArray(
        videos.id,
        eligible.map((v) => v.id)
      )
    );

  revalidatePath("/");
  revalidatePath("/invoices");
  return { id: invoice.id };
}

export async function updateInvoiceStatus(id: string, status: string): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: "Not authorized." };
  if (!INVOICE_STATUSES.includes(status as (typeof INVOICE_STATUSES)[number])) {
    return { error: "Invalid status." };
  }
  await db
    .update(invoices)
    .set({ status: status as (typeof INVOICE_STATUSES)[number] })
    .where(eq(invoices.id, id));

  if (status === "Paid") {
    await db
      .update(videos)
      .set({ progress: "Paid", updatedAt: new Date() })
      .where(eq(videos.invoiceId, id));
  }

  revalidatePath("/invoices");
  revalidatePath("/");
  return {};
}

/** Deleting an invoice frees its videos back up as unbilled. */
export async function deleteInvoice(id: string): Promise<void> {
  if (!(await isAdmin())) return;

  await db.update(videos).set({ invoiceId: null, updatedAt: new Date() }).where(eq(videos.invoiceId, id));
  await db.delete(invoices).where(eq(invoices.id, id));
  revalidatePath("/invoices");
  revalidatePath("/");
}
