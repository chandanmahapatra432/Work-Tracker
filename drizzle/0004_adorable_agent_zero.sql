ALTER TABLE "videos" ADD COLUMN "editor_payout" numeric(10, 2) DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "editor_paid" boolean DEFAULT false NOT NULL;