ALTER TABLE "tours" ADD COLUMN "start_date" date;--> statement-breakpoint
ALTER TABLE "tours" ADD COLUMN "end_date" date;--> statement-breakpoint
ALTER TABLE "tours" ADD COLUMN "start_location" varchar(255);--> statement-breakpoint
ALTER TABLE "tours" ADD COLUMN "end_location" varchar(255);--> statement-breakpoint
ALTER TABLE "tours" DROP COLUMN "start_form";--> statement-breakpoint
ALTER TABLE "tours" DROP COLUMN "end_form";