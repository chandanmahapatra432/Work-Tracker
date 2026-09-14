import Link from "next/link";
import { FileText, Plus, TriangleAlert, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/auth/user-menu";
import { ClientManagerDialog } from "@/components/clients/client-manager-dialog";
import { EditorManagerDialog } from "@/components/editors/editor-manager-dialog";
import { VideoFormDialog } from "@/components/videos/video-form-dialog";
import { WorkFiltersBar } from "@/components/videos/work-filters-bar";
import { VideoTable } from "@/components/videos/video-table";
import type { Client, Editor, User, Video } from "@/db/schema";
import { formatCurrency } from "@/lib/currency";

type VideoWithRelations = Video & { client: Client; editor: Editor };

export function WorkLedger({
  videos,
  clients,
  editors,
  users,
  filters,
  isAdmin,
  unlinkedEditor,
}: {
  videos: VideoWithRelations[];
  clients: Client[];
  editors: Editor[];
  users: User[];
  filters: { client?: string; editor?: string; progress?: string; month?: string };
  isAdmin: boolean;
  unlinkedEditor: boolean;
}) {
  const totalUnbilled = videos.filter((v) => !v.invoiceId).reduce((sum, v) => sum + v.price, 0);
  const totalAll = videos.reduce((sum, v) => sum + v.price, 0);

  return (
    <div className="mx-auto max-w-7xl w-full px-6 py-10 md:px-10 space-y-8">
      <div className="flex justify-end">
        <UserMenu />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">Work Tracker</h1>
          <p className="text-xs text-muted-foreground/70">
            {videos.length} video{videos.length === 1 ? "" : "s"}
            {isAdmin && (
              <>
                {" "}
                · {formatCurrency(totalAll)} total · {formatCurrency(totalUnbilled)} unbilled
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button variant="outline" asChild>
              <Link href="/finance">
                <Wallet className="size-4" />
                Finance
              </Link>
            </Button>
          )}
          {isAdmin && (
            <Button variant="outline" asChild>
              <Link href="/invoices">
                <FileText className="size-4" />
                Invoices
              </Link>
            </Button>
          )}
          {isAdmin && <ClientManagerDialog clients={clients} />}
          {isAdmin && <EditorManagerDialog editors={editors} users={users} />}
          <VideoFormDialog
            mode="create"
            clients={clients}
            editors={editors}
            isAdmin={isAdmin}
            trigger={
              <Button disabled={!isAdmin && unlinkedEditor}>
                <Plus className="size-4" />
                Add video
              </Button>
            }
          />
        </div>
      </div>

      {!isAdmin && unlinkedEditor && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-600/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          <TriangleAlert className="size-4 shrink-0" />
          <span>Your account isn&apos;t linked to an editor profile yet. Ask your admin to link it.</span>
        </div>
      )}

      <WorkFiltersBar clients={clients} editors={editors} filters={filters} isAdmin={isAdmin} />

      <VideoTable videos={videos} clients={clients} editors={editors} isAdmin={isAdmin} />
    </div>
  );
}
