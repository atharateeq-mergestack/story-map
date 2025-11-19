ALTER TABLE "tours" ADD COLUMN "is_deleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tours" ADD COLUMN "deleted_by" uuid;--> statement-breakpoint
ALTER TABLE "destinations" ADD COLUMN "is_deleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "destinations" ADD COLUMN "deleted_by" uuid;