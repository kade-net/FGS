DO $$ BEGIN
 CREATE TYPE "public"."activity_type" AS ENUM('invite', 'accept', 'reject', 'message', 'delivery');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."originator" AS ENUM('user', 'node');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "nodeInbox" (
	"id" text PRIMARY KEY NOT NULL,
	"activity_type" "activity_type" NOT NULL,
	"activity" json NOT NULL,
	"recorded" timestamp DEFAULT now(),
	"signature" text NOT NULL,
	"originator_type" "originator" NOT NULL,
	"originator" text NOT NULL,
	CONSTRAINT "nodeInbox_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "nodeOutbox" (
	"id" text PRIMARY KEY NOT NULL,
	"activity_type" "activity_type" NOT NULL,
	"activity" json NOT NULL,
	"recorded" timestamp DEFAULT now(),
	"signature" text NOT NULL,
	"originator_type" "originator" NOT NULL,
	"originator" text NOT NULL,
	CONSTRAINT "nodeOutbox_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "userInbox" (
	"id" text PRIMARY KEY NOT NULL,
	"activity_type" "activity_type" NOT NULL,
	"activity" json NOT NULL,
	"recorded" timestamp DEFAULT now(),
	"signature" text NOT NULL,
	CONSTRAINT "userInbox_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "userOutbox" (
	"id" text PRIMARY KEY NOT NULL,
	"activity_type" "activity_type" NOT NULL,
	"activity" json NOT NULL,
	"recorded" timestamp DEFAULT now(),
	"signature" text NOT NULL,
	CONSTRAINT "userOutbox_id_unique" UNIQUE("id")
);
