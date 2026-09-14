"use client";

import { useState, type ReactNode } from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import { createEditor, updateEditor, type ActionResult } from "@/app/actions/work";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Editor, User } from "@/db/schema";

const initialState: ActionResult = {};
const UNLINKED = "__unlinked__";

export function EditorFormDialog({
  mode,
  editor,
  users,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  mode: "create" | "edit";
  editor?: Editor;
  users: User[];
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  async function action(prevState: ActionResult, formData: FormData): Promise<ActionResult> {
    if (formData.get("userId") === UNLINKED) formData.set("userId", "");

    const result =
      mode === "edit" && editor
        ? await updateEditor(editor.id, prevState, formData)
        : await createEditor(prevState, formData);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(mode === "edit" ? "Editor updated" : "Editor added");
      setOpen(false);
    }
    return result;
  }

  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-sm">
        <form action={formAction} key={open ? `open-${editor?.id ?? "new"}` : "closed"}>
          <DialogHeader>
            <DialogTitle>{mode === "edit" ? "Edit editor" : "Add editor"}</DialogTitle>
            <DialogDescription>
              {mode === "edit" ? "Update this editor's name." : "Add someone who edits video for you."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {state.error && <p className="text-sm text-destructive">{state.error}</p>}
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={editor?.name ?? ""} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="userId">Linked login</Label>
              <Select name="userId" defaultValue={editor?.userId ?? UNLINKED}>
                <SelectTrigger id="userId">
                  <SelectValue placeholder="No linked login" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNLINKED}>No linked login</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name ?? u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Linking a login scopes that account to only this editor&apos;s videos.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : mode === "edit" ? "Save changes" : "Add editor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
