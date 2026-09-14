import { and, asc, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { videos, clients, editors, users, WORK_PROGRESS_VALUES } from "@/db/schema";
import { WorkLedger } from "@/components/work-ledger";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const session = await auth();
  const isAdmin = !!session?.user?.isAdmin;

  const client = typeof params.client === "string" ? params.client : undefined;
  const editor = typeof params.editor === "string" ? params.editor : undefined;
  const progressParam = typeof params.progress === "string" ? params.progress : undefined;
  const progress =
    progressParam && (WORK_PROGRESS_VALUES as readonly string[]).includes(progressParam)
      ? (progressParam as (typeof WORK_PROGRESS_VALUES)[number])
      : undefined;
  const month = typeof params.month === "string" ? params.month : undefined;

  // Non-admins are scoped to whichever editor profile their account is
  // linked to — they never see anyone else's work, no matter what filters
  // are in the URL.
  let ownEditorId: string | null = null;
  if (!isAdmin && session?.user?.id) {
    const [own] = await db.select({ id: editors.id }).from(editors).where(eq(editors.userId, session.user.id));
    ownEditorId = own?.id ?? null;
  }

  const conditions: SQL[] = [];
  if (client) conditions.push(eq(videos.clientId, client));
  if (isAdmin && editor) conditions.push(eq(videos.editorId, editor));
  if (!isAdmin) conditions.push(eq(videos.editorId, ownEditorId ?? "00000000-0000-0000-0000-000000000000"));
  if (progress) conditions.push(eq(videos.progress, progress));
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [year, mon] = month.split("-").map(Number);
    const start = `${month}-01`;
    const end = new Date(Date.UTC(year, mon, 0)).toISOString().slice(0, 10);
    conditions.push(gte(videos.date, start));
    conditions.push(lte(videos.date, end));
  }

  const [rows, allClients, allEditors, allUsers] = await Promise.all([
    db.query.videos.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      orderBy: [desc(videos.date)],
      with: { client: true, editor: true },
    }),
    db.query.clients.findMany({ orderBy: [asc(clients.name)] }),
    db.query.editors.findMany({ orderBy: [asc(editors.name)] }),
    isAdmin ? db.query.users.findMany({ orderBy: [asc(users.email)] }) : Promise.resolve([]),
  ]);

  return (
    <WorkLedger
      videos={rows}
      clients={allClients}
      editors={allEditors}
      users={allUsers}
      filters={{ client, editor, progress, month }}
      isAdmin={isAdmin}
      unlinkedEditor={!isAdmin && !ownEditorId}
    />
  );
}
