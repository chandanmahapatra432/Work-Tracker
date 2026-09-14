import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, accounts, sessions, verificationTokens } from "@/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Google({
      // Pre-provisioned users are inserted directly (not via a prior OAuth
      // sign-in), so there's no existing "accounts" link for the adapter to
      // find. Safe here because signIn() below already gates on our own
      // allowlist — this only affects emails we ourselves pre-approved.
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    // Only pre-provisioned emails (added by the admin) may sign in — this
    // table doubles as the access allowlist for this personal tool.
    async signIn({ user }) {
      if (!user.email) return false;
      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, user.email));
      return !!existing;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.isAdmin = (user as typeof users.$inferSelect).isAdmin;
      }
      return session;
    },
  },
});
