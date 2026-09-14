"use client";

import { useState, type ReactNode } from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import { createVideo, updateVideo, type ActionResult } from "@/app/actions/work";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WORK_PROGRESS_VALUES, type Client, type Editor, type Video } from "@/db/schema";

const initialState: ActionResult = {};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function VideoFormDialog({
  mode,
  video,
  clients,
  editors,
  isAdmin,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  mode: "create" | "edit";
  video?: Video;
  clients: Client[];
  editors: Editor[];
  isAdmin: boolean;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  async function action(prevState: ActionResult, formData: FormData): Promise<ActionResult> {
    const result =
      mode === "edit" && video
        ? await updateVideo(video.id, prevState, formData)
        : await createVideo(prevState, formData);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(mode === "edit" ? "Video updated" : "Video added");
      setOpen(false);
    }
    return result;
  }

  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-lg">
        <form action={formAction} key={open ? `open-${video?.updatedAt ?? "new"}` : "closed"}>
          <DialogHeader>
            <DialogTitle>{mode === "edit" ? "Edit video" : "Add video"}</DialogTitle>
            <DialogDescription>
              {mode === "edit" ? "Update this job's details." : "Log a new video job."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-1">
            {state.error && <p className="text-sm text-destructive">{state.error}</p>}

            <div className="grid gap-2">
              <Label htmlFor="name">Video name</Label>
              <Input id="name" name="name" defaultValue={video?.name ?? ""} required />
            </div>

            <div className={isAdmin ? "grid grid-cols-2 gap-4" : "grid gap-2"}>
              {isAdmin && (
                <div className="grid gap-2">
                  <Label htmlFor="editorId">Editor</Label>
                  <Select name="editorId" defaultValue={video?.editorId ?? undefined}>
                    <SelectTrigger id="editorId">
                      <SelectValue placeholder="Select an editor" />
                    </SelectTrigger>
                    <SelectContent>
                      {editors.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {editors.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Add an editor first from the Editors button.
                    </p>
                  )}
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="clientId">Client</Label>
                <Select name="clientId" defaultValue={video?.clientId ?? undefined}>
                  <SelectTrigger id="clientId">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {clients.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Add a client first from the Clients button.
                  </p>
                )}
              </div>
            </div>

            <div className={isAdmin ? "grid grid-cols-3 gap-4" : "grid gap-2"}>
              {isAdmin && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="price">Price (INR)</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={video?.price ?? ""}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="editorPayout">Editor payout (INR)</Label>
                    <Input
                      id="editorPayout"
                      name="editorPayout"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={video?.editorPayout ?? ""}
                      required
                    />
                  </div>
                </>
              )}
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  defaultValue={video?.date ?? today()}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="progress">Progress</Label>
              <Select name="progress" defaultValue={video?.progress ?? "Pending"}>
                <SelectTrigger id="progress">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WORK_PROGRESS_VALUES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" rows={3} defaultValue={video?.notes ?? ""} />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={isPending || clients.length === 0 || (isAdmin && editors.length === 0)}
            >
              {isPending ? "Saving..." : mode === "edit" ? "Save changes" : "Add video"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
