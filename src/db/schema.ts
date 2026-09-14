import {
  pgTable,
  pgEnum,
  uuid,
  text,
  date,
  timestamp,
  integer,
  numeric,
  boolean,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { AdapterAccountType } from "next-auth/adapters";

// Auth.js-compatible shape (id/name/email/emailVerified/image) for the
// Auth.js Drizzle adapter. Only emails already present here may sign in —
// this table doubles as the access allowlist. isAdmin can add/remove rows.
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [primaryKey({ columns: [account.provider, account.providerAccountId] })]
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

export const workProgressEnum = pgEnum("work_progress", [
  "Pending",
  "In Progress",
  "Completed",
  "Paid",
]);

export const invoiceStatusEnum = pgEnum("invoice_status", ["Draft", "Sent", "Paid"]);

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  company: text("company"),
  email: text("email"),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// `userId` links this editor to a login account so that account can be
// scoped to only its own videos. Null until an admin links it.
export const editors = pgTable("editors", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "restrict" }),
  periodStart: date("period_start", { mode: "string" }).notNull(),
  periodEnd: date("period_end", { mode: "string" }).notNull(),
  issueDate: date("issue_date", { mode: "string" }).notNull(),
  status: invoiceStatusEnum("status").notNull().default("Draft"),
  subtotal: numeric("subtotal", { precision: 10, scale: 2, mode: "number" }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// A single video/edit job. `invoiceId` is set once it's been pulled onto an
// invoice, so the ledger can tell billed items apart from open ones.
export const videos = pgTable("videos", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  editorId: uuid("editor_id")
    .notNull()
    .references(() => editors.id, { onDelete: "restrict" }),
  price: numeric("price", { precision: 10, scale: 2, mode: "number" }).notNull(),
  // What the editor is owed for this video, and whether that's been settled.
  // Distinct from `price` (what the client is billed) so profit = price - payout.
  // Admin-only in every read and write path — editors never see this.
  editorPayout: numeric("editor_payout", { precision: 10, scale: 2, mode: "number" })
    .notNull()
    .default(0),
  editorPaid: boolean("editor_paid").notNull().default(false),
  date: date("date", { mode: "string" }).notNull(),
  progress: workProgressEnum("progress").notNull().default("Pending"),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "restrict" }),
  invoiceId: uuid("invoice_id").references(() => invoices.id, { onDelete: "set null" }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  videos: many(videos),
  invoices: many(invoices),
}));

export const editorsRelations = relations(editors, ({ one, many }) => ({
  videos: many(videos),
  user: one(users, { fields: [editors.userId], references: [users.id] }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  client: one(clients, { fields: [invoices.clientId], references: [clients.id] }),
  videos: many(videos),
}));

export const videosRelations = relations(videos, ({ one }) => ({
  client: one(clients, { fields: [videos.clientId], references: [clients.id] }),
  editor: one(editors, { fields: [videos.editorId], references: [editors.id] }),
  invoice: one(invoices, { fields: [videos.invoiceId], references: [invoices.id] }),
}));

export type User = typeof users.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type Editor = typeof editors.$inferSelect;
export type NewEditor = typeof editors.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
export type Video = typeof videos.$inferSelect;
export type NewVideo = typeof videos.$inferInsert;
export const WORK_PROGRESS_VALUES = workProgressEnum.enumValues;
export const INVOICE_STATUSES = invoiceStatusEnum.enumValues;
