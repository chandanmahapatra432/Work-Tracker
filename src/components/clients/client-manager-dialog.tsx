"use client";

import { useState } from "react";
import { Pencil, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ClientFormDialog } from "./client-form-dialog";
import { DeleteClientButton } from "./delete-client-button";
import type { Client } from "@/db/schema";

export function ClientManagerDialog({ clients }: { clients: Client[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Users className="size-4" />
            Clients
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Clients</DialogTitle>
            <DialogDescription>Who you bill for video work.</DialogDescription>
          </DialogHeader>

          <div className="flex justify-end">
            <ClientFormDialog
              mode="create"
              trigger={
                <Button size="sm">
                  <Plus className="size-4" />
                  Add client
                </Button>
              }
            />
          </div>

          <div className="max-h-[50vh] space-y-2 overflow-y-auto">
            {clients.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No clients yet.</p>
            ) : (
              clients.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[c.company, c.email].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => setEditing(c)}>
                      <Pencil className="size-4" />
                    </Button>
                    <DeleteClientButton id={c.id} name={c.name} />
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {editing && (
        <ClientFormDialog
          mode="edit"
          client={editing}
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}
    </>
  );
}
