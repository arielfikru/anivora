ALTER TABLE "anime" ADD COLUMN "source_provider" text;--> statement-breakpoint
ALTER TABLE "anime" ADD COLUMN "source_id" text;--> statement-breakpoint
ALTER TABLE "anime" ADD COLUMN "source_url" text;--> statement-breakpoint
ALTER TABLE "episode" ADD COLUMN "source_provider" text;--> statement-breakpoint
ALTER TABLE "episode" ADD COLUMN "source_id" text;--> statement-breakpoint
ALTER TABLE "episode" ADD COLUMN "source_url" text;--> statement-breakpoint
ALTER TABLE "remote_upload_job" ADD COLUMN "source_provider" text;--> statement-breakpoint
ALTER TABLE "remote_upload_job" ADD COLUMN "target_episode_id" text;--> statement-breakpoint
ALTER TABLE "remote_upload_job" ADD CONSTRAINT "remote_upload_job_target_episode_id_episode_id_fk" FOREIGN KEY ("target_episode_id") REFERENCES "public"."episode"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "anime_source_provider_id_unique" ON "anime" USING btree ("source_provider","source_id");--> statement-breakpoint
CREATE UNIQUE INDEX "episode_source_provider_id_unique" ON "episode" USING btree ("source_provider","source_id");