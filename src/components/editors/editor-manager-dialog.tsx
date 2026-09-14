"use client";

import { useState } from "react";
import { Pencil, Plus, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EditorFormDialog } from "./editor-form-dialog";
import { DeleteEditorButton } from "./delete-editor-button";
import type { Editor, User } from "@/db/schema";

export function EditorManagerDialog({ editors, users }: { editors: Editor[]; users: User[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Editor | null>(null);
  const usersById = new Map(users.map((u) => [u.id, u]));

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <UserCog className="size-4" />
            Editors
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editors</DialogTitle>
            <DialogDescription>Who edits your video work.</DialogDescription>
          </DialogHeader>

          <div className="flex justify-end">
            <EditorFormDialog
              mode="create"
              users={users}
              trigger={
                <Button size="sm">
                  <Plus className="size-4" />
                  Add editor
                </Button>
              }
            />
          </div>

          <div className="max-h-[50vh] space-y-2 overflow-y-auto">
            {editors.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No editors yet.</p>
            ) : (
              editors.map((e) => {
                const linked = e.userId ? usersById.get(e.userId) : undefined;
                return (
                  <div
                    key={e.id}
                    className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{e.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {linked ? linked.email : "No linked login"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => setEditing(e)}>
                        <Pencil className="size-4" />
                      </Button>
                      <DeleteEditorButton id={e.id} name={e.name} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {editing && (
        <EditorFormDialog
          mode="edit"
          editor={editing}
          users={users}
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}
    </>
  );
}
