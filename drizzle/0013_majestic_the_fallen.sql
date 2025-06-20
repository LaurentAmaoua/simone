DO $$ BEGIN
 CREATE TYPE "public"."weekday" AS ENUM('Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "planicamping_campsite_activity" ADD COLUMN "useful_date" timestamp;--> statement-breakpoint
ALTER TABLE "planicamping_local_activity" ADD COLUMN "opening_time" time;--> statement-breakpoint
ALTER TABLE "planicamping_local_activity" ADD COLUMN "closing_time" time;--> statement-breakpoint
ALTER TABLE "planicamping_local_activity" ADD COLUMN "open_days" varchar(255)[] DEFAULT '{"Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"}';--> statement-breakpoint
ALTER TABLE "planicamping_must_see_activity" ADD COLUMN "opening_time" time;--> statement-breakpoint
ALTER TABLE "planicamping_must_see_activity" ADD COLUMN "closing_time" time;--> statement-breakpoint
ALTER TABLE "planicamping_must_see_activity" ADD COLUMN "open_days" varchar(255)[] DEFAULT '{"Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"}';