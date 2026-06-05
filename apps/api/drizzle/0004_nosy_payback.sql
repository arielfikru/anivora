CREATE TABLE "remote_upload_job" (
	"id" text PRIMARY KEY NOT NULL,
	"season_id" text NOT NULL,
	"anime_id" text NOT NULL,
	"source_type" text NOT NULL,
	"source_url" text NOT NULL,
	"is_archive" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"error" text,
	"work_dir" text,
	"bytes_downloaded" bigint DEFAULT 0 NOT NULL,
	"bytes_total" bigint DEFAULT 0 NOT NULL,
	"files" text DEFAULT '[]' NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "remote_upload_job" ADD CONSTRAINT "remote_upload_job_season_id_season_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."season"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "remote_upload_job" ADD CONSTRAINT "remote_upload_job_anime_id_anime_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."anime"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "remote_upload_job" ADD CONSTRAINT "remote_upload_job_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;