ALTER TABLE "planicamping_campsite_activity" RENAME COLUMN "useful_duration" TO "Contenu_duration";--> statement-breakpoint
ALTER TABLE "planicamping_campsite_activity" ADD COLUMN "Categories" varchar(255);--> statement-breakpoint
ALTER TABLE "planicamping_campsite_activity" ADD COLUMN "Cibles" varchar(255);--> statement-breakpoint
ALTER TABLE "planicamping_campsite_activity" ADD COLUMN "Contenu" text;--> statement-breakpoint
ALTER TABLE "planicamping_campsite_activity" ADD COLUMN "Contenu_is_weekly" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "planicamping_campsite_activity" ADD COLUMN "Contenu_is_featured" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "planicamping_campsite_activity" ADD COLUMN "Contenu_place" varchar(255);