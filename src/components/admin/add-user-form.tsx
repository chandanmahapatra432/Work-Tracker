"use client";

import { useActionState, useRef } from "react";
import { toast } from "sonner";
import { addAllowedUser, type ActionResult } from "@/app/actions/admin";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const initialState: ActionResult = {};

export function AddUserForm() {
  const formRef = useRef<HTMLFormElement>(null);

  async function action(prev: ActionResult, formData: FormData): Promise<ActionResult> {
    const result = await addAllowedUser(prev, formData);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Access granted");
      formRef.current?.reset();
    }
    return result;
  }

  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <div className="flex gap-2">
        <Input
          name="email"
          type="email"
          placeholder="name@gmail.com"
          required
          className="flex-1"
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? "Adding..." : "Grant access"}
        </Button>
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
