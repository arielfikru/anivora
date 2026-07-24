CREATE TABLE "content_sync_state" (
	"provider" text PRIMARY KEY NOT NULL,
	"initial_sync_completed" boolean DEFAULT false NOT NULL,
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
