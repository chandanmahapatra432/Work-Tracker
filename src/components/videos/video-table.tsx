"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressSelect } from "./progress-select";
import { PayoutPaidToggle } from "./payout-paid-toggle";
import { DeleteVideoButton } from "./delete-video-button";
import { VideoFormDialog } from "./video-form-dialog";
import type { Client, Editor, Video } from "@/db/schema";
import { formatCurrency } from "@/lib/currency";

type VideoWithRelations = Video & { client: Client; editor: Editor };

export function VideoTable({
  videos,
  clients,
  editors,
  isAdmin,
}: {
  videos: VideoWithRelations[];
  clients: Client[];
  editors: Editor[];
  isAdmin: boolean;
}) {
  const [editing, setEditing] = useState<VideoWithRelations | null>(null);
  const columnCount = isAdmin ? 8 : 6;

  return (
    <>
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Video</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Editor</TableHead>
              <TableHead>Date</TableHead>
              {isAdmin && (
                <>
                  <TableHead>Price</TableHead>
                  <TableHead>Payout</TableHead>
                </>
              )}
              <TableHead>Progress</TableHead>
              <TableHead className="w-0" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {videos.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columnCount} className="h-28 text-center text-muted-foreground">
                  No videos yet. Add your first one to get started.
                </TableCell>
              </TableRow>
            ) : (
              videos.map((v) => {
                const billed = !!v.invoiceId;
                return (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.name}</TableCell>
                    <TableCell>{v.client.name}</TableCell>
                    <TableCell>{v.editor.name}</TableCell>
                    <TableCell>{v.date}</TableCell>
                    {isAdmin && (
                      <>
                        <TableCell>{formatCurrency(v.price)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{formatCurrency(v.editorPayout)}</span>
                            <PayoutPaidToggle id={v.id} paid={v.editorPaid} />
                          </div>
                        </TableCell>
                      </>
                    )}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ProgressSelect id={v.id} progress={v.progress} />
                        {isAdmin && billed && (
                          <Badge variant="secondary" className="font-normal">
                            Invoiced
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => setEditing(v)}>
                          <Pencil className="size-4" />
                        </Button>
                        <DeleteVideoButton id={v.id} name={v.name} disabled={billed} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {editing && (
        <VideoFormDialog
          mode="edit"
          video={editing}
          clients={clients}
          editors={editors}
          isAdmin={isAdmin}
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}
    </>
  );
}
