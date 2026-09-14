"use client";

import { useState, type ReactNode } from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import { createClient, updateClient, type ActionResult } from "@/app/actions/work";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Client } from "@/db/schema";

const initialState: ActionResult = {};

export function ClientFormDialog({
  mode,
  client,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  mode: "create" | "edit";
  client?: Client;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  async function action(prevState: ActionResult, formData: FormData): Promise<ActionResult> {
    const result =
      mode === "edit" && client
        ? await updateClient(client.id, prevState, formData)
        : await createClient(prevState, formData);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(mode === "edit" ? "Client updated" : "Client added");
      setOpen(false);
    }
    return result;
  }

  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <form action={formAction} key={open ? `open-${client?.id ?? "new"}` : "closed"}>
          <DialogHeader>
            <DialogTitle>{mode === "edit" ? "Edit client" : "Add client"}</DialogTitle>
            <DialogDescription>
              {mode === "edit" ? "Update this client's details." : "Add a client you invoice."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {state.error && <p className="text-sm text-destructive">{state.error}</p>}
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={client?.name ?? ""} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="company">Company</Label>
                <Input id="company" name="company" defaultValue={client?.company ?? ""} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={client?.email ?? ""} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Billing address</Label>
              <Textarea id="address" name="address" rows={2} defaultValue={client?.address ?? ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" rows={2} defaultValue={client?.notes ?? ""} />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : mode === "edit" ? "Save changes" : "Add client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
