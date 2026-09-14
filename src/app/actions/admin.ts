"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/auth";

export type ActionResult = { error?: string };

export async function addAllowedUser(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.isAdmin) return { error: "Not authorized." };

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email || !email.includes("@")) return { error: "Enter a valid email." };

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (existing) return { error: "That email already has access." };

  await db.insert(users).values({ email });
  revalidatePath("/admin");
  return {};
}

export async function removeAllowedUser(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.isAdmin) return { error: "Not authorized." };
  if (session.user.id === id) return { error: "You can't remove your own access." };

  await db.delete(users).where(eq(users.id, id));
  revalidatePath("/admin");
  return {};
}
